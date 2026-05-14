"use client";

import { useEffect, useState } from "react";
import { formatBirr } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

type EditableOrder = {
  id: string;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
  comment: string | null;
  total: number;
  order_items: OrderItem[];
};

type DraftItem = {
  // existing items keep their original id for stable keys;
  // new items use a temporary local id.
  _localId: string;
  service_name: string;
  category_name: string;
  price: string; // kept as string so the input behaves naturally
};

type Props = {
  order: EditableOrder | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string {
  return new Date(local).toISOString();
}

let localCounter = 0;
const nextLocalId = () => `new-${++localCounter}`;

export default function OrderEditor({ order, onClose, onSaved, onDeleted }: Props) {
  const open = order != null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [when, setWhen] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate every time a different order is opened.
  useEffect(() => {
    if (!order) return;
    setName(order.customer_name ?? "");
    setPhone(order.phone ?? "");
    setComment(order.comment ?? "");
    setWhen(isoToLocalInput(order.created_at));
    setItems(
      order.order_items.map((it) => ({
        _localId: it.id,
        service_name: it.service_name,
        category_name: it.category_name,
        price: String(it.price),
      }))
    );
    setError(null);
  }, [order]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const total = items.reduce((s, i) => {
    const n = Number(i.price);
    return s + (Number.isFinite(n) ? Math.max(0, n) : 0);
  }, 0);

  function patchItem(localId: string, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((it) => (it._localId === localId ? { ...it, ...patch } : it))
    );
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((it) => it._localId !== localId));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        _localId: nextLocalId(),
        service_name: "",
        category_name: "",
        price: "0",
      },
    ]);
  }

  async function save() {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        customer_name: name,
        phone,
        comment,
        created_at: localInputToIso(when),
        items: items
          .filter((it) => it.service_name.trim().length > 0)
          .map((it) => ({
            service_name: it.service_name.trim(),
            category_name: it.category_name.trim(),
            price: Math.max(0, Math.round(Number(it.price) || 0)),
          })),
      };
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!order) return;
    if (
      !confirm(
        `Delete the order for "${name || "Walk-in"}"? This can't be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not delete.");
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        onClick={open ? onClose : undefined}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-brand-900/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Edit order"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md
                    bg-surface-subtle border-l border-brand-100 shadow-glass
                    transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {order && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-brand-100 bg-white/70 backdrop-blur-xl">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Edit order
                </h2>
                <p className="text-xs text-ink-muted">
                  #{order.id.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
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

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Basic fields */}
              <div className="card p-4 grid gap-3">
                <Labeled label="Customer name">
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    placeholder="Walk-in"
                  />
                </Labeled>
                <Labeled label="Phone">
                  <input
                    className="input"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    placeholder="+251…"
                  />
                </Labeled>
                <Labeled label="Date & time">
                  <input
                    className="input"
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                  />
                </Labeled>
                <Labeled label="Customer comment">
                  <textarea
                    className="input min-h-[68px] resize-y"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="—"
                  />
                </Labeled>
              </div>

              {/* Items */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-ink">Services</h3>
                  <span className="text-xs text-ink-muted tabular-nums">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-ink-muted py-3">
                    No services on this order.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((it) => (
                      <li
                        key={it._localId}
                        className="rounded-2xl border border-brand-100 bg-white p-2 grid gap-2"
                      >
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input
                            className="input"
                            value={it.service_name}
                            onChange={(e) =>
                              patchItem(it._localId, {
                                service_name: e.target.value,
                              })
                            }
                            placeholder="Service name"
                          />
                          <button
                            onClick={() => removeItem(it._localId)}
                            className="tap-bounce w-9 h-9 rounded-full bg-white border border-brand-100 flex items-center justify-center text-ink-muted hover:text-red-600"
                            aria-label="Remove item"
                            type="button"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M6 6l12 12M18 6L6 18"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="input"
                            value={it.category_name}
                            onChange={(e) =>
                              patchItem(it._localId, {
                                category_name: e.target.value,
                              })
                            }
                            placeholder="Category"
                          />
                          <input
                            className="input"
                            inputMode="numeric"
                            value={it.price}
                            onChange={(e) =>
                              patchItem(it._localId, {
                                price: e.target.value.replace(/[^\d]/g, ""),
                              })
                            }
                            placeholder="Price (ETB)"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-ghost tap-bounce mt-3 w-full"
                >
                  + Add service
                </button>
              </div>

              <div className="card p-4 flex items-baseline justify-between">
                <span className="text-ink-muted">Total</span>
                <span className="text-2xl font-semibold tabular-nums text-brand-700">
                  {formatBirr(total)}
                </span>
              </div>

              {error && (
                <p className="text-sm text-red-600 animate-fade-up">{error}</p>
              )}

              <button
                onClick={destroy}
                disabled={busy}
                className="w-full rounded-full bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-medium px-5 py-3 border border-red-200 transition-colors disabled:opacity-40"
              >
                Delete order
              </button>
            </div>

            <div className="border-t border-brand-100 bg-white/70 backdrop-blur-xl px-4 py-3 flex gap-2 bottom-safe">
              <button
                onClick={onClose}
                disabled={busy}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="btn-primary tap-bounce flex-1"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
