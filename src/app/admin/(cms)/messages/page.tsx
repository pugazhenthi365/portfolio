import { ErrorState, PageHeader } from "@/components/admin/ui";
import { MessagesInbox } from "@/components/admin/messages-inbox";
import { requireAdminPage } from "@/lib/auth";
import type { ContactMessage } from "@/lib/types";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
  return (
    <>
      <PageHeader title="Messages" description="Messages submitted through the contact form on your site." />
      {error ? <ErrorState message={error.message} /> : <MessagesInbox messages={(data ?? []) as ContactMessage[]} />}
    </>
  );
}
