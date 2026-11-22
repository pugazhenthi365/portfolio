import { ErrorState, PageHeader } from "@/components/admin/ui";
import { CertificationsManager } from "@/components/admin/managers";
import { requireAdminPage } from "@/lib/auth";
import type { Certification } from "@/lib/types";

export const metadata = { title: "Certifications" };

export default async function CertificationsPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("certifications").select("*").order("sort_order");
  return (
    <>
      <PageHeader title="Certifications & achievements" description="Credentials, awards and notable participation." />
      {error ? <ErrorState message={error.message} /> : <CertificationsManager items={(data ?? []) as Certification[]} />}
    </>
  );
}
