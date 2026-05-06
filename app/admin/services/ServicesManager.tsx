"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HeaderLogo from "@/components/HeaderLogo";
import { getBrowserClient } from "@/lib/supabase";
import { formatPriceRange } from "@/lib/format";
import type { Category, Service } from "@/lib/types";

export default function ServicesManager() {
  const [cats, setCats] = useState<Category[]>([]);
  const [svcs, setSvcs] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // new-service form state
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<string>("");
  const [newMin, setNewMin] = useState<string>("");
  const [newMax, setNewMax] = useState<string>("");

  // new-category form state
  const [newCatName, setNewCatName] = useState("");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const sb = getBrowserClient();
      const [{ data: c, error: cErr }, { data: s, error: sErr }] =
        await Promise.all([
          sb.from("categories").select("*").order("sort_order"),
          sb.from("services").select("*").order("sort_order"),
        ]);
      if (cErr) throw cErr;
      if (sErr) throw sErr;
      setCats(c ?? []);
      setSvcs(s ?? []);
      if (c && c.length > 0 && !newCat) setNewCat(c[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCat || !newMin) return;
    setError(null);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        category_id: newCat,
        price_min: Number(newMin),
        price_max: newMax ? Number(newMax) : null,
        sort_order: 999,
      }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not add service.");
      return;
    }
    setNewName("");
    setNewMin("");
    setNewMax("");
    await reload();
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not delete.");
      return;
    }
    await reload();
  }

  async function updateService(s: Service, patch: Partial<Service>) {
    const res = await fetch("/api/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, ...patch }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not save.");
      return;
    }
    await reload();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not add category.");
      return;
    }
    setNewCatName("");
    await reload();
  }

  async function deleteCategory(id: string) {
    const inUse = svcs.some((s) => s.category_id === id);
    if (inUse) {
      alert("Move or delete the services in this category first.");
      return;
    }
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not delete.");
      return;
    }
    await reload();
  }

  const grouped = useMemo(() => {
    const m = new Map<string, Service[]>();
    for (const s of svcs) {
      const arr = m.get(s.category_id) ?? [];
      arr.push(s);
      m.set(s.category_id, arr);
    }
    return m;
  }, [svcs]);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-16">
      <header className="flex items-center justify-between mb-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <HeaderLogo />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
            <p className="text-sm text-ink-muted">Add, edit, or remove</p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 mb-4">
        <Link
          href="/admin"
          className="rounded-full px-4 py-1.5 text-sm font-medium bg-white/70 text-brand-700 border border-brand-100"
        >
          Orders
        </Link>
        <Link
          href="/admin/services"
          className="rounded-full px-4 py-1.5 text-sm font-medium bg-brand-500 text-white shadow-pop"
        >
          Services
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4 card p-3">{error}</p>
      )}

      {/* Add service */}
      <section className="card p-4 mb-6">
        <h2 className="font-semibold mb-3">Add a service</h2>
        <form onSubmit={addService} className="grid gap-2">
          <input
            className="input"
            placeholder="Service name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select
            className="input"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          >
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              placeholder="Price (ETB)"
              inputMode="numeric"
              value={newMin}
              onChange={(e) => setNewMin(e.target.value.replace(/\D/g, ""))}
            />
            <input
              className="input"
              placeholder="Max (optional)"
              inputMode="numeric"
              value={newMax}
              onChange={(e) => setNewMax(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <button type="submit" className="btn-primary">
            Add service
          </button>
        </form>
      </section>

      {/* Add category */}
      <section className="card p-4 mb-6">
        <h2 className="font-semibold mb-3">Add a category</h2>
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            className="input"
            placeholder="Category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Add
          </button>
        </form>
      </section>

      {/* Existing services */}
      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-6">
          {cats.map((c) => {
            const items = grouped.get(c.id) ?? [];
            return (
              <section key={c.id}>
                <div className="flex items-center justify-between px-1 mb-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {c.name}{" "}
                    <span className="text-sm font-normal text-ink-muted">
                      ({items.length})
                    </span>
                  </h3>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="text-xs text-ink-muted hover:text-red-600"
                  >
                    Delete category
                  </button>
                </div>
                {items.length === 0 ? (
                  <div className="card p-3 text-sm text-ink-muted">
                    No services yet.
                  </div>
                ) : (
                  <ul className="card divide-y divide-brand-100 overflow-hidden">
                    {items.map((s) => (
                      <ServiceRow
                        key={s.id}
                        service={s}
                        categories={cats}
                        onSave={(patch) => updateService(s, patch)}
                        onDelete={() => deleteService(s.id)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function ServiceRow({
  service,
  categories,
  onSave,
  onDelete,
}: {
  service: Service;
  categories: Category[];
  onSave: (patch: Partial<Service>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [min, setMin] = useState(String(service.price_min));
  const [max, setMax] = useState(
    service.price_max != null ? String(service.price_max) : ""
  );
  const [catId, setCatId] = useState(service.category_id);

  function save() {
    onSave({
      name,
      price_min: Number(min),
      price_max: max ? Number(max) : null,
      category_id: catId,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1">
          <div className="font-medium text-ink">{service.name}</div>
          <div className="text-xs text-ink-muted">
            {formatPriceRange(service.price_min, service.price_max)}
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-brand-700 hover:text-brand-500 px-2"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-sm text-ink-muted hover:text-red-600 px-2"
        >
          Delete
        </button>
      </li>
    );
  }

  return (
    <li className="px-4 py-3 grid gap-2 bg-brand-50">
      <input
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="input"
        value={catId}
        onChange={(e) => setCatId(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="input"
          inputMode="numeric"
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
        />
        <input
          className="input"
          placeholder="Max (opt.)"
          inputMode="numeric"
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="btn-primary flex-1">
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="btn-ghost flex-1"
        >
          Cancel
        </button>
      </div>
    </li>
  );
}
