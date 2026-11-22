"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/admin/dialog";
import { Badge, Checkbox, EmptyState, ErrorState, Field, Input, Select, Textarea } from "@/components/admin/ui";
import { deleteRecord, patchRecord, reorderRecords, saveRecord } from "@/lib/actions/admin";
import { entitySchemas, type SortableEntity } from "@/lib/validation/admin";
import { cn } from "@/lib/utils";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "url" | "checkbox" | "select" | "lines" | "tags";
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  full?: boolean;
  rows?: number;
  suggestions?: string[];
};

type Row = { id: string; sort_order: number; is_visible?: boolean };

export type EntityManagerProps<T extends Row> = {
  entity: Exclude<SortableEntity, "projects" | "project_images">;
  noun: string;
  items: T[];
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  primary: (row: T) => string;
  secondary?: (row: T) => string | null;
  meta?: (row: T) => string | null;
  /** Extra values merged into every save (e.g. a parent category_id). */
  fixedValues?: Record<string, unknown>;
  compact?: boolean;
  searchable?: boolean;
};

function toFormValues(row: Record<string, unknown>, fields: FieldDef[]) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = row[f.name];
    if (f.type === "lines") out[f.name] = Array.isArray(v) ? v.join("\n") : (v ?? "");
    else if (f.type === "tags") out[f.name] = Array.isArray(v) ? v.join(", ") : (v ?? "");
    else if (f.type === "checkbox") out[f.name] = Boolean(v);
    else out[f.name] = v ?? "";
  }
  return out;
}

