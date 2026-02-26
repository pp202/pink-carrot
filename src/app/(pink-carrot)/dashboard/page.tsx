import { getPinnedChestsWithCarrots } from '@/backend/lists';
import Link from 'next/link';

type PinnedChest = Awaited<ReturnType<typeof getPinnedChestsWithCarrots>>[number];

export default async function DashboardPage() {
  const pinnedChests: PinnedChest[] = await getPinnedChestsWithCarrots();

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-stretch justify-center px-6 py-12">
        <div className="flex min-h-full w-full max-w-2xl flex-col rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Your pinned chests and their carrots.
            </p>
          </header>

          <div className="flex-1 space-y-4">
            {pinnedChests.length === 0 ? (
              <p className="rounded-xl border border-zinc-600/40 bg-zinc-900/60 px-4 py-6 text-center text-sm text-zinc-400">
                No pinned chests yet. Create one with the plus button.
              </p>
            ) : (
              pinnedChests.map((chest: PinnedChest) => (
                <article
                  key={chest.id}
                  className="rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-5 py-4"
                >
                  <h2 className="text-sm font-semibold text-zinc-100">{chest.label}</h2>
                  {chest.carrots.length === 0 ? (
                    <p className="mt-2 text-xs text-zinc-400">No carrots in this chest yet.</p>
                  ) : (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-200">
                      {chest.carrots.map((carrot: PinnedChest['carrots'][number]) => (
                        <li key={carrot.id.toString()}>{carrot.label}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href="/my-lists/new?from=dashboard"
              aria-label="Add a new chest"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-500/60 bg-zinc-900 text-2xl leading-none text-zinc-100 transition hover:border-zinc-400 hover:bg-zinc-800"
            >
              +
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
