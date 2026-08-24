import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for server code only (API routes). Bypasses RLS, so
// it must never be imported from client components.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
