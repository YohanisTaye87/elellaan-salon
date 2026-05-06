import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase";
import HeaderLogo from "@/components/HeaderLogo";
import ServiceSelector from "@/components/ServiceSelector";
import FriendlyError from "@/components/FriendlyError";
import type { Category, Service } from "@/lib/types";

// Re-fetch fresh data each visit so admin edits show up immediately.
export const revalidate = 0;

async function loadData(): Promise<{ categories: Category[]; services: Service[] }> {
  // The anon key is safe in the browser, and is also fine on the server.
  const supabase = getBrowserClient();

  const [{ data: categories, error: cErr }, { data: services, error: sErr }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("services").select("*").order("sort_order"),
    ]);

  if (cErr) throw cErr;
  if (sErr) throw sErr;
  return { categories: categories ?? [], services: services ?? [] };
}

export default async function Home() {
  let categories: Category[] = [];
  let services: Service[] = [];
  let loadError: string | null = null;

  try {
    const data = await loadData();
    categories = data.categories;
    services = data.services;
  } catch (e) {
    // Log full detail server-side for staff/dev — show only a friendly
    // message to the customer. Never leak stack traces or env-var names.
    console.error("[home] could not load services:", e);
    loadError = e instanceof Error ? e.message : "Failed to load services.";
  }

  const noData = !loadError && categories.length === 0;

  return (
    <main className="mx-auto max-w-xl px-4 pt-6">
      <header className="flex flex-col items-center pt-2 pb-4">
        <HeaderLogo size={104} />
        <p className="mt-4 text-sm text-ink-muted animate-stagger-2">
          Tap the services you&rsquo;d like today
        </p>
      </header>

      {loadError || noData ? (
        <FriendlyError />
      ) : (
        <ServiceSelector categories={categories} services={services} />
      )}

      <div className="mt-6 text-center text-[11px] text-ink-muted">
        <Link href="/admin" className="hover:underline">
          Staff
        </Link>
      </div>
    </main>
  );
}
