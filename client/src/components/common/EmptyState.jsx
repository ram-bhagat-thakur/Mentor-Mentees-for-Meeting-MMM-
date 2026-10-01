export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-card border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-50"
      >
        <span className="h-3 w-3 rounded-full bg-primary-500" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {actionLabel && onAction && (
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-button border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}