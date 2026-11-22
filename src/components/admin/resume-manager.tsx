"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/dialog";
import { Badge, Card, EmptyState } from "@/components/admin/ui";
import { patchRecord } from "@/lib/actions/admin";
import { formatBytes, listFiles, removeFile, uploadFile, type StoredFile } from "@/lib/storage";

export function ResumeManager({ profileId, currentUrl, currentName }: { profileId: string; currentUrl: string | null; currentName: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<StoredFile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<StoredFile | null>(null);
  const [pending, start] = useTransition();

  const load = useCallback(async () => {
    try {
      setFiles(await listFiles("documents", "resume"));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Couldn't load files");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const activate = async (url: string, name: string) => {
    const res = await patchRecord("profiles", profileId, { resume_url: url, resume_file_name: name });
    if (!res.ok) throw new Error(res.error);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadFile(file, "documents", "resume");
      await activate(url, file.name);
      toast.success("Resume replaced — the Download Resume button now serves the new file");
      await load();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <FileText className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{currentName ?? "No resume uploaded"}</p>
              {currentUrl ? (
                <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm break-all text-accent">
                  Open current file
                </a>
              ) : null}
              <p className="mt-1 text-xs text-muted">
                Visitors always use the stable link <code className="font-mono">/resume</code>, which points to the active file.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
            {busy ? "Uploading…" : "Upload new resume"}
          </button>
          <input ref={input} type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} aria-label="Upload new resume" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        <p className="mt-4 text-xs text-muted">PDF only, up to 10 MB.</p>
      </Card>

      <section>
        <h2 className="mb-3 font-semibold">Previous versions</h2>
        {loadError ? (
          <p className="text-sm text-danger">{loadError}</p>
        ) : files === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : files.length === 0 ? (
          <EmptyState title="No uploaded versions yet" description="The site is currently using the resume bundled with the code." />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {files.map((f) => {
              const active = f.url === currentUrl;
              return (
                <li key={f.path} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="block truncate font-medium hover:text-accent">
                      {f.name}
                    </a>
                    <p className="text-xs text-muted">
                      {formatBytes(f.size)}
                      {f.createdAt ? ` · ${new Date(f.createdAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  {active ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            try {
                              await activate(f.url, f.name.replace(/^[a-f0-9]{8}-/, ""));
                              toast.success("Resume version activated");
                              router.refresh();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed");
                            }
                          })
                        }
                        className="rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-subtle"
                      >
                        Use this version
                      </button>
                      <button type="button" onClick={() => setDeleting(f)} className="rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${f.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        busy={pending}
        title="Delete this resume version?"
        description="The file will be permanently removed from storage."
        onConfirm={() =>
          deleting &&
          start(async () => {
            try {
              await removeFile("documents", deleting.path);
              toast.success("File deleted");
              setDeleting(null);
              await load();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Delete failed");
            }
          })
        }
      />
    </div>
  );
}
