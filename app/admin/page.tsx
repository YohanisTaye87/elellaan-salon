import { cookies } from "next/headers";
import { ADMIN_COOKIE, getAdminPassword } from "@/lib/auth";
import LoginForm from "./LoginForm";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  let expected = "";
  let configError: string | null = null;
  try {
    expected = getAdminPassword();
  } catch (e) {
    console.error("[admin] config error:", e);
    configError = "Admin sign-in is temporarily unavailable.";
  }

  const token = cookies().get(ADMIN_COOKIE)?.value ?? "";
  const isAuthed = !configError && token === expected;

  if (configError) {
    return (
      <main className="mx-auto max-w-md px-4 pt-16">
        <div className="card p-6 text-center">
          <p className="font-semibold text-ink">{configError}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Please try again in a minute.
          </p>
        </div>
      </main>
    );
  }

  return isAuthed ? <AdminDashboard /> : <LoginForm />;
}
