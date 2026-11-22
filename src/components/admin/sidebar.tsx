"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  ExternalLink,
  FileText,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { signOut } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/skills", label: "Skills", icon: Wrench },
  { href: "/admin/education", label: "Education", icon: BookOpen },
  { href: "/admin/certifications", label: "Certifications", icon: Award },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/media", label: "Media library", icon: Images },
  { href: "/admin/resume", label: "Resume", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/settings", label: "Contact & site", icon: Settings },
];

export function AdminSidebar({ email, unread }: { email: string | null; unread: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            isActive(href) ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-subtle hover:text-fg",
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{label}</span>
          {href === "/admin/messages" && unread > 0 ? (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.65rem] font-semibold text-accent-fg">{unread}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-2 border-t border-line p-3">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-fg"
      >
        <ExternalLink className="size-4" aria-hidden /> View live site
      </a>
      <div className="flex items-center justify-between gap-2 px-3">
        <p className="truncate text-xs text-muted" title={email ?? undefined}>
          {email}
        </p>
        <ThemeToggle />
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-bg px-4 lg:hidden">
        <Link href="/admin" className="font-semibold tracking-[-0.02em]">
          Portfolio CMS
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-drawer"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="inline-flex size-9 items-center justify-center rounded-md hover:bg-subtle"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <div id="admin-drawer" className="fixed inset-0 top-14 z-40 flex flex-col overflow-y-auto bg-bg lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-subtle/60 lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Link href="/admin" className="font-semibold tracking-[-0.02em]">
            Portfolio CMS<span className="text-accent">.</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">{nav}</div>
        {footer}
      </aside>
    </>
  );
}