export function EntityForm({
  entity,
  fields,
  initial,
  id,
  fixedValues,
  onDone,
  submitLabel,
}: {
  entity: keyof typeof entitySchemas;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  id: string | null;
  fixedValues?: Record<string, unknown>;
  onDone: (id: string) => void;
  submitLabel?: string;
}) {
  const schema = entitySchemas[entity];
  const {
    register,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Record<string, unknown>>({
    // The schema transforms form strings into DB-ready values (arrays, nulls).
    resolver: zodResolver(schema as never) as unknown as Resolver<Record<string, unknown>>,
    defaultValues: { ...toFormValues(initial, fields), ...fixedValues },
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    const res = await saveRecord(entity, id, { ...values, ...fixedValues });
    if (!res.ok) {
      toast.error(res.error);
      Object.entries(res.fieldErrors ?? {}).forEach(([k, m]) => setError(k, { message: m }));
      return;
    }
    toast.success(id ? "Changes saved — live on the site" : "Created — live on the site");
    if (id) reset(getValues()); // the saved values become the new baseline
    onDone(res.data?.id ?? id ?? "");
  };

  const err = (name: string) => (errors[name]?.message as string | undefined) ?? undefined;
  // Errors for keys without a visible field (should not happen, but never fail silently).
  const known = new Set(fields.map((f) => f.name));
  const orphanErrors = Object.entries(errors)
    .filter(([k]) => !known.has(k))
    .map(([k, v]) => `${k}: ${(v as { message?: string })?.message ?? "invalid"}`);

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="space-y-5">
      {orphanErrors.length ? <ErrorState message={orphanErrors.join(" · ")} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const fid = `${entity}-${f.name}`;
          const common = { id: fid, "aria-invalid": Boolean(errors[f.name]), placeholder: f.placeholder };
          if (f.type === "checkbox") {
            return (
              <Checkbox key={f.name} id={fid} label={f.label} description={f.hint} className="sm:col-span-2" {...register(f.name)} />
            );
          }
          const full = f.full || ["textarea", "lines"].includes(f.type);
          let control: React.ReactNode;
          switch (f.type) {
            case "textarea":
            case "lines":
              control = <Textarea rows={f.rows ?? (f.type === "lines" ? 5 : 4)} {...common} {...register(f.name)} />;
              break;
            case "select":
              control = (
                <Select {...common} {...register(f.name)}>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              );
              break;
            case "tags":
              control = (
                <>
                  <Input {...common} list={f.suggestions ? `${fid}-list` : undefined} {...register(f.name)} />
                  {f.suggestions ? (
                    <datalist id={`${fid}-list`}>
                      {f.suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  ) : null}
                </>
              );
              break;
            default:
              control = (
                <Input
                  type={f.type === "url" ? "url" : f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  {...common}
                  {...register(f.name)}
                />
              );
          }
          return (
            <Field
              key={f.name}
              label={f.label}
              htmlFor={fid}
              hint={f.hint ?? (f.type === "lines" ? "One item per line." : f.type === "tags" ? "Separate with commas." : undefined)}
              error={err(f.name)}
              className={full ? "sm:col-span-2" : undefined}
            >
              {control}
            </Field>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button type="submit" size="sm" disabled={isSubmitting || (!!id && !isDirty)}>
          {isSubmitting ? "Saving…" : (submitLabel ?? (id ? "Save changes" : "Create"))}
        </Button>
      </div>
    </form>
  );
}

export function EntityManager<T extends Row>({
  entity,
  noun,
  items,
  fields,
  defaults,
  primary,
  secondary,
  meta,
  fixedValues,
  compact,
  searchable = true,
}: EntityManagerProps<T>) {
  const router = useRouter();
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      [primary(r), secondary?.(r), meta?.(r)].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [items, query, primary, secondary, meta]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    startTransition(async () => {
      const res = await reorderRecords(entity, next.map((r) => r.id));
      if (res.ok) {
        toast.success("Order updated");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  const toggleVisible = (row: T) =>
    startTransition(async () => {
      const res = await patchRecord(entity, row.id, { is_visible: !row.is_visible });
      if (res.ok) {
        toast.success(row.is_visible ? "Hidden from the site" : "Visible on the site");
        router.refresh();
      } else toast.error(res.error);
    });

  const confirmDelete = () =>
    startTransition(async () => {
      if (!deleting) return;
      const res = await deleteRecord(entity, deleting.id);
      if (res.ok) {
        toast.success(`${noun} deleted`);
        setDeleting(null);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchable && items.length > 3 ? (
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${noun.toLowerCase()}s…`}
              className="pl-9"
              aria-label={`Search ${noun.toLowerCase()}s`}
            />
          </div>
        ) : (
          <span />
        )}
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden /> Add {noun.toLowerCase()}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={`No ${noun.toLowerCase()}s yet`}
          description="Items you add appear on the public site straight away."
          action={
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="size-4" aria-hidden /> Add {noun.toLowerCase()}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try a different search." />
      ) : (
        <ul className={cn("divide-y divide-line overflow-hidden rounded-lg border border-line bg-bg", pending && "opacity-70")}>
          {filtered.map((row) => {
            const index = items.indexOf(row);
            return (
              <li key={row.id} className={cn("flex items-center gap-3 px-3 sm:px-4", compact ? "py-2" : "py-3")}>
                {!query ? (
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || pending}
                      className="rounded p-0.5 text-faint hover:bg-subtle hover:text-fg disabled:opacity-30"
                      aria-label={`Move ${primary(row)} up`}
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1 || pending}
                      className="rounded p-0.5 text-faint hover:bg-subtle hover:text-fg disabled:opacity-30"
                      aria-label={`Move ${primary(row)} down`}
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                ) : null}
                <button type="button" onClick={() => setEditing(row)} className="min-w-0 flex-1 text-left">
                  <p className={cn("truncate font-medium text-fg", compact ? "text-sm" : "text-[0.95rem]")}>{primary(row)}</p>
                  {secondary?.(row) ? <p className="truncate text-sm text-muted">{secondary(row)}</p> : null}
                </button>
                {meta?.(row) ? <span className="hidden shrink-0 font-mono text-xs text-muted md:block">{meta(row)}</span> : null}
                {row.is_visible === false ? <Badge>Hidden</Badge> : null}
                <div className="flex shrink-0 items-center gap-0.5">
                  {"is_visible" in row ? (
                    <button
                      type="button"
                      onClick={() => toggleVisible(row)}
                      disabled={pending}
                      className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg"
                      aria-label={row.is_visible ? `Hide ${primary(row)}` : `Show ${primary(row)}`}
                      title={row.is_visible ? "Hide from site" : "Show on site"}
                    >
                      {row.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg"
                    aria-label={`Edit ${primary(row)}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(row)}
                    className="rounded-md p-2 text-muted hover:bg-danger/10 hover:text-danger"
                    aria-label={`Delete ${primary(row)}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? `Add ${noun.toLowerCase()}` : `Edit ${noun.toLowerCase()}`}
        size="lg"
      >
        {editing !== null ? (
          <EntityForm
            key={editing === "new" ? "new" : editing.id}
            entity={entity}
            fields={fields}
            initial={editing === "new" ? defaults : (editing as unknown as Record<string, unknown>)}
            id={editing === "new" ? null : editing.id}
            fixedValues={fixedValues}
            onDone={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={pending}
        title={`Delete this ${noun.toLowerCase()}?`}
        description={`“${deleting ? primary(deleting) : ""}” will be permanently removed from the site. This can't be undone.`}
      />
    </div>
  );
}
