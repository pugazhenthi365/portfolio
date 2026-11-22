/**
 * Initial portfolio content.
 *
 * - Used as the read-only fallback data layer when Supabase is not configured
 *   (local development, preview builds, first deploy).
 * - Used to generate `supabase/seed.sql` (`npm run db:seed-sql`) so the database
 *   starts with exactly the same content.
 *
 * Source of truth for facts: the brief supplied by Pugazhenthi R. and his
 * resume (Nov 2026). Nothing here invents metrics, clients or dates.
 * Case-study narrative copy is intentionally modest and should be reviewed
 * and expanded from the admin dashboard.
 *
 * Type-only imports keep this file runnable by Node's type stripping.
 */
import type {
  Certification,
  Education,
  Experience,
  PortfolioContent,
  Profile,
  Project,
  SiteSettings,
  SkillCategory,
} from "../lib/types.ts";

const T = "2026-11-22T00:00:00.000Z";

export const seedProfile: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Pugazhenthi R",
  title: "Software Engineer",
  positioning: "Versatile Software Engineer | Full-Stack Development | Microsoft Power Platform | AI Engineering",
  headline: "Building digital solutions that solve real problems.",
  hero_intro:
    "I'm Pugazhenthi, a Software Engineer working across Full-Stack Development, Microsoft Power Platform and AI-powered applications.",
  short_intro:
    "I'm Pugazhenthi, a Software Engineer working across full-stack development, Microsoft Power Platform and AI-powered applications. I build practical software solutions, business applications, automation workflows and modern digital experiences.",
  about: [
    "I'm a Software Engineer based in Tamil Nadu, India, with two years of hands-on experience building business applications, automation workflows and web products.",
    "Most of my professional work happens on the Microsoft Power Platform. At Mani India Technologies I build Canvas and model-driven apps on Dataverse and SharePoint, design Power Automate flows with deliberate error handling and logging, and develop Power Pages portals with Liquid and FetchXML. I joined as an intern in early 2025, moved through a system-analyst traineeship, and now work as a Junior Software Engineer.",
    "Alongside that, I build full-stack applications with React, Node.js, Express and MongoDB, and I work increasingly with large language models — as a freelance AI engineer and in my own product experiments.",
    "I care about software that is clear to use, dependable in production and honest about what it does. I'm open to remote software engineering opportunities with international teams.",
  ].join("\n\n"),
  location: "Tamil Nadu, India",
  experience_summary: "2 years",
  email: "pugazhenthigopal365@gmail.com",
  linkedin_url: "https://www.linkedin.com/in/pugazhenthi365/",
  github_url: "https://github.com/pugazhenthi365",
  photo_url: "/images/profile/pugazhenthi-r.jpg",
  photo_alt: "Portrait of Pugazhenthi R, Software Engineer, outdoors in a black long-sleeve shirt",
  resume_url: "/documents/Pugazhenthi_R_Resume.pdf",
  resume_file_name: "Pugazhenthi_R_Resume.pdf",
  availability_enabled: false,
  availability_text: "Available to join from 1 December 2026",
  updated_at: T,
};

export const seedSettings: SiteSettings = {
  id: "00000000-0000-4000-8000-000000000002",
  site_title: "Pugazhenthi R — Software Engineer",
  site_description:
    "Software Engineer working across full-stack development, Microsoft Power Platform and AI-powered applications. Based in Tamil Nadu, India.",
  contact_form_enabled: true,
  contact_heading: "Let's build something useful.",
  contact_text:
    "I'm open to suitable international remote software engineering opportunities and selected freelance work. The quickest way to reach me is email — I read every message.",
  footer_note: null,
  updated_at: T,
};

const MANI = "Mani India Technologies (P) Ltd.";

