import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { SetupRequired } from "@/components/admin/setup-required";
import { getAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!isSupabaseConfigured) return <SetupRequired />;
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-subtle px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-bg p-6 shadow-sm sm:p-8">
        <p className="label">Private</p>
        <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Sign in to the CMS</h1>
        <p className="mt-1 text-sm text-muted">Administrator access only.</p>
        <LoginForm />
      </div>
    </main>
  );
}
