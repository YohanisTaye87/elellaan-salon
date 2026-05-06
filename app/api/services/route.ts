import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.category_id !== "string" ||
    typeof body.price_min !== "number"
  ) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: body.name.trim().slice(0, 80),
      category_id: body.category_id,
      price_min: Math.max(0, Math.round(body.price_min)),
      price_max:
        typeof body.price_max === "number"
          ? Math.max(body.price_min, Math.round(body.price_max))
          : null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") update.name = body.name.trim().slice(0, 80);
  if (typeof body.category_id === "string") update.category_id = body.category_id;
  if (typeof body.price_min === "number")
    update.price_min = Math.max(0, Math.round(body.price_min));
  if ("price_max" in body)
    update.price_max =
      typeof body.price_max === "number"
        ? Math.max(0, Math.round(body.price_max))
        : null;
  if (typeof body.sort_order === "number") update.sort_order = body.sort_order;

  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("services")
    .update(update)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const supabase = getServerClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
