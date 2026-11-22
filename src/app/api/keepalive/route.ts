import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Daily keep-alive (see vercel.json). Supabase Free projects pause after a
 * period of inactivity; one tiny read per day keeps the database awake.
 * Protected by CRON_SECRET, which Vercel Cron sends as a Bearer token.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isSupabaseConfigured) return NextResponse.json({ ok: true, skipped: "supabase not configured" });

  const { error } = await createPublicClient().from("profiles").select("id").limit(1);
  return NextResponse.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 503 : 200 });
}
