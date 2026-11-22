import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Anonymous, cookie-less client for reading published content on the server.
 * Safe to use inside cached functions because it never touches request data.
 * Row Level Security guarantees it can only read published/visible rows.
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
