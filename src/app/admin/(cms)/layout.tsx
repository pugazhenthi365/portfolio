import { AdminSidebar } from "@/components/admin/sidebar";
import { SetupRequired } from "@/components/admin/setup-required";
import { requireAdminPage } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

// Admin pages always render per request with the visitor's session.
export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <SetupRequired />;

  // Second security layer (after proxy.ts): verified user + admin record.
  const { supabase, user } = await requireAdminPage();
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <div className="min-h-dvh bg-bg lg:flex">
      <AdminSidebar email={user.email} unread={count ?? 0} />
      <main id="main" className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
