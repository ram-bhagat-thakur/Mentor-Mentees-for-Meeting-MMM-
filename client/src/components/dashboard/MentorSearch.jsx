import { useEffect, useState } from "react";
import EmptyState from "../common/EmptyState.jsx";
import SkeletonCard from "../common/SkeletonCard.jsx";
import MentorCard from "./MentorCard.jsx";
import mentorService from "../../services/mentorService.js";

const emptyFilters = {
  search: "",
  skills: "",
  company: "",
  college: "",
  sameCollege: false,
};

const inputClasses =
  "min-h-11 w-full rounded-button border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

function filtersAreEqual(left, right) {
  return Object.keys(emptyFilters).every((key) => left[key] === right[key]);
}

export default function MentorSearch({ currentCollege }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [settledFilters, setSettledFilters] = useState(emptyFilters);
  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const isDebouncing = !filtersAreEqual(filters, settledFilters);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledFilters(filters), 350);
    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    const query = {
      search: settledFilters.search.trim(),
      skills: settledFilters.skills.trim(),
      company: settledFilters.company.trim(),
      college: settledFilters.sameCollege ? "" : settledFilters.college.trim(),
      almaMater: settledFilters.sameCollege ? "true" : "",
      page: 1,
      limit: 12,
    };

    setIsLoading(true);
    setError("");
    mentorService
      .search(query, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setMentors(result.mentors);
        setPagination(result.pagination);
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError.name === "AbortError") return;
        setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [settledFilters, retryCount]);

  function updateFilter(event) {
    const { name, value, checked, type } = event.target;
    setFilters((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "sameCollege" && checked ? { college: "" } : {}),
    }));
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setSettledFilters(emptyFilters);
    setError("");
  }

  return (
    <section aria-labelledby="mentor-directory-title" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">
            People to learn from
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900" id="mentor-directory-title">
            Mentor directory
          </h2>
          <p className="mt-1 text-sm text-slate-600">Find guidance that fits your next step.</p>
        </div>
        {!isLoading && pagination && (
          <p aria-live="polite" className="text-sm text-slate-500">
            {pagination.total} {pagination.total === 1 ? "mentor" : "mentors"}
          </p>
        )}
      </div>

      <form
        className="mt-5 rounded-card border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="mentor-search">
              Keyword
            </label>
            <input
              className={inputClasses}
              id="mentor-search"
              name="search"
              onChange={updateFilter}
              placeholder="Skill, role, or topic"
              type="search"
              value={filters.search}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="mentor-skills">
              Skills
            </label>
            <input
              className={inputClasses}
              id="mentor-skills"
              name="skills"
              onChange={updateFilter}
              placeholder="React, product design"
              value={filters.skills}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="mentor-company">
              Company
            </label>
            <input
              className={inputClasses}
              id="mentor-company"
              name="company"
              onChange={updateFilter}
              placeholder="Company or organization"
              value={filters.company}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="mentor-college">
              College or alma mater
            </label>
            <input
              className={inputClasses}
              disabled={filters.sameCollege}
              id="mentor-college"
              name="college"
              onChange={updateFilter}
              placeholder="Search a college"
              value={filters.college}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
            <input
              checked={filters.sameCollege}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              name="sameCollege"
              onChange={updateFilter}
              type="checkbox"
            />
            Alumni from my college{currentCollege ? ` (${currentCollege})` : ""}
          </label>
          <button
            className="min-h-11 rounded-button px-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-5" role="alert">
          <EmptyState
            actionLabel="Try again"
            description={error}
            onAction={() => setRetryCount((count) => count + 1)}
            title="Mentors could not be loaded"
          />
        </div>
      ) : isLoading || isDebouncing ? (
        <div aria-label="Loading mentors" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            actionLabel="Clear filters"
            description="Try another skill, company, or college to broaden your search."
            onAction={clearFilters}
            title="No mentors match these filters"
          />
        </div>
      ) : (
        <div aria-live="polite" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mentors.map((mentor) => (
            <MentorCard currentCollege={currentCollege} key={mentor._id} mentor={mentor} />
          ))}
        </div>
      )}
    </section>
  );
}