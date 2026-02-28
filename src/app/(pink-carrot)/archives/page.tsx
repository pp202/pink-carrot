import CarrotList from '@/app/components/CarrotList';

const ArchivesPage = async () => {
  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-stretch justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Archives</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Browse archived chests and delete them permanently.
            </p>
          </header>

          <CarrotList mode="archived" />
        </div>
      </div>
    </section>
  );
};

export default ArchivesPage;
