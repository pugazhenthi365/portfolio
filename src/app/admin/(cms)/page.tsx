import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth";
import type { ContactMessage, Project } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase } = await requireAdminPage();

  const [projects, experiences, skills, certs, messages, profile] = await Promise.all([
    supabase.from("projects").select("id, title, slug, publication_status, is_featured, cover_image_url, updated_at"),
    supabase.from("experiences").select("id", { count: "exact", head: true }),
    supabase.from("skills").select("id", { count: "exact", head: true }),
    supabase.from("certifications").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id, name, email, subject, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("resume_url, photo_url, availability_enabled, updated_at").limit(1).maybeSingle(),
  ]);

  const list = (projects.data ?? []) as Pick<Project, "id" | "title" | "slug" | "publication_status" | "is_featured" | "cover_image_url" | "updated_at">[];
  const published = list.filter((p) => p.publication_status === "published");
  const drafts = list.filter((p) => p.publication_status === "draft");
  const missingCovers = published.filter((p) => !p.cover_image_url);
  const recent = [...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);
  const inbox = (messages.data ?? []) as Pick<ContactMessage, "id" | "name" | "email" | "subject" | "status" | "created_at">[];
  const unread = inbox.filter((m) => m.status === "new").length;

  const stats = [
    { label: "Published projects", value: published.length, href: "/admin/projects" },
    { label: "Drafts", value: drafts.length, href: "/admin/projects?status=draft" },
    { label: "Experience entries", value: experiences.count ?? 0, href: "/admin/experience" },
    { label: "Skills", value: skills.count ?? 0, href: "/admin/skills" },
    { label: "Certifications", value: certs.count ?? 0, href: "/admin/certifications" },
    { label: "Unread messages", value: unread, href: "/admin/messages" },
  ];

  const checks = [
    { ok: Boolean(profile.data?.resume_url), label: "Resume uploaded", href: "/admin/resume" },
    { ok: Boolean(profile.data?.photo_url), label: "Profile photo set", href: "/admin/profile" },
    {
      ok: missingCovers.length === 0,
      label: missingCovers.length
        ? `${missingCovers.length} published project${missingCovers.length > 1 ? "s use" : " uses"} a typographic cover (no screenshot yet)`
        : "Every published project has a cover image",
      href: "/admin/projects",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything you change here is saved to Supabase and appears on the public site immediately — no redeploy needed."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-lg border border-line bg-bg p-4 transition-colors hover:border-accent/40">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-fg">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card className="p-5">
          <h2 className="font-semibold">Site health</h2>
          <ul className="mt-4 space-y-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                )}
                <Link href={c.href} className="text-fg hover:text-accent">
                  {c.label}
                </Link>
              </li>
            ))}
            <li className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-faint" aria-hidden />
              <span className="text-muted">
                Availability badge is{" "}
                <Link href="/admin/profile" className="font-medium text-fg hover:text-accent">
                  {profile.data?.availability_enabled ? "shown" : "hidden"}
                </Link>
              </span>
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent messages</h2>
            <Link href="/admin/messages" className="text-xs text-muted hover:text-fg">
              View all
            </Link>
          </div>
          {inbox.length ? (
            <ul className="mt-3 divide-y divide-line">
              {inbox.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="truncate text-muted">{m.subject || m.email}</p>
                  </div>
                  {m.status === "new" ? <Badge tone="accent">New</Badge> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No messages yet.</p>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recently edited projects</h2>
            <Link href="/admin/projects/new" className="text-xs font-medium text-accent">
              New project
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link href={`/admin/projects/${p.id}`} className="truncate font-medium hover:text-accent">
                  {p.title}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={p.publication_status === "published" ? "success" : p.publication_status === "draft" ? "warning" : "neutral"}>
                    {p.publication_status}
                  </Badge>
                  {p.publication_status === "published" ? (
                    <a href={`/projects/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fg" aria-label={`Open ${p.title} on the site`}>
                      <ArrowUpRight className="size-4" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
