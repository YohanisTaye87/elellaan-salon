import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { normalizeCustomerName } from "@/lib/normalize";

export const dynamic = "force-dynamic";

/**
 * GET /api/history?name=Alice
 *
 * Returns the customer's own past orders. The match is exact on the normalized
 * name (whitespace collapsed, lowercased) so "biruk abebe" finds rows stored
 * as "Biruk Abebe", "BIRUK  ABEBE", etc., but never substring-matches another
 * customer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { displayName, key } = normalizeCustomerName(searchParams.get("name") ?? "");
  if (key.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 }
    );
  }

  try {
    const supabase = getServerClient();
    // Use ilike with the normalized display name — no % or _ in it, so this
    // resolves to a case-insensitive equality on the stored value.
    // We also normalize stored values at insert time, so they line up.
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, customer_name, phone, comment, total, order_items(id,service_name,category_name,price)")
      .ilike("customer_name", displayName)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    // Belt-and-suspenders: filter the response in JS by the normalized key,
    // so any legacy rows with stray whitespace from before this fix don't
    // sneak in via ilike's collation rules.
    const orders = (data ?? []).filter((o) => {
      const stored = (o.customer_name ?? "")
        .toLocaleLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      return stored === key;
    });

    return NextResponse.json({ orders, query: displayName });
  } catch (e) {
    console.error("[history] error:", e);
    return NextResponse.json(
      { error: "Couldn't load your history right now." },
      { status: 500 }
    );
  }
}