export const seedExperiences: Experience[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    company: MANI,
    company_note: "KAT Enterprise group",
    role: "Junior Software Engineer",
    employment_type: "Full-time",
    location: "Tamil Nadu, India",
    work_mode: "Remote",
    start_date: "2026-03-01",
    end_date: null,
    is_current: true,
    summary: null,
    highlights: [
      "Develop and maintain Canvas and model-driven apps on Dataverse and SharePoint using Power Fx.",
      "Build and support Power Automate flows with Try/Catch error handling, failure alerts and logging.",
      "Build Power Pages portals with Liquid templates; integrate external systems using REST APIs, HTTP actions and custom connectors.",
      "Manage ALM with solutions, environment variables, connection references and Azure DevOps pipelines for Dev-to-Production releases.",
    ],
    technologies: ["Power Apps", "Power Automate", "Power Pages", "Dataverse", "Liquid", "FetchXML", "Azure DevOps"],
    sort_order: 1,
    is_visible: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    company: MANI,
    company_note: "KAT Enterprise group",
    role: "On-Job Trainee — System Analyst",
    employment_type: "Traineeship",
    location: "Tamil Nadu, India",
    work_mode: "Remote",
    start_date: "2025-09-01",
    end_date: "2026-02-28",
    is_current: false,
    summary: null,
    highlights: [
      "Analysed business requirements and designed Dataverse and SharePoint data models and automations.",
      "Integrated Power Apps with SharePoint and enterprise databases; tested APIs and integrations using Postman.",
    ],
    technologies: ["Dataverse", "SharePoint", "Power Apps", "Postman"],
    sort_order: 2,
    is_visible: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    company: MANI,
    company_note: "KAT Enterprise group",
    role: "Internship Trainee — Power Apps Developer",
    employment_type: "Internship",
    location: "Tamil Nadu, India",
    work_mode: "Remote",
    start_date: "2025-02-01",
    end_date: "2025-08-31",
    is_current: false,
    summary: null,
    highlights: ["Built Canvas apps and Power Automate workflows on SharePoint to replace manual business processes."],
    technologies: ["Power Apps", "Power Automate", "SharePoint"],
    sort_order: 3,
    is_visible: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    company: "Drytis, Inc.",
    company_note: null,
    role: "AI Computer Science Engineer",
    employment_type: "Freelance · Contract",
    location: null,
    work_mode: "Remote",
    start_date: "2026-04-01",
    end_date: null,
    is_current: true,
    summary: null,
    highlights: [
      "Delivered 6 client projects on time with 5-star ratings, providing AI-assisted coding support on Drytis's Vibe Coding platform.",
      "Used prompt engineering and LLM workflows to speed up development and debugging across multiple tech stacks.",
    ],
    technologies: ["LLMs", "Prompt engineering", "AI-assisted development"],
    sort_order: 4,
    is_visible: true,
  },
];

function project(p: Partial<Project> & Pick<Project, "id" | "slug" | "title" | "short_description" | "category">): Project {
  return {
    description: null,
    project_type: null,
    year: null,
    problem: null,
    solution: null,
    contribution: null,
    tech_stack: [],
    cover_image_url: null,
    cover_image_alt: null,
    github_url: null,
    live_url: null,
    project_status: "completed",
    publication_status: "published",
    is_featured: false,
    sort_order: 100,
    published_at: T,
    created_at: T,
    updated_at: T,
    images: [],
    ...p,
  };
}

