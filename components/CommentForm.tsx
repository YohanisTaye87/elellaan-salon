"use client";

import { useState } from "react";

type Props = {
  orderId: string;
  initial: string | null;
};

export default function CommentForm({ orderId, initial }: Props) {
  const [comment, setComment] = useState(initial ?? "");
  const [saved, setSaved] = useState(Boolean(initial));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = comment.trim();
    if (trimmed.length < 2) {
      setError("Please write at least 2 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: trimmed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't save your comment.");
      setSaved(true);
      setComment(body.comment ?? trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="card mt-6 w-full p-5 animate-scale-in">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5L10 17.5L19 8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h3 className="font-semibold text-ink">Thanks for the feedback</h3>
        </div>
        <p className="text-sm text-ink-soft whitespace-pre-line">
          “{comment}”
        </p>
        <button
          onClick={() => setSaved(false)}
          className="mt-3 text-xs text-brand-600 hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="card mt-6 w-full p-5 animate-fade-up"
    >
      <h3 className="font-semibold text-ink mb-1">How was your visit?</h3>
      <p className="text-xs text-ink-muted mb-3">
        Leave a quick comment for the salon (optional, but appreciated).
      </p>
      <textarea
        className="input min-h-[88px] resize-y"
        placeholder="Tell us what you loved, or what we can do better…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-ink-muted tabular-nums">
          {comment.trim().length}/500
        </span>
        <button
          type="submit"
          disabled={submitting || comment.trim().length < 2}
          className="btn-primary tap-bounce min-w-[110px]"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Sending
            </span>
          ) : (
            "Send"
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 animate-fade-up">{error}</p>
      )}
    </form>
  );
}
