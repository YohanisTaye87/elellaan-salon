"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HeaderLogo from "@/components/HeaderLogo";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Login failed.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 pt-16">
      <div className="flex flex-col items-center mb-8 animate-fade-up">
        <HeaderLogo />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Staff Login</h1>
      </div>
      <form onSubmit={submit} className="card p-5 space-y-3 animate-scale-in">
        <input
          autoFocus
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="btn-primary w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
