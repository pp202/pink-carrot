import { Suspense } from "react";
import { SSOList } from "./ssoList";

export default function LoginPage() {
  return (
    <section className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-6 py-12 min-h-screen flex justify-center items-center">
        <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 shadow-2xl shadow-black/40 px-8 py-10 md:px-10 md:py-12">
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
