"use client";

import { EntityManager, type FieldDef } from "@/components/admin/entity-manager";
import { formatRange } from "@/lib/utils";
import type { Certification, Education, Experience } from "@/lib/types";

const experienceFields: FieldDef[] = [
  { name: "company", label: "Company", type: "text" },
  { name: "company_note", label: "Company note", type: "text", hint: "e.g. parent group — optional" },
  { name: "role", label: "Role / title", type: "text" },
  { name: "employment_type", label: "Employment type", type: "text", placeholder: "Full-time, Internship, Freelance…" },
  { name: "location", label: "Location", type: "text" },
  { name: "work_mode", label: "Work mode", type: "text", placeholder: "Remote, Hybrid, On-site" },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date", hint: "Leave empty for a current role." },
  { name: "is_current", label: "I currently work in this role", type: "checkbox" },
  { name: "summary", label: "Summary", type: "textarea", rows: 3, hint: "Optional short paragraph." },
  { name: "highlights", label: "Responsibilities & highlights", type: "lines", rows: 6 },
  { name: "technologies", label: "Technologies", type: "tags" },
  { name: "is_visible", label: "Visible on the site", type: "checkbox" },
];

export function ExperienceManager({ items, suggestions }: { items: Experience[]; suggestions: string[] }) {
  return (
    <EntityManager
      entity="experiences"
      noun="Experience entry"
      items={items}
      fields={experienceFields.map((f) => (f.name === "technologies" ? { ...f, suggestions } : f))}
      defaults={{ is_visible: true, is_current: false, work_mode: "Remote", highlights: [], technologies: [] }}
      primary={(r) => r.role}
      secondary={(r) => [r.company, r.employment_type].filter(Boolean).join(" · ")}
      meta={(r) => formatRange(r.start_date, r.end_date, r.is_current)}
    />
  );
}

const educationFields: FieldDef[] = [
  { name: "degree", label: "Degree", type: "text" },
  { name: "field", label: "Field of study", type: "text" },
  { name: "institution", label: "Institution", type: "text", full: true },
  { name: "location", label: "Location", type: "text" },
  { name: "grade", label: "Grade", type: "text", placeholder: "e.g. GPA 8.17" },
  { name: "start_year", label: "Start year", type: "number" },
  { name: "end_year", label: "Graduation year", type: "number" },
  { name: "description", label: "Description", type: "textarea", rows: 3 },
  { name: "is_visible", label: "Visible on the site", type: "checkbox" },
];

export function EducationManager({ items }: { items: Education[] }) {
  return (
    <EntityManager
      entity="education"
      noun="Education entry"
      items={items}
      fields={educationFields}
      defaults={{ is_visible: true }}
      primary={(r) => r.degree}
      secondary={(r) => r.institution}
      meta={(r) => [r.start_year, r.end_year].filter(Boolean).join(" — ")}
      searchable={false}
    />
  );
}

const certificationFields: FieldDef[] = [
  { name: "title", label: "Title", type: "text", full: true },
  {
    name: "kind",
    label: "Type",
    type: "select",
    options: [
      { value: "certification", label: "Certification" },
      { value: "achievement", label: "Achievement" },
    ],
  },
  { name: "issuer", label: "Issuer", type: "text" },
  { name: "issued_on", label: "Date / year", type: "text", placeholder: "e.g. 2023 or Mar 2024" },
  { name: "credential_url", label: "Credential URL", type: "url", placeholder: "https://" },
  { name: "description", label: "Description", type: "textarea", rows: 3 },
  { name: "is_visible", label: "Visible on the site", type: "checkbox" },
];

export function CertificationsManager({ items }: { items: Certification[] }) {
  return (
    <EntityManager
      entity="certifications"
      noun="Certification"
      items={items}
      fields={certificationFields}
      defaults={{ is_visible: true, kind: "certification" }}
      primary={(r) => r.title}
      secondary={(r) => [r.kind === "achievement" ? "Achievement" : "Certification", r.issuer].filter(Boolean).join(" · ")}
      meta={(r) => r.issued_on}
    />
  );
}
