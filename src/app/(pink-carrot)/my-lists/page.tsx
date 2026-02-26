import CarrotList from '@/app/components/CarrotList';
import Link from 'next/link';

const MyCarrotsPage = async () => {
  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-stretch justify-center px-6 py-12">
        <div className="flex min-h-full w-full max-w-md flex-col rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">My lists</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Review your saved lists or create a new one.
            </p>
          </header>

          <div className="flex-1">
            <CarrotList />
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/my-lists/new?from=my-lists"
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
};

export default MyCarrotsPage;
