"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Service } from "@/lib/types";
import { formatBirr, formatPriceRange } from "@/lib/format";
import CheckIcon from "./CheckIcon";
import HistorySheet from "./HistorySheet";

type Props = {
  categories: Category[];
  services: Service[];
};

export default function ServiceSelector({ categories, services }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchedName, setTouchedName] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? "");

  const servicesByCat = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const arr = map.get(s.category_id) ?? [];
      arr.push(s);
      map.set(s.category_id, arr);
    }
    return map;
  }, [services]);

  const selectedServices = useMemo(
    () => services.filter((s) => selected.has(s.id)),
    [services, selected]
  );

  const total = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price_min, 0),
    [selectedServices]
  );

  const trimmedName = customerName.trim();
  const nameValid = trimmedName.length >= 2;
  const canSubmit = selected.size > 0 && nameValid && !submitting;

  // Measure the sticky bottom panel so the page content always clears it,
  // regardless of how many items are selected or whether the error is shown.
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(180);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !panelRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      if (h > 0) setPanelHeight(Math.ceil(h));
    });
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!canSubmit) {
      if (!nameValid) setTouchedName(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: trimmedName,
          service_ids: Array.from(selected),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not submit your order.");
      }
      const { order_id } = await res.json();
      router.push(`/thank-you?id=${order_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ paddingBottom: panelHeight + 24 }}>
      {/* Floating right-edge History tab */}
      <button
        onClick={() => setHistoryOpen(true)}
        aria-label="View your visit history"
        className="fixed top-4 right-4 z-30 tap-bounce flex items-center gap-1.5
                   rounded-full bg-white/85 backdrop-blur-xl border border-brand-100
                   px-3.5 py-2 text-sm font-medium text-brand-700 shadow-card
                   hover:bg-white hover:shadow-pop transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
        History
      </button>

      <HistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        prefillName={trimmedName}
      />

      {/* Category pills (sticky) */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 glass">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCat(c.id);
                document
                  .getElementById(`cat-${c.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{ animationDelay: `${i * 25}ms` }}
              className={`tap-bounce animate-fade-up whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeCat === c.id
                  ? "bg-brand-500 text-white shadow-pop"
                  : "bg-white/70 text-brand-700 border border-brand-100"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mt-4 space-y-6">
        {categories.map((cat, ci) => {
          const items = servicesByCat.get(cat.id) ?? [];
          if (items.length === 0) return null;
          return (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="animate-fade-up"
              style={{ animationDelay: `${ci * 40}ms` }}
            >
              <h2 className="px-1 mb-2 text-lg font-semibold tracking-tight text-ink">
                {cat.name}
              </h2>
              <ul className="card divide-y divide-brand-100 overflow-hidden">
                {items.map((s) => {
                  const checked = selected.has(s.id);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        data-checked={checked}
                        className="row-button w-full flex items-center gap-3 px-4 py-3.5 hover:bg-brand-50 text-left"
                      >
                        <span
                          className={`tick ${checked ? "animate-tick-pop" : ""}`}
                          data-checked={checked}
                        >
                          <CheckIcon />
                        </span>
                        <span className="flex-1">
                          <span className="block font-medium text-ink">{s.name}</span>
                          <span className="block text-sm text-ink-muted">
                            {formatPriceRange(s.price_min, s.price_max)}
                            {s.price_max != null && (
                              <span className="ml-1 text-[11px] text-brand-500">
                                (varies)
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Sticky total + submit */}
      <div className="fixed inset-x-0 bottom-0 z-30 bottom-safe pointer-events-none">
        <div className="mx-auto max-w-xl px-4 pointer-events-auto">
          <div
            ref={panelRef}
            className="glass rounded-apple px-4 py-3 mb-3 animate-scale-in"
          >
            {selected.size > 0 && (
              <div className="mb-3 max-h-32 overflow-y-auto pr-1">
                <ul className="space-y-1">
                  {selectedServices.map((s) => (
                    <li
                      key={s.id}
                      className="flex justify-between text-sm text-ink-soft animate-fade-up"
                    >
                      <span className="truncate pr-2">{s.name}</span>
                      <span className="tabular-nums text-ink">
                        {formatBirr(s.price_min)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-3">
              <input
                className={`input ${
                  touchedName && !nameValid
                    ? "border-red-300 focus:ring-red-200 focus:border-red-300"
                    : ""
                }`}
                placeholder="Your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onBlur={() => setTouchedName(true)}
                maxLength={60}
                aria-invalid={touchedName && !nameValid}
                aria-required="true"
                autoComplete="name"
              />
              {touchedName && !nameValid && (
                <p className="mt-1 ml-1 text-xs text-red-600 animate-fade-up">
                  Please enter your name (at least 2 letters).
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                  {selected.size === 0
                    ? "No services yet"
                    : `${selected.size} service${selected.size > 1 ? "s" : ""}`}
                </div>
                <div className="text-2xl font-semibold tabular-nums text-ink">
                  {formatBirr(total)}
                </div>
              </div>
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="btn-primary tap-bounce px-7 min-w-[120px]"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Sending
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 animate-fade-up">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
