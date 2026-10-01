export default function SkeletonCard({ variant = "mentor" }) {
  const isRoom = variant === "room";

  return (
    <article
      aria-hidden="true"
      className={`min-h-56 animate-pulse rounded-card border border-slate-200 bg-surface p-5 shadow-sm ${
        isRoom ? "min-h-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 shrink-0 rounded-full bg-slate-200 ${isRoom ? "h-10 w-10" : ""}`} />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
        <div className="h-6 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-slate-100" />
        <div className="h-6 w-20 rounded-full bg-slate-100" />
        <div className="h-6 w-14 rounded-full bg-slate-100" />
      </div>
      <div className="mt-6 h-10 w-full rounded-button bg-slate-200" />
    </article>
  );
}