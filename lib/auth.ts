import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "elellaan_admin";

export function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error("ADMIN_PASSWORD env var is not set.");
  }
  return pw;
}

export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    return token === getAdminPassword();
  } catch {
    return false;
  }
}
