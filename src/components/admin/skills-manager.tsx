"use client";

import { EntityManager, type FieldDef } from "@/components/admin/entity-manager";
import { Card } from "@/components/admin/ui";
import type { Skill, SkillCategory } from "@/lib/types";

const categoryFields: FieldDef[] = [
  { name: "name", label: "Category name", type: "text", full: true },
  { name: "description", label: "Short description", type: "text", full: true },
  { name: "is_visible", label: "Visible on the site", type: "checkbox" },
];

const skillFields: FieldDef[] = [
  { name: "name", label: "Skill", type: "text", full: true },
  { name: "is_visible", label: "Visible on the site", type: "checkbox" },
];

export function SkillsManager({ categories }: { categories: (Omit<SkillCategory, "skills"> & { skills: Skill[] })[] }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="mb-3 font-semibold">
          Categories
        </h2>
        <EntityManager
          entity="skill_categories"
          noun="Category"
          items={categories}
          fields={categoryFields}
          defaults={{ is_visible: true }}
          primary={(c) => c.name}
          secondary={(c) => `${c.skills.length} skill${c.skills.length === 1 ? "" : "s"}${c.description ? ` · ${c.description}` : ""}`}
          searchable={false}
        />
      </section>

      <section aria-labelledby="skills-heading" className="space-y-4">
        <h2 id="skills-heading" className="font-semibold">
          Skills by category
        </h2>
        {categories.map((c) => (
          <Card key={c.id} className="p-4 sm:p-5">
            <details open={categories.length <= 3}>
              <summary className="cursor-pointer select-none font-medium">
                {c.name} <span className="text-sm font-normal text-muted">({c.skills.length})</span>
              </summary>
              <div className="mt-4">
                <EntityManager
                  entity="skills"
                  noun="Skill"
                  items={c.skills}
                  fields={skillFields}
                  defaults={{ is_visible: true }}
                  fixedValues={{ category_id: c.id }}
                  primary={(s) => s.name}
                  compact
                  searchable={false}
                />
              </div>
            </details>
          </Card>
        ))}
      </section>
    </div>
  );
}
