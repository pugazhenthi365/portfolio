"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, FileText, ImagePlus, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/dialog";
import { EmptyState, Input, Select } from "@/components/admin/ui";
import { refreshPublicContent } from "@/lib/actions/admin";
import { formatBytes, listFiles, removeFile, uploadFile, type Bucket, type StoredFile } from "@/lib/storage";
import { IMAGE_TYPES } from "@/lib/validation/admin";

const FOLDERS: { value: string; label: string; bucket: Bucket }[] = [
  { value: "media:projects", label: "Project images", bucket: "media" },
  { value: "media:profile", label: "Profile photos", bucket: "media" },
  { value: "media:general", label: "Other assets", bucket: "media" },
  { value: "documents:resume", label: "Resume PDFs", bucket: "documents" },
];

export function MediaLibrary() {
  const [folder, setFolder] = useState(FOLDERS[0].value);
  const [files, setFiles] = useState<StoredFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<StoredFile | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const [bucket, path] = folder.split(":") as [Bucket, string];

  const load = useCallback(async () => {
    setFiles(null);
    try {
      setFiles(await listFiles(bucket, path));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load files");
      setFiles([]);
    }
  }, [bucket, path]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (files ?? []).filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase())),
    [files, query],
  );

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(list).slice(0, 20)) {
      try {
        await uploadFile(file, bucket, path);
        ok++;
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    if (ok) toast.success(`${ok} file${ok > 1 ? "s" : ""} uploaded`);
    setUploading(false);
    if (input.current) input.current.value = "";
    load();
  };

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[auto_1fr_auto_auto]">
        <Select value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Folder">
          {FOLDERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files…" className="pl-9" aria-label="Search files" />
        </div>
        <button type="button" onClick={load} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm hover:bg-subtle" aria-label="Refresh">
          <RefreshCw className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          Upload
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept={bucket === "documents" ? "application/pdf,.pdf" : IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload files"
          onChange={(e) => upload(e.target.files)}
        />
      </div>
      <p className="mb-4 text-xs text-muted">
        {bucket === "documents" ? "PDF only, up to 10 MB." : "JPEG, PNG, WebP or AVIF, up to 5 MB each."} Files are publicly readable by URL; only you can upload or delete.
      </p>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      {files === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-subtle" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title={query ? "No files match" : "This folder is empty"} description="Uploaded files appear here." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((f) => (
            <li key={f.path} className="group overflow-hidden rounded-lg border border-line bg-bg">
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] bg-subtle">
                {f.mimetype?.startsWith("image/") ? (
                  <Image src={f.url} alt={f.name} fill sizes="240px" className="object-cover" unoptimized />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-muted">
                    <FileText className="size-8" aria-hidden />
                  </span>
                )}
              </a>
              <div className="p-2.5">
                <p className="truncate text-xs font-medium" title={f.name}>
                  {f.name}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[0.7rem] text-muted">{formatBytes(f.size)}</span>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(f.url).then(() => toast.success("URL copied"))}
                      className="rounded p-1.5 text-muted hover:bg-subtle hover:text-fg"
                      aria-label={`Copy URL of ${f.name}`}
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(f)}
                      className="rounded p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete ${f.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        busy={busy}
        title="Delete this file?"
        description="If a project, your profile or your resume still uses this file, that image or link will break. This can't be undone."
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await removeFile(deleting.bucket, deleting.path);
            await refreshPublicContent();
            toast.success("File deleted");
            setDeleting(null);
            load();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
