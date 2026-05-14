import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/auth";
import { normalizeCustomerName, normalizePhone } from "@/lib/normalize";

export const dynamic = "force-dynamic";

type EditableItem = {
  service_name: string;
  category_name?: string;
  price: number;
};

/**
 * PATCH /api/orders/:id — admin only.
 *
 * Any subset of these fields can be sent:
 *   - customer_name   (string | null)
 *   - phone           (string | null)
 *   - comment         (string | null)
 *   - created_at      (ISO string — admin can backdate)
 *   - items           (array — replaces all order_items; total is recomputed)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orderId = params.id;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const supabase = getServerClient();
  const update: Record<string, unknown> = {};

  if ("customer_name" in body) {
    const v = body.customer_name;
    update.customer_name =
      typeof v === "string" && v.trim().length > 0
        ? normalizeCustomerName(v).displayName || null
        : null;
  }
  if ("phone" in body) {
    const v = body.phone;
    update.phone = typeof v === "string" ? normalizePhone(v) : null;
  }
  if ("comment" in body) {
    const v = body.comment;
    const t = typeof v === "string" ? v.trim().slice(0, 500) : "";
    update.comment = t.length > 0 ? t : null;
  }
  if (typeof body.created_at === "string" && body.created_at.length > 0) {
    const d = new Date(body.created_at);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "Invalid date." },
        { status: 400 }
      );
    }
    update.created_at = d.toISOString();
  }

  // Items: replace strategy. Delete all, insert new, recompute total.
  if (Array.isArray(body.items)) {
    const raw = body.items as unknown[];
    const items: { order_id: string; service_name: string; category_name: string; price: number }[] = [];
    for (const r of raw) {
      if (!r || typeof r !== "object") continue;
      const item = r as Partial<EditableItem>;
      if (typeof item.service_name !== "string") continue;
      if (typeof item.price !== "number" || !Number.isFinite(item.price)) continue;
      const name = item.service_name.trim().slice(0, 120);
      if (name.length === 0) continue;
      items.push({
        order_id: orderId,
        service_name: name,
        category_name: (item.category_name ?? "").trim().slice(0, 60),
        price: Math.max(0, Math.round(item.price)),
      });
    }

    const { error: delErr } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
    if (items.length > 0) {
      const { error: insErr } = await supabase
        .from("order_items")
        .insert(items);
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }
    update.total = items.reduce((s, i) => s + i.price, 0);
  }

  if (Object.keys(update).length > 0) {
    const { error: upErr } = await supabase
      .from("orders")
      .update(update)
      .eq("id", orderId);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/orders/:id — admin only. Cascades to order_items. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getServerClient();
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
