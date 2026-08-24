import { createClient } from "@supabase/supabase-js";

// Anon-key client. Safe to use from client components — RLS only exposes
// public read access (see supabase/migrations).
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
