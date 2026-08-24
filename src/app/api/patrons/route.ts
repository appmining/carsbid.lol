import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Patron, PatronHistoryEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = supabaseAdmin();

  const [{ data: patronRows, error: patronsError }, { data: historyRows, error: historyError }] =
    await Promise.all([
      db.from("patrons").select("car_slug, name, tagline, platform, handle, url, price"),
      db
        .from("patron_history")
        .select("car_slug, name, platform, handle, price")
        .order("created_at", { ascending: false }),
    ]);

  if (patronsError || historyError) {
    return NextResponse.json(
      { error: (patronsError ?? historyError)?.message },
      { status: 500 }
    );
  }

  const historyBySlug = new Map<string, PatronHistoryEntry[]>();
  for (const row of historyRows ?? []) {
    const entry: PatronHistoryEntry = {
      name: row.name,
      platform: row.platform,
      handle: row.handle,
      price: row.price,
    };
    const list = historyBySlug.get(row.car_slug) ?? [];
    list.push(entry);
    historyBySlug.set(row.car_slug, list);
  }

  const patrons: Record<string, Patron> = {};
  for (const row of patronRows ?? []) {
    patrons[row.car_slug] = {
      modelSlug: row.car_slug,
      name: row.name,
      tagline: row.tagline,
      platform: row.platform,
      handle: row.handle,
      url: row.url,
      price: row.price,
      history: historyBySlug.get(row.car_slug) ?? [],
    };
  }

  return NextResponse.json({ patrons });
}
