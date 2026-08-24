import { NextRequest, NextResponse } from "next/server";
import { CARS } from "@/data/cars";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const slug = body.slug;
  if (!slug || !CARS.some((c) => c.slug === slug)) {
    return NextResponse.json({ error: "Araç modeli bulunamadı." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db.rpc("increment_car_vote", { p_car_slug: slug });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ votes: data });
}