export const seedProjects: Project[] = [
  project({
    id: "20000000-0000-4000-8000-000000000007",
    slug: "microsoft-power-platform-solutions",
    title: "Microsoft Power Platform Solutions",
    category: "Enterprise Application Development",
    project_type: "Professional work",
    year: "2025 — Present",
    short_description:
      "Business applications, portals and workflow automation built on Power Apps, Power Automate, Dataverse and Power Pages.",
    description:
      "A summary of the kind of enterprise work I deliver professionally on the Microsoft Power Platform. Client and employer specifics are intentionally omitted: no internal screenshots, business processes or proprietary data are shown here.",
    problem:
      "Many organisations still run important processes on spreadsheets, email threads and manual hand-offs. That makes work hard to track, easy to get wrong and difficult to audit.",
    solution:
      "Structured business applications on Dataverse and SharePoint, with Canvas and model-driven apps for the people doing the work, Power Automate for the hand-offs and notifications in between, and Power Pages portals where external users need secure access. Integrations with external systems use REST APIs, HTTP actions and custom connectors, and releases move from Dev to Production through managed solutions and Azure DevOps pipelines.",
    contribution:
      "Requirement analysis and data modelling; building Canvas and model-driven apps with Power Fx; designing Power Automate flows with Try/Catch scopes, failure alerts and logging; building Power Pages with Liquid templates and FetchXML; and managing ALM with solutions, environment variables and connection references.",
    tech_stack: ["Power Apps", "Power Automate", "Dataverse", "Power Pages", "Liquid", "FetchXML", "SharePoint", "Azure DevOps"],
    project_status: "in_progress",
    is_featured: true,
    sort_order: 1,
  }),
  project({
    id: "20000000-0000-4000-8000-000000000006",
    slug: "ai-resume-optimizer",
    title: "AI Resume Optimizer",
    category: "Independent Product Development",
    project_type: "Independent product",
    short_description:
      "Analyses a resume against a job description, evaluates ATS keyword coverage and suggests AI-assisted improvements.",
    description:
      "An independent product I designed and started building to make resume tailoring less guesswork. Development is currently paused; it is shown here transparently as work in progress rather than a launched product.",
    problem:
      "Candidates are often filtered out by applicant tracking systems before a person reads their resume, and it is hard to tell which keywords and skills a specific job description actually expects.",
    solution:
      "A web application that parses a resume and a job description, compares them for keyword and skill coverage, and uses a large language model to suggest specific, reviewable improvements rather than rewriting the resume wholesale.",
    contribution:
      "Product concept, architecture and implementation: Next.js and TypeScript front end, MongoDB/Mongoose data layer, and LLM integration through the Groq API and OpenAI SDK.",
    tech_stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "MongoDB", "Mongoose", "Groq API", "OpenAI SDK"],
    project_status: "paused",
    is_featured: true,
    sort_order: 2,
  }),
  project({
    id: "20000000-0000-4000-8000-000000000003",
    slug: "qr-code-ordering-system",
    title: "QR Code Ordering System",
    category: "Full-Stack Application",
    project_type: "Full-stack application",
    short_description: "A QR-code-based ordering system designed to simplify the customer ordering experience.",
    description:
      "Customers scan a QR code at their table, browse the menu on their own phone and place an order without waiting for staff or installing an app.",
    problem:
      "Ordering in busy venues often depends on catching a staff member's attention, and paper menus are slow to update.",
    solution:
      "A mobile-first web menu opened from a QR code, backed by a REST API and a MongoDB data store for menu items and orders.",
    contribution:
      "Built the React + Vite front end with Tailwind CSS, the Node.js/Express REST API and the MongoDB data model.",
    tech_stack: ["React", "Vite", "Tailwind CSS", "Node.js", "Express.js", "MongoDB"],
    is_featured: true,
    sort_order: 3,
  }),
  project({
    id: "20000000-0000-4000-8000-000000000005",
    slug: "edutech-website",
    title: "EduTech Website",
    category: "Full-Stack Development",
    project_type: "Full-stack application",
    short_description: "An education-focused website developed using the MERN stack.",
    description: "An education-focused web platform built end-to-end with MongoDB, Express.js, React.js and Node.js.",
    tech_stack: ["MongoDB", "Express.js", "React.js", "Node.js"],
    sort_order: 4,
  }),
  project({
    id: "20000000-0000-4000-8000-000000000004",
    slug: "smart-academic-management-portal",
    title: "Smart Academic Management Portal",
    category: "Web Application",
    project_type: "Concept",
    short_description:
      "An academic management application concept focused on organising educational workflows and information.",
    description:
      "A concept for bringing scattered academic information — courses, schedules and records — into one organised portal.",
    project_status: "concept",
    sort_order: 5,
  }),
  project({
    id: "20000000-0000-4000-8000-000000000001",
    slug: "zhahi-tech-website",
    title: "Zhahi Tech Website",
    category: "WordPress / Business Website",
    project_type: "Business website",
    year: "2025",
    short_description: "A business website developed using WordPress and website customisation technologies.",
    description:
      "A responsive corporate website for Zhahi Tech Training, built on WordPress with custom theme work and on-page SEO.",
    contribution: "Designed and deployed the site, customising the theme and layouts with HTML, CSS and JavaScript.",
    tech_stack: ["WordPress", "HTML", "CSS", "JavaScript"],
    sort_order: 6,
  }),
  project({
    id: "20000000-0000-4000-8000-000000000002",
    slug: "mr-prathas-website",
    title: "Mr. Prathas Website",
    category: "WordPress / Website Development",
    project_type: "Client project",
    short_description: "A live WordPress website developed for a client.",
    description: "A client website built and launched on WordPress, customised with HTML, CSS and JavaScript.",
    tech_stack: ["WordPress", "HTML", "CSS", "JavaScript"],
    project_status: "live",
    sort_order: 7,
  }),
  project({
    id: "20000000-0000-4000-8000-000000000008",
    slug: "training-center-management-system",
    title: "Training Center Management System",
    category: "Full-Stack Application",
    project_type: "Full-stack application",
    year: "2024",
    short_description:
      "A full-stack institute management system for students, staff, courses, attendance, certificates and finance.",
    description:
      "Listed on my resume; saved as a draft so it can be reviewed and published from the admin dashboard. Includes role-based access control and optimised MongoDB queries.",
    tech_stack: ["MongoDB", "Express.js", "React.js", "Node.js"],
    publication_status: "draft",
    published_at: null,
    sort_order: 8,
  }),
];

