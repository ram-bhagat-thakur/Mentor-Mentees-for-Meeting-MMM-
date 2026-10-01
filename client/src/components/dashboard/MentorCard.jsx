function getInitials(name = "Mentor") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function MentorCard({ mentor, currentCollege }) {
  const profile = mentor.mentorProfile || {};
  const sameCollege =
    Boolean(currentCollege && mentor.college) &&
    currentCollege.trim().toLocaleLowerCase() === mentor.college.trim().toLocaleLowerCase();
  const isVerifiedAlumni = sameCollege || mentor.isVerifiedAlumni === true;
  const skills = mentor.skills || [];

  return (
    <article className="flex min-h-64 flex-col rounded-card border border-slate-200 bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
          {getInitials(mentor.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">{mentor.name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-600">
            {profile.jobTitle || "Mentor"}
            {profile.company ? ` at ${profile.company}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 min-h-6">
        {isVerifiedAlumni && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
            Verified Alumni
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
        {mentor.bio?.[0] || mentor.college || "Sharing practical experience with the next generation."}
      </p>

      <div className="mt-4 flex min-h-7 flex-wrap gap-2">
        {skills.slice(0, 4).map((skill) => (
          <span
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
            key={skill}
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="min-w-0 truncate text-xs text-slate-500">{mentor.college}</span>
        {profile.rating?.count > 0 && (
          <span className="shrink-0 text-xs font-medium text-slate-700">
            {profile.rating.average.toFixed(1)} ({profile.rating.count})
          </span>
        )}
      </div>
    </article>
  );
}