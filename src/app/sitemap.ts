import type { MetadataRoute } from "next";
import { getPortfolioContent } from "@/lib/content/repository";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects, profile } = await getPortfolioContent();
  return [
    { url: `${siteUrl}/`, lastModified: profile.updated_at, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/projects`, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((p) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly" as const,
      priority: p.is_featured ? 0.8 : 0.6,
    })),
  ];
}
