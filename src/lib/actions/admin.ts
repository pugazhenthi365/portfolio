"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CONTENT_TAG } from "@/lib/content/repository";
import { requireAdminAction, UnauthorizedError } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  deletableEntities,
  entitySchemas,
  patchSchemas,
  sortableEntities,
  type DeletableEntity,
  type EntityName,
  type PatchableEntity,
  type SortableEntity,
} from "@/lib/validation/admin";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/* Every content mutation ends here: public pages re-render on the next request. */
function invalidatePublicContent() {
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof UnauthorizedError) return { ok: false, error: "Your session has expired. Please sign in again." };
  const message = error instanceof Error ? error.message : String(error);
  console.error("[admin action]", message);
  if (/duplicate key.*slug/i.test(message)) return { ok: false, error: "That slug is already used by another project." };
  if (/duplicate key/i.test(message)) return { ok: false, error: "An item with that name already exists." };
  if (/row-level security|permission denied/i.test(message)) return { ok: false, error: "You don't have permission to do that." };
  return { ok: false, error: "Something went wrong. Please try again." };
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}

const idSchema = z.uuid();

// ─── Create / update ───────────────────────────────────────────────────
export async function saveRecord(
  entity: EntityName,
  id: string | null,
  values: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdminAction();
    const schema = entitySchemas[entity];
    if (!schema) return { ok: false, error: "Unknown content type." };

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    }
    const row = parsed.data as Record<string, unknown>;

    if (id) {
      if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid id." };
      const { error } = await supabase.from(entity).update(row).eq("id", id);
      if (error) throw new Error(error.message);
      invalidatePublicContent();
      return { ok: true, data: { id } };
    }

    if (entity === "profiles" || entity === "site_settings") {
      return { ok: false, error: "This record already exists — edit it instead." };
    }

    // New sortable items go to the end of their list.
    if ((sortableEntities as readonly string[]).includes(entity)) {
      let q = supabase.from(entity).select("sort_order").order("sort_order", { ascending: false }).limit(1);
      if (entity === "skills") q = q.eq("category_id", row.category_id as string);
      if (entity === "project_images") q = q.eq("project_id", row.project_id as string);
      const { data: last } = await q.maybeSingle();
      row.sort_order = ((last as { sort_order?: number } | null)?.sort_order ?? 0) + 1;
    }

    const { data, error } = await supabase.from(entity).insert(row).select("id").single();
    if (error) throw new Error(error.message);
    invalidatePublicContent();
    return { ok: true, data: { id: (data as { id: string }).id } };
  } catch (error) {
    return fail(error);
  }
}

// ─── Partial update (toggles, media) ───────────────────────────────────
export async function patchRecord(entity: PatchableEntity, id: string, patch: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const schema = patchSchemas[entity];
    if (!schema || !idSchema.safeParse(id).success) return { ok: false, error: "Invalid request." };
    const parsed = schema.safeParse(patch);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid value." };
    if (!Object.keys(parsed.data).length) return { ok: false, error: "Nothing to update." };

    const { error } = await supabase.from(entity).update(parsed.data).eq("id", id);
    if (error) throw new Error(error.message);
    if (entity !== "contact_messages") invalidatePublicContent();
    else revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Delete ────────────────────────────────────────────────────────────
export async function deleteRecord(entity: DeletableEntity, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!(deletableEntities as readonly string[]).includes(entity) || !idSchema.safeParse(id).success) {
      return { ok: false, error: "Invalid request." };
    }
    const { error, count } = await supabase.from(entity).delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    if (!count) return { ok: false, error: "Item not found or already deleted." };
    if (entity !== "contact_messages") invalidatePublicContent();
    else revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Reorder ───────────────────────────────────────────────────────────
export async function reorderRecords(entity: SortableEntity, orderedIds: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!(sortableEntities as readonly string[]).includes(entity)) return { ok: false, error: "Invalid request." };
    const ids = z.array(z.uuid()).max(500).safeParse(orderedIds);
    if (!ids.success) return { ok: false, error: "Invalid order." };

    const results = await Promise.all(
      ids.data.map((id, index) => supabase.from(entity).update({ sort_order: index + 1 }).eq("id", id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    invalidatePublicContent();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Called after a file is uploaded/removed in Storage so pages pick up new URLs. */
export async function refreshPublicContent(): Promise<ActionResult> {
  try {
    await requireAdminAction();
    invalidatePublicContent();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ─── Authentication ────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export async function signIn(values: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase is not configured." };
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid credentials." };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for unknown email / wrong password to avoid account enumeration.
  if (error) return { ok: false, error: "Invalid email or password." };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account is not authorised to access the dashboard." };
  }
  return { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
