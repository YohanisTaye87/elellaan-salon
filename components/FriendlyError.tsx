"use client";

type Props = {
  title?: string;
  message?: string;
};

/**
 * Customer-facing fallback. Never reveals stack traces, env names, or
 * anything operational — staff sees the technical detail in server logs.
 */
export default function FriendlyError({
  title = "We&rsquo;ll be right back",
  message = "Our menu is being updated. Please refresh in a moment, or ask a staff member for help.",
}: Props) {
  return (
    <div className="card p-7 text-center animate-fade-up">
      <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-brand-600"
        >
          <path
            d="M12 8v5M12 16.5h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity="0.5"
          />
        </svg>
      </div>
      <h2
        className="text-lg font-semibold text-ink"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary tap-bounce mt-5"
      >
        Try again
      </button>
    </div>
  );
}
