"use client";

import { getBrowserClient } from "@/lib/supabase/browser";
import { validateUpload } from "@/lib/validation/admin";

export type Bucket = "media" | "documents";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

/**
 * Uploads a file straight from the browser to Supabase Storage.
 * Authorisation is enforced by Storage RLS (admins only) and bucket limits
 * (MIME type + size) — the client-side check here is for fast feedback.
 */
export async function uploadFile(file: File, bucket: Bucket, folder: string) {
  const problem = validateUpload(file, bucket === "documents" ? "pdf" : "image");
  if (problem) throw new Error(problem);

  const supabase = getBrowserClient();
  const id = crypto.randomUUID().slice(0, 8);
  const path = `${folder}/${new Date().getFullYear()}/${id}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function removeFile(bucket: Bucket, path: string) {
  const { error } = await getBrowserClient().storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}

export type StoredFile = { bucket: Bucket; path: string; name: string; size: number; createdAt: string | null; url: string; mimetype: string | null };

/** Recursively lists files under a folder (up to 4 levels deep). */
export async function listFiles(bucket: Bucket, folder: string, depth = 0): Promise<StoredFile[]> {
  const storage = getBrowserClient().storage.from(bucket);
  const { data, error } = await storage.list(folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw new Error(error.message);
  const out: StoredFile[] = [];
  for (const entry of data ?? []) {
    const path = `${folder}/${entry.name}`;
    if (!entry.id) {
      if (depth < 3) out.push(...(await listFiles(bucket, path, depth + 1)));
      continue;
    }
    if (entry.name === ".emptyFolderPlaceholder") continue;
    const meta = (entry.metadata ?? {}) as { size?: number; mimetype?: string };
    out.push({
      bucket,
      path,
      name: entry.name,
      size: meta.size ?? 0,
      createdAt: entry.created_at ?? null,
      url: storage.getPublicUrl(path).data.publicUrl,
      mimetype: meta.mimetype ?? null,
    });
  }
  return depth === 0 ? out.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")) : out;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
