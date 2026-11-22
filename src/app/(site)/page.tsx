import { Hero } from "@/components/home/hero";
import { About } from "@/components/home/about";
import { ExperienceSection } from "@/components/home/experience";
import { ProjectsSection } from "@/components/home/projects";
import { ExpertiseSection } from "@/components/home/expertise";
import { CertificationsSection, EducationSection } from "@/components/home/credentials";
import { ContactSection } from "@/components/home/contact";
import { getPortfolioContent } from "@/lib/content/repository";
import { siteUrl } from "@/lib/env";
import { PageTransition } from "@/components/motion/page-transition";

// Static with on-demand invalidation from the admin CMS; hourly safety net.
export const revalidate = 3600;

export default async function HomePage() {
  const content = await getPortfolioContent();
  const { profile, experiences, projects, skillCategories, education, certifications, settings } = content;
  const current = experiences.find((e) => e.is_current) ?? null;
  const company = current?.company.replace(/\s*\(P\)\s*Ltd\.?$/i, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name,
    jobTitle: profile.title,
    url: siteUrl,
    email: `mailto:${profile.email}`,
    image: profile.photo_url ? new URL(profile.photo_url, siteUrl).toString() : undefined,
    address: { "@type": "PostalAddress", addressRegion: "Tamil Nadu", addressCountry: "IN" },
    worksFor: company ? { "@type": "Organization", name: company } : undefined,
    alumniOf: education[0] ? { "@type": "CollegeOrUniversity", name: education[0].institution } : undefined,
    sameAs: [profile.linkedin_url, profile.github_url].filter(Boolean),
    knowsAbout: skillCategories.flatMap((c) => c.skills.map((s) => s.name)).slice(0, 30),
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero
        profile={{
          full_name: profile.full_name,
          title: profile.title,
          location: profile.location,
          headline: profile.headline,
          hero_intro: profile.hero_intro,
          positioning: profile.positioning,
          photo_url: profile.photo_url,
          photo_alt: profile.photo_alt,
          availability_enabled: profile.availability_enabled,
          // Only ship the availability text to the browser when it is switched on.
          availability_text: profile.availability_enabled ? profile.availability_text : null,
        }}
        currentRole={current ? `Currently ${current.role} at ${company}` : null}
        hasResume={Boolean(profile.resume_url)}
      />
      <About profile={profile} current={current} education={education[0] ?? null} />
      <ExperienceSection experiences={experiences} />
      <ProjectsSection projects={projects} />
      <ExpertiseSection categories={skillCategories} />
      <EducationSection education={education} />
      <CertificationsSection items={certifications} />
      <ContactSection profile={profile} settings={settings} />
    </PageTransition>
  );
}
