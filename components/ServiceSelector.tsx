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

const QTY_MAX = 9;

export default function ServiceSelector({ categories, services }: Props) {
  const router = useRouter();
  // service id -> quantity (1..9). Absent = not selected.
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
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

  // Detect "Wig" category — those services use a 1..9 stepper instead of a
  // checkbox so customers can buy multiples at the unit price.
  const wigCategoryIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of categories) {
      if (c.name.trim().toLowerCase() === "wig") set.add(c.id);
    }
    return set;
  }, [categories]);

  function isQuantityService(s: Service): boolean {
    return wigCategoryIds.has(s.category_id);
  }

  const selectedItems = useMemo(() => {
    const out: { service: Service; qty: number; subtotal: number }[] = [];
    for (const s of services) {
      const q = quantities.get(s.id) ?? 0;
      if (q > 0) out.push({ service: s, qty: q, subtotal: s.price_min * q });
    }
    return out;
  }, [services, quantities]);

  const total = useMemo(
    () => selectedItems.reduce((sum, x) => sum + x.subtotal, 0),
    [selectedItems]
  );

  const trimmedName = customerName.trim();
  const nameValid = trimmedName.length >= 2;
  const canSubmit = selectedItems.length > 0 && nameValid && !submitting;

  // Measure the sticky bottom panel so the page content always clears it.
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

  function setQty(id: string, n: number) {
    setQuantities((prev) => {
      const next = new Map(prev);
      const clamped = Math.max(0, Math.min(QTY_MAX, n));
      if (clamped <= 0) next.delete(id);
      else next.set(id, clamped);
      return next;
    });
  }

  function toggle(id: string) {
    const cur = quantities.get(id) ?? 0;
    setQty(id, cur > 0 ? 0 : 1);
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
          items: selectedItems.map((x) => ({
            service_id: x.service.id,
            quantity: x.qty,
          })),
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
                {items.map((s) =>
                  isQuantityService(s) ? (
                    <QtyRow
                      key={s.id}
                      service={s}
                      qty={quantities.get(s.id) ?? 0}
                      onChange={(n) => setQty(s.id, n)}
                    />
                  ) : (
                    <CheckRow
                      key={s.id}
                      service={s}
                      checked={(quantities.get(s.id) ?? 0) > 0}
                      onToggle={() => toggle(s.id)}
                    />
                  )
                )}
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
            {selectedItems.length > 0 && (
              <div className="mb-3 max-h-32 overflow-y-auto pr-1">
                <ul className="space-y-1">
                  {selectedItems.map((x) => (
                    <li
                      key={x.service.id}
                      className="flex justify-between text-sm text-ink-soft animate-fade-up"
                    >
                      <span className="truncate pr-2">
                        {x.service.name}
                        {x.qty > 1 && (
                          <span className="text-brand-500"> × {x.qty}</span>
                        )}
                      </span>
                      <span className="tabular-nums text-ink">
                        {formatBirr(x.subtotal)}
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
                  {selectedItems.length === 0
                    ? "No services yet"
                    : `${selectedItems.length} service${
                        selectedItems.length > 1 ? "s" : ""
                      }`}
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

// ---------- row variants ----------

function CheckRow({
  service,
  checked,
  onToggle,
}: {
  service: Service;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
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
          <span className="block font-medium text-ink">{service.name}</span>
          <span className="block text-sm text-ink-muted">
            {formatPriceRange(service.price_min, service.price_max)}
            {service.price_max != null && (
              <span className="ml-1 text-[11px] text-brand-500">(varies)</span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

function QtyRow({
  service,
  qty,
  onChange,
}: {
  service: Service;
  qty: number;
  onChange: (n: number) => void;
}) {
  const active = qty > 0;
  const subtotal = service.price_min * qty;
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
        active ? "bg-brand-50" : "hover:bg-brand-50/50"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-ink truncate">{service.name}</div>
        <div className="text-sm text-ink-muted tabular-nums">
          {formatPriceRange(service.price_min, service.price_max)} each
          {qty > 1 && (
            <span className="ml-2 text-brand-700 font-medium">
              · {formatBirr(subtotal)}
            </span>
          )}
        </div>
      </div>
      <Stepper value={qty} onChange={onChange} />
    </li>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  if (value === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-label="Add"
        className="tap-bounce h-9 w-9 rounded-full bg-white border border-brand-200 text-brand-700 flex items-center justify-center hover:bg-brand-100"
      >
        <PlusIcon />
      </button>
    );
  }
  return (
    <div className="flex items-center bg-white rounded-full border border-brand-200 shadow-card overflow-hidden animate-scale-in">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="Decrease"
        className="tap-bounce h-9 w-9 flex items-center justify-center text-brand-700 hover:bg-brand-100"
      >
        <MinusIcon />
      </button>
      <span className="w-7 text-center font-semibold tabular-nums text-ink">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= QTY_MAX}
        aria-label="Increase"
        className="tap-bounce h-9 w-9 flex items-center justify-center text-brand-700 hover:bg-brand-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
