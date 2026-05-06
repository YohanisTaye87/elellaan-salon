import { cookies } from "next/headers";
import { ADMIN_COOKIE, getAdminPassword } from "@/lib/auth";
import ServicesManager from "./ServicesManager";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  let expected = "";
  try {
    expected = getAdminPassword();
  } catch {
    return (
      <main className="mx-auto max-w-md px-4 pt-16">
        <div className="card p-6 text-center">
          <p className="font-semibold text-red-600">Admin not configured</p>
        </div>
      </main>
    );
  }
  const token = cookies().get(ADMIN_COOKIE)?.value ?? "";
  if (token !== expected) {
    // not signed in — bounce to /admin login
    return (
      <main className="mx-auto max-w-md px-4 pt-16">
        <div className="card p-6 text-center">
          <p className="text-ink">Please sign in.</p>
          <a href="/admin" className="btn-primary mt-4 inline-flex">
            Go to login
          </a>
        </div>
      </main>
    );
  }
  return <ServicesManager />;
}
