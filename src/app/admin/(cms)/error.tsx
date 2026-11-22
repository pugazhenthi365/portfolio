"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-6">
      <h1 className="font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted">{error.digest ? `Reference: ${error.digest}` : "Please try again."}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg">
        Try again
      </button>
    </div>
  );
}
