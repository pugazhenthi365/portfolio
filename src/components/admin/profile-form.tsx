"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { EntityForm, type FieldDef } from "@/components/admin/entity-manager";
import { ImageUpload } from "@/components/admin/image-upload";
import { Card, Field, Input } from "@/components/admin/ui";
import { patchRecord } from "@/lib/actions/admin";
import type { Profile, SiteSettings } from "@/lib/types";

const profileFields: FieldDef[] = [
  { name: "full_name", label: "Full name", type: "text" },
  { name: "title", label: "Professional title", type: "text" },
  { name: "positioning", label: "Positioning line", type: "text", full: true, hint: "Separate focus areas with “|”. The 2nd–4th parts appear under the hero." },
  { name: "headline", label: "Hero headline", type: "text", full: true, hint: "The last two words are highlighted in blue." },
  { name: "hero_intro", label: "Hero supporting text", type: "textarea", rows: 2 },
  { name: "short_intro", label: "Professional introduction", type: "textarea", rows: 3 },
  { name: "about", label: "About section", type: "textarea", rows: 10, hint: "Separate paragraphs with a blank line. The first paragraph is shown larger." },
  { name: "location", label: "Location", type: "text" },
  { name: "experience_summary", label: "Experience summary", type: "text", placeholder: "e.g. 2 years" },
  { name: "email", label: "Public email", type: "text" },
  { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
  { name: "github_url", label: "GitHub URL", type: "url", full: true },
  { name: "availability_enabled", label: "Show availability badge in the hero", type: "checkbox", hint: "Off by default. Only turn on when you are actively available." },
  { name: "availability_text", label: "Availability text", type: "text", full: true },
];

export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const setPhoto = (url: string | null) =>
    new Promise<void>((resolve) =>
      start(async () => {
        const res = await patchRecord("profiles", profile.id, { photo_url: url });
        if (res.ok) {
          toast.success(url ? "Profile photo updated — live on the site" : "Profile photo removed");
          router.refresh();
        } else toast.error(res.error);
        resolve();
      }),
    );

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold">Profile photograph</h2>
        <p className="mt-0.5 text-sm text-muted">Use a real, recent photo. Portrait orientation (4:5) works best.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]">
          <ImageUpload folder="profile" value={profile.photo_url} onChange={setPhoto} aspect="aspect-[4/5]" label="Upload photo" />
          <Field label="Photo alt text" htmlFor="photo_alt" hint="Saved when you leave the field.">
            <Input
              id="photo_alt"
              defaultValue={profile.photo_alt ?? ""}
              disabled={pending}
              onBlur={(e) => {
                if (e.target.value === (profile.photo_alt ?? "")) return;
                start(async () => {
                  const res = await patchRecord("profiles", profile.id, { photo_alt: e.target.value });
                  if (res.ok) {
                    toast.success("Alt text saved");
                    router.refresh();
                  } else toast.error(res.error);
                });
              }}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-5 font-semibold">Profile details</h2>
        <EntityForm
          entity="profiles"
          fields={profileFields}
          initial={profile as unknown as Record<string, unknown>}
          id={profile.id}
          onDone={() => router.refresh()}
        />
      </Card>
    </div>
  );
}

const settingsFields: FieldDef[] = [
  { name: "contact_form_enabled", label: "Accept messages through the contact form", type: "checkbox", hint: "When off, visitors are asked to email you instead." },
  { name: "contact_heading", label: "Contact heading", type: "text", full: true },
  { name: "contact_text", label: "Contact text", type: "textarea", rows: 3 },
  { name: "site_title", label: "Site title (SEO)", type: "text", full: true },
  { name: "site_description", label: "Site description (SEO)", type: "textarea", rows: 2 },
  { name: "footer_note", label: "Footer note", type: "text", full: true, hint: "Optional." },
];

export function SettingsEditor({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  return (
    <Card className="p-5 sm:p-6">
      <EntityForm
        entity="site_settings"
        fields={settingsFields}
        initial={settings as unknown as Record<string, unknown>}
        id={settings.id}
        onDone={() => router.refresh()}
      />
    </Card>
  );
}
