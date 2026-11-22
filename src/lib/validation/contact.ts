import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100, "Name is too long."),
  email: z.string().trim().pipe(z.email("Please enter a valid email address.").max(200, "Email is too long.")),
  subject: z.string().trim().max(150, "Subject is too long.").optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters.")
    .max(5000, "Message is too long (5,000 characters max)."),
  // Spam traps: a hidden field humans never fill and the time the form was rendered.
  website: z.string().max(0).optional().or(z.literal("")),
  startedAt: z.number().int().positive(),
});

/** Fields the visitor actually types (used by the client-side form). */
export const contactFormSchema = contactSchema.pick({ name: true, email: true, subject: true, message: true });
export type ContactFormValues = z.infer<typeof contactFormSchema>;

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult =
  | { ok: true }
  | { ok: false; code: "validation" | "not_configured" | "disabled" | "spam" | "server"; message: string };
