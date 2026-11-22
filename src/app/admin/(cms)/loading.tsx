export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <div className="h-8 w-48 max-w-full animate-pulse rounded bg-subtle" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-subtle" />
      <div className="mt-8 h-64 animate-pulse rounded-lg bg-subtle" />
    </div>
  );
}
