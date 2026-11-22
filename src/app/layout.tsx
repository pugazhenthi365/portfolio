import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import { getPortfolioContent } from "@/lib/content/repository";
import { siteUrl } from "@/lib/env";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, settings } = await getPortfolioContent();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: settings.site_title, template: `%s — ${profile.full_name}` },
    description: settings.site_description,
    applicationName: profile.full_name,
    authors: [{ name: profile.full_name, url: siteUrl }],
    creator: profile.full_name,
    keywords: [
      profile.full_name,
      "Software Engineer",
      "Full-Stack Developer",
      "Microsoft Power Platform Developer",
      "Power Apps",
      "Power Automate",
      "React",
      "Node.js",
      "AI Engineering",
      "Tamil Nadu",
      "India",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: profile.full_name,
      title: settings.site_title,
      description: settings.site_description,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.site_title,
      description: settings.site_description,
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1020" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh bg-bg text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
