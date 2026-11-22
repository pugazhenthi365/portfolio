"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/dialog";
import { Badge, EmptyState, Select } from "@/components/admin/ui";
import { deleteRecord, patchRecord } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import type { ContactMessage } from "@/lib/types";

export function MessagesInbox({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"active" | "new" | "archived" | "all">("active");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);
  const [pending, start] = useTransition();

  const list = messages.filter((m) =>
    filter === "all" ? true : filter === "active" ? m.status !== "archived" : m.status === filter,
  );

  const setStatus = (m: ContactMessage, status: ContactMessage["status"], quiet = false) =>
    start(async () => {
      const res = await patchRecord("contact_messages", m.id, { status });
      if (res.ok) {
        if (!quiet) toast.success(status === "archived" ? "Archived" : status === "new" ? "Marked unread" : "Marked read");
        router.refresh();
      } else toast.error(res.error);
    });

  const open = (m: ContactMessage) => {
    setOpenId(openId === m.id ? null : m.id);
    if (m.status === "new") setStatus(m, "read", true);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-48" aria-label="Filter messages">
          <option value="active">Inbox</option>
          <option value="new">Unread</option>
          <option value="archived">Archived</option>
          <option value="all">All messages</option>
        </Select>
        <span className="text-sm text-muted">{list.length} shown</span>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No messages here" description="Messages sent through your contact form appear in this inbox." />
      ) : (
        <ul className={cn("divide-y divide-line overflow-hidden rounded-lg border border-line bg-bg", pending && "opacity-80")}>
          {list.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => open(m)} aria-expanded={openId === m.id} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-subtle/60">
                {m.status === "new" ? <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-label="Unread" /> : <MailOpen className="mt-0.5 size-4 shrink-0 text-faint" aria-label="Read" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className={cn("truncate text-sm", m.status === "new" ? "font-semibold" : "font-medium")}>{m.name}</p>
                    <time className="shrink-0 text-xs text-muted" dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="truncate text-sm text-muted">{m.subject || m.message.slice(0, 90)}</p>
                </div>
                {m.status === "archived" ? <Badge>Archived</Badge> : null}
              </button>
              {openId === m.id ? (
                <div className="border-t border-line bg-subtle/40 px-4 py-4 sm:pl-11">
                  <p className="text-sm">
                    <a href={`mailto:${m.email}`} className="font-medium text-accent">
                      {m.email}
                    </a>
                  </p>
                  {m.subject ? <p className="mt-2 text-sm font-medium">{m.subject}</p> : null}
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-fg">{m.message}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message"}`)}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-accent-fg"
                    >
                      <Reply className="size-3.5" aria-hidden /> Reply by email
                    </a>
                    <button type="button" onClick={() => setStatus(m, m.status === "archived" ? "read" : "archived")} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-xs font-medium hover:bg-bg">
                      <Archive className="size-3.5" aria-hidden /> {m.status === "archived" ? "Unarchive" : "Archive"}
                    </button>
                    <button type="button" onClick={() => setStatus(m, "new")} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-xs font-medium hover:bg-bg">
                      <Mail className="size-3.5" aria-hidden /> Mark unread
                    </button>
                    <button type="button" onClick={() => setDeleting(m)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-xs font-medium text-danger hover:bg-danger/5">
                      <Trash2 className="size-3.5" aria-hidden /> Delete
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        busy={pending}
        title="Delete this message?"
        description="The message will be permanently deleted."
        onConfirm={() =>
          deleting &&
          start(async () => {
            const res = await deleteRecord("contact_messages", deleting.id);
            if (res.ok) {
              toast.success("Message deleted");
              setDeleting(null);
              router.refresh();
            } else toast.error(res.error);
          })
        }
      />
    </div>
  );
}
