"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/admin/image-upload";
import { Card, Checkbox, Field, Input, Select, Textarea } from "@/components/admin/ui";
import { saveRecord } from "@/lib/actions/admin";
import { projectSchema } from "@/lib/validation/admin";
import { slugify } from "@/lib/utils";
import type { Project } from "@/lib/types";

type FormValues = {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  project_type: string;
  year: string;
  problem: string;
  solution: string;
  contribution: string;
  tech_stack: string;
  cover_image_url: string;
  cover_image_alt: string;
  github_url: string;
  live_url: string;
  project_status: Project["project_status"];
  publication_status: Project["publication_status"];
  is_featured: boolean;
};

function toForm(p: Project | null): FormValues {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    short_description: p?.short_description ?? "",
    description: p?.description ?? "",
    category: p?.category ?? "",
    project_type: p?.project_type ?? "",
    year: p?.year ?? "",
    problem: p?.problem ?? "",
    solution: p?.solution ?? "",
    contribution: p?.contribution ?? "",
    tech_stack: (p?.tech_stack ?? []).join(", "),
    cover_image_url: p?.cover_image_url ?? "",
    cover_image_alt: p?.cover_image_alt ?? "",
    github_url: p?.github_url ?? "",
    live_url: p?.live_url ?? "",
    project_status: p?.project_status ?? "completed",
    publication_status: p?.publication_status ?? "draft",
    is_featured: p?.is_featured ?? false,
  };
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function ProjectForm({ project, suggestions }: { project: Project | null; suggestions: string[] }) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [intent, setIntent] = useState<"save" | "preview">("save");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(projectSchema as never) as unknown as Resolver<FormValues>,
    defaultValues: toForm(project),
  });

  const coverUrl = watch("cover_image_url");
  const stackText = watch("tech_stack");
  const stack = stackText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const setStack = (items: string[]) => setValue("tech_stack", items.join(", "), { shouldDirty: true, shouldValidate: true });
  const toggleTech = (t: string) => setStack(stack.includes(t) ? stack.filter((s) => s !== t) : [...stack, t]);

  const onSubmit = async (values: FormValues) => {
    const res = await saveRecord("projects", project?.id ?? null, values);
    if (!res.ok) {
      toast.error(res.error);
      Object.entries(res.fieldErrors ?? {}).forEach(([k, m]) => setError(k as keyof FormValues, { message: m }));
      return;
    }
    const id = res.data?.id ?? project?.id;
    const live = (values as unknown as { publication_status: string }).publication_status === "published";
    toast.success(project ? (live ? "Saved — live on the site" : "Saved") : "Project created");
    if (intent === "preview" && id) router.push(`/admin/projects/${id}/preview`);
    else if (!project && id) router.replace(`/admin/projects/${id}`);
    else router.refresh();
  };

  const e = (k: keyof FormValues) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="space-y-6">
      <Section title="Basics" description="Shown on project cards and at the top of the case study.">
        <Field label="Title" htmlFor="title" error={e("title")}>
          <Input
            id="title"
            aria-invalid={!!errors.title}
            {...register("title", {
              onChange: (ev) => {
                if (!slugTouched) setValue("slug", slugify(ev.target.value), { shouldValidate: false });
              },
            })}
          />
        </Field>
        <Field label="URL slug" htmlFor="slug" error={e("slug")} hint="yourdomain.com/projects/slug">
          <Input id="slug" aria-invalid={!!errors.slug} {...register("slug", { onChange: () => setSlugTouched(true) })} />
        </Field>
        <Field label="Category" htmlFor="category" error={e("category")}>
          <Input id="category" placeholder="e.g. Full-Stack Application" aria-invalid={!!errors.category} {...register("category")} />
        </Field>
        <Field label="Project type" htmlFor="project_type" error={e("project_type")} hint="e.g. Client project, Independent product">
          <Input id="project_type" {...register("project_type")} />
        </Field>
        <Field label="Year" htmlFor="year" error={e("year")} hint="Free text, e.g. 2025 or 2024 — 2025">
          <Input id="year" {...register("year")} />
        </Field>
        <Field label="Project status" htmlFor="project_status">
          <Select id="project_status" {...register("project_status")}>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="in_progress">Ongoing</option>
            <option value="paused">Development paused</option>
            <option value="concept">Concept</option>
          </Select>
        </Field>
        <Field label="Short description" htmlFor="short_description" error={e("short_description")} className="sm:col-span-2" hint="One or two sentences (max 300 characters).">
          <Textarea id="short_description" rows={2} aria-invalid={!!errors.short_description} {...register("short_description")} />
        </Field>
      </Section>

      <Section title="Case study" description="Separate paragraphs with a blank line. Empty sections are hidden on the site.">
        {(
          [
            ["description", "Overview"],
            ["problem", "The problem"],
            ["solution", "The solution"],
            ["contribution", "My contribution"],
          ] as const
        ).map(([name, label]) => (
          <Field key={name} label={label} htmlFor={name} error={e(name)} className="sm:col-span-2">
            <Textarea id={name} rows={5} {...register(name)} />
          </Field>
        ))}
      </Section>

      <Section title="Technology" description="Pick from your skills or type your own, separated by commas.">
        <Field label="Technology stack" htmlFor="tech_stack" error={e("tech_stack")} className="sm:col-span-2">
          <Input id="tech_stack" {...register("tech_stack")} />
        </Field>
        {stack.length ? (
          <div className="flex flex-wrap gap-1.5 sm:col-span-2" aria-label="Selected technologies">
            {stack.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTech(t)}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
                aria-label={`Remove ${t}`}
              >
                {t} <X className="size-3" aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
        {suggestions.length ? (
          <details className="sm:col-span-2">
            <summary className="cursor-pointer text-sm text-muted hover:text-fg">Choose from your skills ({suggestions.length})</summary>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleTech(s)}
                  aria-pressed={stack.includes(s)}
                  className={
                    stack.includes(s)
                      ? "rounded-full border border-accent bg-accent-soft px-2.5 py-1 text-xs text-accent"
                      : "rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-line-strong hover:text-fg"
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </details>
        ) : null}
      </Section>

      <Section title="Links">
        <Field label="Live URL" htmlFor="live_url" error={e("live_url")}>
          <Input id="live_url" type="url" placeholder="https://" {...register("live_url")} />
        </Field>
        <Field label="GitHub repository" htmlFor="github_url" error={e("github_url")}>
          <Input id="github_url" type="url" placeholder="https://github.com/…" {...register("github_url")} />
        </Field>
      </Section>

      <Section title="Cover image" description="Without one, the site shows a typographic cover generated from the title.">
        <div className="sm:col-span-1">
          <ImageUpload
            folder="projects"
            value={coverUrl || null}
            onChange={(url) => setValue("cover_image_url", url ?? "", { shouldDirty: true })}
          />
        </div>
        <Field label="Cover alt text" htmlFor="cover_image_alt" error={e("cover_image_alt")} hint="Describe the image for screen readers.">
          <Textarea id="cover_image_alt" rows={3} {...register("cover_image_alt")} />
        </Field>
      </Section>

      <Section title="Publishing">
        <Field label="Visibility" htmlFor="publication_status" hint="Only published projects appear on the site.">
          <Select id="publication_status" {...register("publication_status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox id="is_featured" label="Featured project" description="Shown as a large feature on the home page." {...register("is_featured")} />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        {isDirty ? <span className="mr-auto text-xs text-muted">Unsaved changes</span> : null}
        {project ? (
          <a href={`/admin/projects/${project.id}/preview`} className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm text-muted hover:bg-subtle hover:text-fg">
            <Eye className="size-4" aria-hidden /> Preview
          </a>
        ) : null}
        <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting} onClick={() => setIntent("preview")}>
          Save &amp; preview
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting} onClick={() => setIntent("save")}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
