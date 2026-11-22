import { ErrorState, PageHeader } from "@/components/admin/ui";
import { ResumeManager } from "@/components/admin/resume-manager";
import { requireAdminPage } from "@/lib/auth";

export const metadata = { title: "Resume" };

export default async function ResumePage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("profiles").select("id, resume_url, resume_file_name").limit(1).maybeSingle();
  return (
    <>
      <PageHeader title="Resume" description="Replace the PDF behind every “Download Resume” button. No redeploy needed." />
      {error || !data ? (
        <ErrorState message={error?.message ?? "No profile row found."} />
      ) : (
        <ResumeManager profileId={data.id} currentUrl={data.resume_url} currentName={data.resume_file_name} />
      )}
    </>
  );
}
