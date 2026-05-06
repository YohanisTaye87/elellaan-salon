import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/:id/comment — public; called from the thank-you page.
 *
 * The customer can write feedback once. We don't require a token because the
 * order id itself is a UUID — anyone who knows it can leave the comment, and
 * that's intentional (we trust the receipt page).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const raw = (body as { comment?: unknown } | null)?.comment;
  const comment =
    typeof raw === "string" ? raw.trim().slice(0, 500) : "";
  if (comment.length < 2) {
    return NextResponse.json(
      { error: "Please write a short comment (at least 2 characters)." },
      { status: 400 }
    );
  }

  try {
    const supabase = getServerClient();
    const { error } = await supabase
      .from("orders")
      .update({ comment })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true, comment });
  } catch (e) {
    console.error("[comment] error:", e);
    return NextResponse.json(
      { error: "Couldn't save your comment." },
      { status: 500 }
    );
  }
}
