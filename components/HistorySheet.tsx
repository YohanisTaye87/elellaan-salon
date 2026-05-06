"use client";

import { useEffect, useState } from "react";

type HistoryOrder = {
  id: string;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
  comment: string | null;
  total: number;
  order_items: {
    id: string;
    service_name: string;
    category_name: string;
    price: number;
  }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  prefillName: string;
};

export default function HistorySheet({ open, onClose, prefillName }: Props) {
  const [name, setName] = useState(prefillName);
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Keep local name in sync if the customer types something in the bottom bar.
  useEffect(() => {
    if (open) setName(prefillName);
  }, [open, prefillName]);

  // Auto-fetch when the sheet opens with a usable name.
  useEffect(() => {
    if (open && prefillName.trim().length >= 2 && !searched) {
      void search(prefillName);
    }
    if (!open) {
      // Reset when closed so reopening with a new name re-fetches.
      setSearched(false);
      setOrders(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function search(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setError("Please enter your name (at least 2 letters).");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/history?name=${encodeURIComponent(trimmed)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't load history.");
      setOrders(body.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load history.");
      setOrders(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-brand-900/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Sheet */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Order history"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md
                    bg-surface-subtle border-l border-brand-100 shadow-glass
                    transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-brand-100 bg-white/70 backdrop-blur-xl">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Your history</h2>
              <p className="text-xs text-ink-muted">Past visits at Elellaan</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close history"
              className="tap-bounce w-9 h-9 rounded-full bg-white border border-brand-100 flex items-center justify-center text-ink-muted hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search(name);
            }}
            className="px-4 py-3 bg-white/40 border-b border-brand-100"
          >
            <label className="block text-xs text-ink-muted mb-1.5">
              Enter your name to find past visits
            </label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <button
                type="submit"
                disabled={loading || name.trim().length < 2}
                className="btn-primary tap-bounce min-w-[88px]"
              >
                {loading ? (
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  "Find"
                )}
              </button>
            </div>
          </form>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {error && (
              <p className="text-sm text-red-600 mb-3 animate-fade-up">{error}</p>
            )}

            {!searched && !loading && (
              <Empty
                title="Type your name above"
                hint="We'll show every visit recorded under that name."
              />
            )}

            {searched && !loading && orders && orders.length === 0 && (
              <Empty
                title="No visits yet"
                hint={`We couldn't find any past orders for "${name.trim()}". If you've been here before, try the exact spelling.`}
              />
            )}

            {orders && orders.length > 0 && (
              <>
                <Summary orders={orders} />
                <ul className="space-y-3 mt-4">
                  {orders.map((o) => (
                    <li key={o.id} className="card p-4 animate-fade-up">
                      <div className="text-xs text-ink-muted mb-2">
                        {formatDate(o.created_at)}
                      </div>
                      <ul className="divide-y divide-brand-100">
                        {o.order_items.map((it) => (
                          <li key={it.id} className="py-1.5 text-sm">
                            <span className="text-ink">{it.service_name}</span>{" "}
                            <span className="text-ink-muted text-xs">
                              · {it.category_name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {o.comment && (
                        <p className="mt-2 text-xs italic text-ink-muted whitespace-pre-line">
                          “{o.comment}”
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Summary({ orders }: { orders: HistoryOrder[] }) {
  const lastVisit = orders[0]?.created_at;
  return (
    <div className="grid grid-cols-2 gap-3 animate-fade-up">
      <div className="card p-3 text-center">
        <div className="text-[11px] uppercase tracking-wider text-ink-muted">
          Visits
        </div>
        <div className="text-2xl font-semibold tabular-nums">
          {orders.length}
        </div>
      </div>
      <div className="card p-3 text-center">
        <div className="text-[11px] uppercase tracking-wider text-ink-muted">
          Last visit
        </div>
        <div className="text-sm font-semibold text-brand-700 mt-1">
          {lastVisit
            ? new Date(lastVisit).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </div>
      </div>
    </div>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="card p-6 text-center text-ink-muted animate-fade-up">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1.5 text-sm">{hint}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
