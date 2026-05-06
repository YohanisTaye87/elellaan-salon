import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;
  let expected: string;
  try {
    expected = getAdminPassword();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server misconfigured." },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