const cat = (id: number, name: string, description: string, skills: string[]): SkillCategory => {
  const cid = `30000000-0000-4000-8000-${String(id).padStart(12, "0")}`;
  return {
    id: cid,
    name,
    description,
    sort_order: id,
    is_visible: true,
    skills: skills.map((s, i) => ({
      id: `31000000-0000-4000-8${String(id).padStart(3, "0")}-${String(i + 1).padStart(12, "0")}`,
      category_id: cid,
      name: s,
      sort_order: i + 1,
      is_visible: true,
    })),
  };
};

export const seedSkillCategories: SkillCategory[] = [
  cat(1, "Microsoft Power Platform", "Business applications, portals and process automation.", [
    "Power Apps",
    "Model-driven applications",
    "Power Automate",
    "Power Pages",
    "Microsoft Dataverse",
    "Liquid",
    "FetchXML",
    "Business process automation",
  ]),
  cat(2, "Full-Stack Development", "End-to-end web applications on the MERN stack.", [
    "React.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "REST APIs",
    "JavaScript",
  ]),
  cat(3, "Frontend", "Accessible, responsive interfaces.", [
    "HTML5",
    "CSS3",
    "JavaScript",
    "React.js",
    "Tailwind CSS",
    "Vite",
    "Responsive web development",
  ]),
  cat(4, "Backend", "APIs and server-side logic.", ["Node.js", "Express.js", "Python", "Flask", "PHP"]),
  cat(5, "Databases", "Relational and document data stores.", ["MongoDB", "MySQL", "SQL", "SQLite"]),
  cat(6, "CMS & Other Technologies", "Content-managed websites.", [
    "WordPress",
    "Advanced Custom Fields",
    "CPT UI",
    "Fluent Forms",
  ]),
  cat(7, "AI & Development Tools", "LLM integration and everyday tooling.", [
    "Groq API",
    "OpenAI SDK",
    "Git",
    "GitHub",
    "Vercel",
    "Visual Studio Code",
  ]),
];

export const seedEducation: Education[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    institution: "Theni Kammavar Sangam College of Technology",
    degree: "Bachelor of Engineering (B.E.)",
    field: "Computer Science and Engineering",
    location: "Theni, Tamil Nadu",
    start_year: 2021,
    end_year: 2025,
    grade: "GPA 8.17",
    description: null,
    sort_order: 1,
    is_visible: true,
  },
];

export const seedCertifications: Certification[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    title: "MERN Stack Development",
    issuer: "Zhahi Tech Training",
    kind: "certification",
    issued_on: null,
    credential_url: null,
    description: null,
    sort_order: 1,
    is_visible: true,
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    title: "FOSSEE MAPATHON 2023 — Notable Participant",
    issuer: "IIT Bombay",
    kind: "achievement",
    issued_on: "2023",
    credential_url: null,
    description: null,
    sort_order: 2,
    is_visible: true,
  },
];

export const seedContent: PortfolioContent = {
  profile: seedProfile,
  settings: seedSettings,
  experiences: seedExperiences,
  projects: seedProjects,
  skillCategories: seedSkillCategories,
  education: seedEducation,
  certifications: seedCertifications,
};
