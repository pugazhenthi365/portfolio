import { ErrorState, PageHeader } from "@/components/admin/ui";
import { ProfileEditor } from "@/components/admin/profile-form";
import { requireAdminPage } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("profiles").select("*").limit(1).maybeSingle();
  return (
    <>
      <PageHeader title="Profile" description="Your name, introduction, contact links, photo and availability." />
      {error ? (
        <ErrorState message={error.message} />
      ) : !data ? (
        <ErrorState message="No profile row found. Run supabase/seed.sql (see docs/SUPABASE.md)." />
      ) : (
        <ProfileEditor profile={data as Profile} />
      )}
    </>
  );
}
