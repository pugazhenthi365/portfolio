import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getPortfolioContent } from "@/lib/content/repository";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { profile, settings } = await getPortfolioContent();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
      >
        Skip to content
      </a>
      <div id="top" />
      <SiteHeader name={profile.full_name} resumeUrl={profile.resume_url ? "/resume" : null} />
      <main id="main">{children}</main>
      <SiteFooter profile={profile} note={settings.footer_note} />
    </>
  );
}
