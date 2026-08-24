import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("increment_site_visits");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visits: data });
}
