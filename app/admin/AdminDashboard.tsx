"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderLogo from "@/components/HeaderLogo";
import { formatBirr } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

type FilterMode = "today" | "week" | "month" | "all" | "custom";

type AdminOrder = {
  id: string;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
  comment: string | null;
  total: number;
  order_items: OrderItem[];
};

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = () => isoDay(new Date());
const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return isoDay(d);
};
const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return isoDay(d);
};

function formatRangeLabel(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FilterMode>("today");
  const [customFrom, setCustomFrom] = useState<string>(today());
  const [customTo, setCustomTo] = useState<string>(today());

  // Effective range, derived from preset or custom inputs.
  const { from, to } = useMemo<{ from: string | null; to: string | null }>(
    () => {
      switch (mode) {
        case "today": return { from: today(), to: today() };
        case "week":  return { from: startOfWeek(), to: today() };
        case "month": return { from: startOfMonth(), to: today() };
        case "all":   return { from: null, to: null };
        case "custom":
        default:      return { from: customFrom, to: customTo };
      }
    },
    [mode, customFrom, customTo]
  );

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

  const filtered = (orders ?? []).filter((o) => {
    const t = new Date(o.created_at).getTime();
    const fromTs = from
      ? new Date(`${from}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    const toTs = to
      ? new Date(`${to}T23:59:59.999`).getTime()
      : Number.POSITIVE_INFINITY;
    return t >= fromTs && t <= toTs;
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

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(
          [
            ["today", "Today"],
            ["week", "This week"],
            ["month", "This month"],
            ["all", "All"],
            ["custom", "Custom"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              mode === m
                ? "bg-brand-500 text-white shadow-pop"
                : "bg-white/70 text-brand-700 border border-brand-100"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto rounded-full px-4 py-1.5 text-sm font-medium bg-white/70 text-brand-700 border border-brand-100"
        >
          Refresh
        </button>
      </div>

      {mode === "custom" && (
        <div className="card p-3 mb-4 grid grid-cols-2 gap-2 animate-fade-up">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted">
              From
            </span>
            <input
              type="date"
              className="input mt-1"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted">
              To
            </span>
            <input
              type="date"
              className="input mt-1"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </label>
        </div>
      )}

      {mode !== "custom" && from && to && (
        <p className="px-1 mb-3 text-[11px] text-ink-muted tabular-nums">
          {formatRangeLabel(from, to)}
        </p>
      )}

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
                  {o.phone && (
                    <a
                      href={`tel:${o.phone}`}
                      className="text-xs text-brand-700 hover:underline tabular-nums"
                    >
                      {o.phone}
                    </a>
                  )}
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
              {o.comment && (
                <div className="mt-3 rounded-2xl bg-brand-50 border border-brand-100 px-3 py-2.5 text-sm text-ink-soft">
                  <div className="text-[10px] uppercase tracking-wider text-brand-600 mb-1">
                    Customer comment
                  </div>
                  <p className="whitespace-pre-line">{o.comment}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
