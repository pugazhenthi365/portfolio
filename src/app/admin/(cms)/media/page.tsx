import { PageHeader } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { requireAdminPage } from "@/lib/auth";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  await requireAdminPage();
  return (
    <>
      <PageHeader title="Media library" description="Every image and document stored in Supabase Storage." />
      <MediaLibrary />
    </>
  );
}
