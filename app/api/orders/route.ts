import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";
import { normalizeCustomerName } from "@/lib/normalize";

export const dynamic = "force-dynamic";

const QTY_MAX = 9;

type LineItem = { service_id: string; quantity: number };

/**
 * Pull line items out of the request body. Accepts the new shape:
 *
 *   { items: [{ service_id, quantity }] }
 *
 * and stays backward-compatible with old clients that send:
 *
 *   { service_ids: string[] }   // each becomes quantity 1
 */
function extractItems(body: unknown): LineItem[] | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { items?: unknown; service_ids?: unknown };

  if (Array.isArray(b.items) && b.items.length > 0) {
    const out: LineItem[] = [];
    for (const raw of b.items) {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as { service_id?: unknown; quantity?: unknown };
      if (typeof r.service_id !== "string" || r.service_id.length === 0) return null;
      const q =
        typeof r.quantity === "number" && Number.isFinite(r.quantity)
          ? Math.max(1, Math.min(QTY_MAX, Math.floor(r.quantity)))
          : 1;
      out.push({ service_id: r.service_id, quantity: q });
    }
    return out;
  }

  if (Array.isArray(b.service_ids) && b.service_ids.length > 0) {
    const out: LineItem[] = [];
    for (const id of b.service_ids) {
      if (typeof id !== "string" || id.length === 0) return null;
      out.push({ service_id: id, quantity: 1 });
    }
    return out;
  }

  return null;
}

/** POST /api/orders — public; called by the customer when they confirm. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = extractItems(body);
  if (!items) {
    return NextResponse.json(
      { error: "Pick at least one service." },
      { status: 400 }
    );
  }

  const supabase = getServerClient();

  // Look up each selected service so prices and category names come from
  // the database, not the client. Never trust client-side prices.
  const ids = Array.from(new Set(items.map((i) => i.service_id)));
  const { data: services, error: sErr } = await supabase
    .from("services")
    .select("id, name, price_min, category_id, categories(name)")
    .in("id", ids);

  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 500 });
  }
  if (!services || services.length === 0) {
    return NextResponse.json(
      { error: "Selected services are no longer available." },
      { status: 400 }
    );
  }

  const byId = new Map(services.map((s) => [s.id, s]));
  const lines = items
    .map((it) => {
      const s = byId.get(it.service_id);
      if (!s) return null;
      const subtotal = s.price_min * it.quantity;
      const displayName =
        it.quantity > 1 ? `${s.name} × ${it.quantity}` : s.name;
      return {
        order_id: "" as string, // filled in after order is created
        service_id: s.id,
        service_name: displayName,
        category_name:
          (s.categories as { name?: string } | null)?.name ?? "",
        price: subtotal,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (lines.length === 0) {
    return NextResponse.json(
      { error: "Selected services are no longer available." },
      { status: 400 }
    );
  }

  const total = lines.reduce((s, x) => s + x.price, 0);
  const customerName =
    typeof (body as { customer_name?: unknown }).customer_name === "string"
      ? normalizeCustomerName(
          (body as { customer_name: string }).customer_name
        ).displayName || null
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

  const rows = lines.map((l) => ({ ...l, order_id: order.id }));
  const { error: iErr } = await supabase.from("order_items").insert(rows);
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
