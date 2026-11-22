import { ErrorState, PageHeader } from "@/components/admin/ui";
import { SettingsEditor } from "@/components/admin/profile-form";
import { requireAdminPage } from "@/lib/auth";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "Contact & site" };

export default async function SettingsPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  return (
    <>
      <PageHeader title="Contact & site settings" description="Contact form behaviour, contact copy and search-engine metadata." />
      {error ? (
        <ErrorState message={error.message} />
      ) : !data ? (
        <ErrorState message="No settings row found. Run supabase/seed.sql (see docs/SUPABASE.md)." />
      ) : (
        <SettingsEditor settings={data as SiteSettings} />
      )}
    </>
  );
}
