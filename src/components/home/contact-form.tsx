"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitContactMessage } from "@/lib/actions/contact";
import { contactFormSchema, type ContactFormValues } from "@/lib/validation/contact";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-[3px] border border-line bg-bg px-3.5 py-3 text-[0.95rem] text-fg placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent/20 aria-[invalid=true]:border-danger";

export function ContactForm({ email }: { email: string }) {
  const startedAt = useRef<number>(0);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setStatus(null);
    try {
      const res = await submitContactMessage({ ...values, website: honeypot, startedAt: startedAt.current || 1 });
      if (res.ok) {
        reset();
        startedAt.current = Date.now();
        setStatus({ type: "success", message: "Thank you — your message has been sent. I'll reply by email." });
      } else {
        setStatus({ type: "error", message: res.message });
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again, or email me directly." });
    }
  };

  const err = (name: keyof ContactFormValues) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1.5 text-sm text-danger">
        {errors[name]?.message}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-describedby="contact-status">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label mb-2 block">
            Name
          </label>
          <input
            id="name"
            autoComplete="name"
            className={field}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="label mb-2 block">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={field}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {err("email")}
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="label mb-2 block">
          Subject <span className="normal-case tracking-normal text-muted">(optional)</span>
        </label>
        <input id="subject" className={field} aria-invalid={!!errors.subject} {...register("subject")} />
        {err("subject")}
      </div>
      <div>
        <label htmlFor="message" className="label mb-2 block">
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          className={cn(field, "resize-y")}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {err("message")}
      </div>

      {/* Honeypot — hidden from people and assistive tech. */}
      <div aria-hidden className="absolute left-[-10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div className="flex flex-col-reverse items-start gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Prefer email?{" "}
          <a href={`mailto:${email}`} className="link-underline text-fg">
            {email}
          </a>
        </p>
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
            </>
          ) : (
            <>
              Send message <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" aria-hidden />
            </>
          )}
        </Button>
      </div>

      <div id="contact-status" aria-live="polite" role="status">
        <AnimatePresence>
          {status ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex items-start gap-2.5 rounded-[3px] border px-4 py-3 text-sm",
                status.type === "success"
                  ? "border-success/30 bg-success/5 text-fg"
                  : "border-danger/30 bg-danger/5 text-fg",
              )}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              )}
              {status.message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
