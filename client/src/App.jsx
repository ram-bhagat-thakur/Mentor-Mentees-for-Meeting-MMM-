export default function App() {
  return (
    <main className="container py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">
          Mentors Meet Mentees
        </p>
        <h1 className="mt-3 text-4xl text-slate-900">A clearer path, together.</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          A shared design foundation for students finding direction and mentors
          opening doors.
        </p>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" aria-label="Design token showcase">
        <article className="rounded-card border border-slate-200 bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Live micro-webinar</p>
              <h2 className="mt-1 text-xl text-slate-900">Building your first portfolio</h2>
            </div>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-status-live-100 px-3 py-1 text-sm font-medium text-status-live-700">
              <span className="h-2 w-2 rounded-full bg-status-live-500" aria-hidden="true" />
              Live now
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            A practical session with alumni on turning project work into a
            portfolio that hiring teams can scan.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="min-h-11 rounded-button bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              type="button"
            >
              Request to join
            </button>
            <span className="rounded-full bg-status-queue-50 px-3 py-1.5 text-sm font-medium text-status-queue-700">
              2 waiting
            </span>
          </div>
        </article>

        <aside className="rounded-card border border-slate-200 bg-surface p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Type & palette</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">Inter, sans-serif</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Clear hierarchy, measured contrast, and familiar neutral surfaces.
          </p>
          <div className="mt-6 flex gap-2" aria-label="Brand color palette">
            <span className="h-8 flex-1 rounded-md bg-primary-50" title="Primary 50" />
            <span className="h-8 flex-1 rounded-md bg-primary-100" title="Primary 100" />
            <span className="h-8 flex-1 rounded-md bg-primary-500" title="Primary 500" />
            <span className="h-8 flex-1 rounded-md bg-primary-600" title="Primary 600" />
            <span className="h-8 flex-1 rounded-md bg-primary-700" title="Primary 700" />
          </div>
          <p className="mt-2 font-mono text-xs text-slate-500">primary-50 to primary-700</p>
        </aside>
      </section>
    </main>
  );
}