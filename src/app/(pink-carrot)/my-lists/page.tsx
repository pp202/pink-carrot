import CarrotList from '@/app/components/CarrotList';
import Link from 'next/link';

const MyCarrotsPage = async () => {
  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">My lists</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Review your saved lists or create a new one.
            </p>
          </header>

          <CarrotList />

          <div className="mt-6 text-center">
            <Link
              href="/my-lists/new"
              className="inline-block rounded-xl border border-zinc-600/40 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Create new list
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyCarrotsPage;
