"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/dialog";
import { Card, EmptyState, Input } from "@/components/admin/ui";
import { deleteRecord, patchRecord, reorderRecords, saveRecord } from "@/lib/actions/admin";
import { uploadFile } from "@/lib/storage";
import { IMAGE_TYPES } from "@/lib/validation/admin";
import type { ProjectImage } from "@/lib/types";

export function ScreenshotsManager({ projectId, images }: { projectId: string; images: ProjectImage[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [deleting, setDeleting] = useState<ProjectImage | null>(null);
  const [pending, start] = useTransition();

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 12);
    setUploading(list.length);
    let ok = 0;
    for (const file of list) {
      try {
        const { url } = await uploadFile(file, "media", `projects/${projectId}`);
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Project screenshot";
        const res = await saveRecord("project_images", null, { project_id: projectId, url, alt, caption: "" });
        if (!res.ok) throw new Error(res.error);
        ok++;
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (ok) toast.success(`${ok} screenshot${ok > 1 ? "s" : ""} added — remember to write good alt text`);
    if (input.current) input.current.value = "";
    router.refresh();
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...images];
    const t = index + dir;
    if (t < 0 || t >= next.length) return;
    [next[index], next[t]] = [next[t], next[index]];
    start(async () => {
      const res = await reorderRecords("project_images", next.map((i) => i.id));
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  };

  const saveMeta = (img: ProjectImage, field: "alt" | "caption", value: string) => {
    if ((img[field] ?? "") === value) return;
    start(async () => {
      const res = await patchRecord("project_images", img.id, { [field]: value });
      if (res.ok) {
        toast.success(field === "alt" ? "Alt text saved" : "Caption saved");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Screenshots</h2>
          <p className="mt-0.5 text-sm text-muted">Shown in a gallery on the case-study page. Never upload confidential employer screens.</p>
        </div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading > 0}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {uploading ? `Uploading ${uploading}…` : "Add screenshots"}
        </button>
        <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} multiple className="sr-only" tabIndex={-1} aria-label="Add screenshots" onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="mt-5">
        {images.length === 0 ? (
          <EmptyState title="No screenshots yet" description="Upload JPEG, PNG, WebP or AVIF images up to 5 MB each." />
        ) : (
          <ul className="space-y-3">
            {images.map((img, i) => (
              <li key={img.id} className="flex flex-col gap-3 rounded-lg border border-line p-3 sm:flex-row sm:items-center">
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-md bg-subtle sm:w-40">
                  <Image src={img.url} alt={img.alt} fill sizes="160px" className="object-cover" unoptimized />
                </div>
                <div className="grid flex-1 gap-2">
                  <Input defaultValue={img.alt} aria-label="Alt text" placeholder="Alt text (required)" onBlur={(e) => saveMeta(img, "alt", e.target.value)} />
                  <Input defaultValue={img.caption ?? ""} aria-label="Caption" placeholder="Caption (optional)" onBlur={(e) => saveMeta(img, "caption", e.target.value)} />
                </div>
                <div className="flex shrink-0 gap-0.5 self-end sm:self-center">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || pending} className="rounded-md p-2 text-muted hover:bg-subtle disabled:opacity-30" aria-label="Move up">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1 || pending} className="rounded-md p-2 text-muted hover:bg-subtle disabled:opacity-30" aria-label="Move down">
                    <ArrowDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => setDeleting(img)} className="rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label="Delete screenshot">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        busy={pending}
        title="Remove this screenshot?"
        description="It will be removed from the case study. The file stays in your media library until you delete it there."
        confirmLabel="Remove"
        onConfirm={() =>
          deleting &&
          start(async () => {
            const res = await deleteRecord("project_images", deleting.id);
            if (res.ok) {
              toast.success("Screenshot removed");
              setDeleting(null);
              router.refresh();
            } else toast.error(res.error);
          })
        }
      />
    </Card>
  );
}
