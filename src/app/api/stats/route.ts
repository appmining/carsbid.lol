import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = supabaseAdmin();

  const [{ data: voteRows, error: votesError }, { data: statsRow, error: statsError }] =
    await Promise.all([
      db.from("car_votes").select("car_slug, votes"),
      db.from("site_stats").select("value").eq("key", "visits").maybeSingle(),
    ]);

  if (votesError || statsError) {
    return NextResponse.json({ error: (votesError ?? statsError)?.message }, { status: 500 });
  }

  const votes: Record<string, number> = {};
  for (const row of voteRows ?? []) {
    votes[row.car_slug] = row.votes;
  }

  return NextResponse.json({ votes, visits: statsRow?.value ?? 0 });
}
