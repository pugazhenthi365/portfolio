"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { getPortfolioContent } from "@/lib/content/repository";
import { contactSchema, type ContactInput, type ContactResult } from "@/lib/validation/contact";

const MIN_FILL_MS = 2500;

export async function submitContactMessage(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const data = parsed.data;

  // Bots typically fill hidden fields or submit instantly. Pretend success so they learn nothing.
  if (data.website || Date.now() - data.startedAt < MIN_FILL_MS) {
    return { ok: true };
  }

  if (!isSupabaseConfigured) {
    return {
      ok: false,
      code: "not_configured",
      message: "The contact form isn't connected yet. Please email me directly instead.",
    };
  }

  const { settings } = await getPortfolioContent();
  if (!settings.contact_form_enabled) {
    return { ok: false, code: "disabled", message: "The contact form is currently closed. Please email me directly." };
  }

  const db = createPublicClient();
  // Insert-only: RLS lets anonymous visitors insert a message but never read one back.
  const { error } = await db.from("contact_messages").insert({
    name: data.name,
    email: data.email.toLowerCase(),
    subject: data.subject || null,
    message: data.message,
  });

  if (error) {
    console.error("[contact] insert failed:", error.message);
    // Rate-limit trigger raises with this code (see migrations).
    if (error.message.includes("rate_limited")) {
      return { ok: false, code: "spam", message: "You've sent several messages recently. Please try again later." };
    }
    return { ok: false, code: "server", message: "Something went wrong sending your message. Please email me directly." };
  }

  return { ok: true };
}
