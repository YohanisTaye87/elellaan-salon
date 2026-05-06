import Link from "next/link";
import { getServerClient } from "@/lib/supabase";
import HeaderLogo from "@/components/HeaderLogo";
import { formatBirr } from "@/lib/format";

export const revalidate = 0;

type Props = { searchParams: { id?: string } };

async function loadOrder(id: string) {
  try {
    const supabase = getServerClient();
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!order) return null;
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);
    return { order, items: items ?? [] };
  } catch (e) {
    console.error("[thank-you] could not load order:", e);
    return null;
  }
}

export default async function ThankYou({ searchParams }: Props) {
  const id = searchParams.id;
  const data = id ? await loadOrder(id) : null;

  return (
    <main className="mx-auto max-w-xl px-4 pt-10 pb-16">
      <div className="flex flex-col items-center animate-fade-up">
        <HeaderLogo />

        <div className="mt-8 w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center shadow-pop animate-scale-in">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-white"
          >
            <path
              d="M5 12.5L10 17.5L19 8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink text-center">
          Thank you{data?.order.customer_name ? `, ${data.order.customer_name}` : ""}!
        </h1>
        <p className="mt-2 text-center text-ink-muted">
          Please show this screen at the counter.
        </p>

        {data ? (
          <div className="card mt-8 w-full p-5 animate-fade-up">
            <ul className="divide-y divide-brand-100">
              {data.items.map((it) => (
                <li
                  key={it.id}
                  className="flex justify-between py-3 text-sm"
                >
                  <span className="pr-2">
                    <span className="block text-ink">{it.service_name}</span>
                    <span className="block text-ink-muted text-xs">
                      {it.category_name}
                    </span>
                  </span>
                  <span className="tabular-nums font-medium text-ink">
                    {formatBirr(it.price)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-brand-200">
              <span className="text-ink-muted">Total</span>
              <span className="text-2xl font-semibold tabular-nums text-brand-700">
                {formatBirr(data.order.total)}
              </span>
            </div>
            <p className="mt-4 text-[11px] text-ink-muted text-center">
              Order #{data.order.id.slice(0, 8)} ·{" "}
              {new Date(data.order.created_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="mt-8 card p-5 text-center text-sm text-ink-muted">
            <p className="text-ink font-medium">Your order is confirmed.</p>
            <p className="mt-2">
              Please show this screen at the counter — the staff will pull up
              your details there.
            </p>
          </div>
        )}

        <Link href="/" className="btn-ghost mt-8">
          Done
        </Link>
      </div>
    </main>
  );
}
