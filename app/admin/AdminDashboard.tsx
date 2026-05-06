"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderLogo from "@/components/HeaderLogo";
import { formatBirr } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

type AdminOrder = {
  id: string;
  created_at: string;
  customer_name: string | null;
  total: number;
  order_items: OrderItem[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"today" | "week" | "all">("today");

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load orders.");
      const body = await res.json();
      setOrders(body.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  const now = Date.now();
  const filtered = (orders ?? []).filter((o) => {
    const t = new Date(o.created_at).getTime();
    if (filter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return t >= start.getTime();
    }
    if (filter === "week") return t >= now - 7 * 24 * 3600 * 1000;
    return true;
  });

  const total = filtered.reduce((s, o) => s + o.total, 0);
  const count = filtered.length;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-16">
      <header className="flex items-center justify-between mb-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <HeaderLogo />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-ink-muted">Orders & revenue</p>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost text-sm px-4 py-2">
          Sign out
        </button>
      </header>

      <div className="flex gap-2 mb-4">
        <Link
          href="/admin"
          className="rounded-full px-4 py-1.5 text-sm font-medium bg-brand-500 text-white shadow-pop"
        >
          Orders
        </Link>
        <Link
          href="/admin/services"
          className="rounded-full px-4 py-1.5 text-sm font-medium bg-white/70 text-brand-700 border border-brand-100"
        >
          Services
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-4">
          <div className="text-xs text-ink-muted">Orders</div>
          <div className="text-3xl font-semibold tabular-nums">{count}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-muted">Revenue</div>
          <div className="text-3xl font-semibold tabular-nums text-brand-700">
            {formatBirr(total)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["today", "week", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f
                ? "bg-brand-500 text-white shadow-pop"
                : "bg-white/70 text-brand-700 border border-brand-100"
            }`}
          >
            {f === "today" ? "Today" : f === "week" ? "Last 7 days" : "All"}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto rounded-full px-4 py-1.5 text-sm font-medium bg-white/70 text-brand-700 border border-brand-100"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {orders == null ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">
          No orders in this range yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id} className="card p-4 animate-fade-up">
              <div className="flex justify-between items-baseline mb-2">
                <div>
                  <div className="font-medium text-ink">
                    {o.customer_name || "Walk-in"}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {new Date(o.created_at).toLocaleString()} · #
                    {o.id.slice(0, 8)}
                  </div>
                </div>
                <div className="text-xl font-semibold tabular-nums text-brand-700">
                  {formatBirr(o.total)}
                </div>
              </div>
              <ul className="divide-y divide-brand-100">
                {o.order_items.map((it) => (
                  <li
                    key={it.id}
                    className="flex justify-between py-1.5 text-sm"
                  >
                    <span className="pr-2">
                      <span className="text-ink">{it.service_name}</span>{" "}
                      <span className="text-ink-muted text-xs">
                        · {it.category_name}
                      </span>
                    </span>
                    <span className="tabular-nums text-ink">
                      {formatBirr(it.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
