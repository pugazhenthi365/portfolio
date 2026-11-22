"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — the mailto link still works */
        }
      }}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-fg"
      aria-label={copied ? "Email address copied" : "Copy email address"}
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  );
}
