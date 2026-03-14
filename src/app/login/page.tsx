import { Suspense } from "react";
import Link from "next/link";
import { GiCarrot } from "react-icons/gi";
import { SSOList } from "./ssoList";

export default function LoginPage() {
  return (
    <section className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-700 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center px-6">
          <Link href="/login" className="flex items-center gap-2 text-zinc-100">
            <GiCarrot className="text-pink-400" />
            <span className="text-sm font-semibold uppercase tracking-wide">Pink Carrot</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Welcome back</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Sign in to continue to your Pink Carrot dashboard.
            </p>
          </header>

          <main>
            <Suspense fallback={null}>
              <SSOList />
            </Suspense>
          </main>

          <p className="mt-6 text-center text-xs text-zinc-400">
            By signing in you agree to continue securely with your Google account.
          </p>
        </div>
      </div>
    </section>
  );
}
