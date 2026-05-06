import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/orders — public; called by the customer when they confirm. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.service_ids) || body.service_ids.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one service." },
      { status: 400 }
    );
  }

  const supabase = getServerClient();

  // Look up each selected service so prices and category names come from
  // the database, not the client. Never trust client-side prices.
  const { data: services, error: sErr } = await supabase
    .from("services")
    .select("id, name, price_min, category_id, categories(name)")
    .in("id", body.service_ids);

  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 500 });
  }
  if (!services || services.length === 0) {
    return NextResponse.json(
      { error: "Selected services are no longer available." },
      { status: 400 }
    );
  }

  const total = services.reduce((s, x) => s + x.price_min, 0);
  const customerName =
    typeof body.customer_name === "string" && body.customer_name.trim().length > 0
      ? body.customer_name.trim().slice(0, 60)
      : null;

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({ customer_name: customerName, total })
    .select()
    .single();

  if (oErr || !order) {
    return NextResponse.json(
      { error: oErr?.message ?? "Could not create order." },
      { status: 500 }
    );
  }

  const items = services.map((s) => ({
    order_id: order.id,
    service_id: s.id,
    service_name: s.name,
    category_name: (s.categories as { name?: string } | null)?.name ?? "",
    price: s.price_min,
  }));

  const { error: iErr } = await supabase.from("order_items").insert(items);
  if (iErr) {
    // best-effort cleanup
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: iErr.message }, { status: 500 });
  }

  return NextResponse.json({ order_id: order.id, total });
}

/** GET /api/orders — admin only. Returns recent orders with their items. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getServerClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, created_at, customer_name, total, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ orders });
}
