import Link from "next/link";

const actionItems = [
  {
    name: "Create new list",
    description: "Start a fresh grocery list in seconds.",
    href: "/my-lists/new?from=dashboard",
  },
  {
    name: "Go to my lists",
    description: "Open your saved lists and keep shopping organized.",
    href: "/my-lists",
  },
];

export default function DashboardPage() {
  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Pick where you want to go next.
            </p>
          </header>

          <div className="flex flex-col gap-3">
            {actionItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-4 py-3 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                <p className="text-sm font-medium text-zinc-100">{item.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
