import { Link } from "react-router-dom";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex min-h-16 items-center">
        <Link className="flex min-h-11 items-center gap-3" to="/login">
          <span className="grid h-9 w-9 place-items-center rounded-button bg-primary-600 text-xs font-bold text-white">
            MMM
          </span>
          <span className="text-sm font-semibold text-slate-900">Mentors Meet Mentees</span>
        </Link>
      </header>

      <main className="container grid min-h-[calc(100vh-4rem)] place-items-center py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">
              Account access
            </p>
            <h1 className="mt-2 text-3xl text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          <section className="rounded-card border border-slate-200 bg-surface p-6 shadow-sm sm:p-8">
            {children}
          </section>
          <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
        </div>
      </main>
    </div>
  );
}