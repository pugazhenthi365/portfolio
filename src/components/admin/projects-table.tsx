"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, Pencil, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/dialog";
import { Badge, EmptyState, Input, Select } from "@/components/admin/ui";
import { deleteRecord, patchRecord, reorderRecords } from "@/lib/actions/admin";
import { cn, projectStatusLabel } from "@/lib/utils";
import type { Project, PublicationStatus } from "@/lib/types";

const statusTone = { published: "success", draft: "warning", archived: "neutral" } as const;

export function ProjectsTable({ projects, initialStatus }: { projects: Project[]; initialStatus: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState("all");
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [pending, start] = useTransition();

  const categories = useMemo(() => Array.from(new Set(projects.map((p) => p.category))).sort(), [projects]);
  const filtering = query.trim() !== "" || status !== "all" || category !== "all";

  const filtered = projects.filter((p) => {
    const q = query.trim().toLowerCase();
    return (
      (!q || `${p.title} ${p.slug} ${p.category}`.toLowerCase().includes(q)) &&
      (status === "all" || p.publication_status === status) &&
      (category === "all" || p.category === category)
    );
  });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(res.error ?? "Something went wrong");
    });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...projects];
    const t = index + dir;
    if (t < 0 || t >= next.length) return;
    [next[index], next[t]] = [next[t], next[index]];
    run(() => reorderRecords("projects", next.map((p) => p.id)), "Order updated");
  };

  const setPublication = (p: Project, s: PublicationStatus) =>
    run(() => patchRecord("projects", p.id, { publication_status: s }), s === "published" ? "Published — now live" : `Moved to ${s}`);

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="pl-9" aria-label="Search projects" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project — it starts as a draft."
          action={
            <Link href="/admin/projects/new" className="text-sm font-medium text-accent">
              New project
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No projects match these filters" />
      ) : (
        <div className={cn("overflow-hidden rounded-lg border border-line bg-bg", pending && "opacity-70")}>
          {/* Desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-line bg-subtle text-left text-xs text-muted">
              <tr>
                <th className="w-14 px-3 py-2.5 font-medium">
                  <span className="sr-only">Order</span>
                </th>
                <th className="px-3 py-2.5 font-medium">Project</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Featured</th>
                <th className="px-3 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const index = projects.indexOf(p);
                return (
                  <tr key={p.id} className="align-middle">
                    <td className="px-3 py-2">
                      {!filtering ? (
                        <div className="flex flex-col">
                          <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || pending} className="rounded p-0.5 text-faint hover:text-fg disabled:opacity-30" aria-label={`Move ${p.title} up`}>
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => move(index, 1)} disabled={index === projects.length - 1 || pending} className="rounded p-0.5 text-faint hover:text-fg disabled:opacity-30" aria-label={`Move ${p.title} down`}>
                            <ArrowDown className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-muted">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/projects/${p.id}`} className="font-medium text-fg hover:text-accent">
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {p.category} · {projectStatusLabel[p.project_status]}
                        {!p.cover_image_url ? " · no cover image" : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Select
                        value={p.publication_status}
                        onChange={(e) => setPublication(p, e.target.value as PublicationStatus)}
                        className="h-8 w-32 text-xs"
                        aria-label={`Publication status for ${p.title}`}
                        disabled={pending}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </Select>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => run(() => patchRecord("projects", p.id, { is_featured: !p.is_featured }), p.is_featured ? "Removed from featured" : "Marked as featured")}
                        disabled={pending}
                        className={cn("rounded-md p-1.5", p.is_featured ? "text-amber-500" : "text-faint hover:text-fg")}
                        aria-pressed={p.is_featured}
                        aria-label={p.is_featured ? `Unfeature ${p.title}` : `Feature ${p.title}`}
                      >
                        <Star className={cn("size-4", p.is_featured && "fill-current")} />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-0.5">
                        <Link href={`/admin/projects/${p.id}/preview`} className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg" aria-label={`Preview ${p.title}`}>
                          <Eye className="size-4" />
                        </Link>
                        <Link href={`/admin/projects/${p.id}`} className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg" aria-label={`Edit ${p.title}`}>
                          <Pencil className="size-4" />
                        </Link>
                        <button type="button" onClick={() => setDeleting(p)} className="rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${p.title}`}>
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-line md:hidden">
            {filtered.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/admin/projects/${p.id}`} className="min-w-0">
                    <p className="font-medium text-fg">{p.title}</p>
                    <p className="text-xs text-muted">{p.category}</p>
                  </Link>
                  <Badge tone={statusTone[p.publication_status]}>{p.publication_status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {p.is_featured ? <Badge tone="accent">Featured</Badge> : null}
                  <span className="flex-1" />
                  <Link href={`/admin/projects/${p.id}/preview`} className="rounded-md p-2 text-muted hover:bg-subtle" aria-label={`Preview ${p.title}`}>
                    <Eye className="size-4" />
                  </Link>
                  <Link href={`/admin/projects/${p.id}`} className="rounded-md p-2 text-muted hover:bg-subtle" aria-label={`Edit ${p.title}`}>
                    <Pencil className="size-4" />
                  </Link>
                  <button type="button" onClick={() => setDeleting(p)} className="rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${p.title}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Tip: archive a project to hide it without losing it. Clear the filters to reorder.
      </p>

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        busy={pending}
        title="Delete this project?"
        description={`“${deleting?.title ?? ""}” and its screenshot records will be permanently deleted. Consider archiving instead.`}
        onConfirm={() =>
          deleting &&
          start(async () => {
            const res = await deleteRecord("projects", deleting.id);
            if (res.ok) {
              toast.success("Project deleted");
              setDeleting(null);
              router.refresh();
            } else toast.error(res.error);
          })
        }
      />
    </div>
  );
}
