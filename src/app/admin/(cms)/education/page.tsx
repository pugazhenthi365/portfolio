import { ErrorState, PageHeader } from "@/components/admin/ui";
import { EducationManager } from "@/components/admin/managers";
import { requireAdminPage } from "@/lib/auth";
import type { Education } from "@/lib/types";

export const metadata = { title: "Education" };

export default async function EducationPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("education").select("*").order("sort_order");
  return (
    <>
      <PageHeader title="Education" description="Degrees and institutions shown in the Education section." />
      {error ? <ErrorState message={error.message} /> : <EducationManager items={(data ?? []) as Education[]} />}
    </>
  );
}
