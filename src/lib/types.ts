/**
 * Domain types. These mirror the Supabase schema in `supabase/migrations`.
 * Column names are kept in snake_case so rows map 1:1 without transformation.
 */

export type PublicationStatus = "draft" | "published" | "archived";
export type ProjectStatus = "live" | "completed" | "in_progress" | "paused" | "concept";

export interface Profile {
  id: string;
  full_name: string;
  title: string;
  positioning: string;
  headline: string;
  hero_intro: string;
  short_intro: string;
  about: string; // paragraphs separated by blank lines
  location: string;
  experience_summary: string | null;
  email: string;
  linkedin_url: string | null;
  github_url: string | null;
  photo_url: string | null;
  photo_alt: string | null;
  resume_url: string | null;
  resume_file_name: string | null;
  availability_enabled: boolean;
  availability_text: string | null;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  contact_form_enabled: boolean;
  contact_heading: string;
  contact_text: string;
  footer_note: string | null;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  alt: string;
  caption: string | null;
  sort_order: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string | null;
  category: string;
  project_type: string | null; // e.g. "Client project", "Independent product"
  year: string | null;
  problem: string | null;
  solution: string | null;
  contribution: string | null;
  tech_stack: string[];
  cover_image_url: string | null;
  cover_image_alt: string | null;
  github_url: string | null;
  live_url: string | null;
  project_status: ProjectStatus;
  publication_status: PublicationStatus;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images?: ProjectImage[];
}

export interface Experience {
  id: string;
  company: string;
  company_note: string | null;
  role: string;
  employment_type: string | null;
  location: string | null;
  work_mode: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  is_current: boolean;
  summary: string | null;
  highlights: string[];
  technologies: string[];
  sort_order: number;
  is_visible: boolean;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  skills: Skill[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string | null;
  location: string | null;
  start_year: number | null;
  end_year: number | null;
  grade: string | null;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
}

export type CertificationKind = "certification" | "achievement";

export interface Certification {
  id: string;
  title: string;
  issuer: string | null;
  kind: CertificationKind;
  issued_on: string | null; // free text e.g. "2023"
  credential_url: string | null;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
}

export interface PortfolioContent {
  profile: Profile;
  settings: SiteSettings;
  experiences: Experience[];
  projects: Project[];
  skillCategories: SkillCategory[];
  education: Education[];
  certifications: Certification[];
}
