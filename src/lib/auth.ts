import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export type AdminContext = {
  supabase: Awaited<ReturnType<typeof createSessionClient>>;
  user: { id: string; email: string | null };
};

/**
 * Verifies the current request belongs to an authenticated administrator.
 * Uses getUser() (validated by the Supabase Auth server) and checks the
 * admin_profiles table through the is_admin() database function.
 * Memoised per request.
 */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return null;

  return { supabase, user: { id: user.id, email: user.email ?? null } };
});

/** For admin pages/layouts: redirects to the login page when not authorised. */
export async function requireAdminPage(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authorised");
  }
}

/** For Server Actions: throws when the caller is not an administrator. */
export async function requireAdminAction(): Promise<AdminContext> {
  const admin = await getAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}
