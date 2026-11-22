"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/storage";
import { IMAGE_TYPES } from "@/lib/validation/admin";
import { cn } from "@/lib/utils";

/**
 * Picks an image, uploads it to the `media` bucket and reports the public URL.
 * The caller decides what to do with the URL (form field, server action...).
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Upload image",
  aspect = "aspect-[16/10]",
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void | Promise<void>;
  folder: string;
  label?: string;
  aspect?: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadFile(file, "media", folder);
      await onChange(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border border-dashed bg-subtle transition-colors",
          aspect,
          dragging ? "border-accent bg-accent-soft" : "border-line-strong",
        )}
      >
        {value ? (
          <Image src={value} alt="" fill sizes="480px" className="object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted hover:text-fg"
          >
            <ImagePlus className="size-6" aria-hidden />
            {label}
            <span className="text-xs text-muted">JPEG, PNG, WebP or AVIF · max 5 MB</span>
          </button>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70">
            <Loader2 className="size-6 animate-spin text-accent" aria-label="Uploading" />
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-xs font-medium text-fg hover:bg-subtle disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" aria-hidden /> {value ? "Replace" : "Choose file"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-xs font-medium text-danger hover:bg-danger/5 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden /> Remove
          </button>
        ) : null}
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}
