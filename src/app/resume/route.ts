import { NextResponse } from "next/server";
import { getPortfolioContent } from "@/lib/content/repository";

/**
 * Stable, shareable resume link (/resume). Redirects to whichever PDF the
 * administrator most recently uploaded, so the URL never changes.
 */
export async function GET(request: Request) {
  const { profile } = await getPortfolioContent();
  if (!profile.resume_url) {
    return NextResponse.json({ error: "Resume not available" }, { status: 404 });
  }
  const target = new URL(profile.resume_url, request.url);
  return NextResponse.redirect(target, { status: 307, headers: { "Cache-Control": "no-store" } });
}
