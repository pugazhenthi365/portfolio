export function SetupRequired() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-lg">
        <p className="label">Admin</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">Supabase is not configured</h1>
        <p className="mt-3 text-muted">
          The CMS needs a Supabase project. Add <code className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment, run the
          migrations, then create your admin account. Full steps are in <code className="font-mono text-sm">docs/SUPABASE.md</code>.
        </p>
        <p className="mt-3 text-sm text-muted">Until then, the public site is served from the built-in seed content.</p>
      </div>
    </main>
  );
}
