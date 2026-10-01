import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import SignupForm from "./components/auth/SignupForm.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function WorkspacePage({ mode = "dashboard" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRoomsPage = mode === "rooms";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200 bg-surface">
        <div className="container flex min-h-16 items-center justify-between gap-4">
          <Link className="flex min-h-11 items-center gap-3" to="/dashboard">
            <span className="grid h-9 w-9 place-items-center rounded-button bg-primary-600 text-xs font-bold text-white">
              MMM
            </span>
            <span className="hidden text-sm font-semibold text-slate-900 sm:inline">
              Mentors Meet Mentees
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <Link
              aria-current={!isRoomsPage ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-button px-3 text-sm font-medium ${
                !isRoomsPage ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100"
              }`}
              to="/dashboard"
            >
              Overview
            </Link>
            <Link
              aria-current={isRoomsPage ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-button px-3 text-sm font-medium ${
                isRoomsPage ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100"
              }`}
              to="/rooms"
            >
              Rooms
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-40 truncate text-sm text-slate-600 md:inline">
              {user?.email}
            </span>
            <button
              className="min-h-11 rounded-button border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={handleLogout}
              type="button"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="container py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">
          {isRoomsPage ? "Live sessions" : "Your workspace"}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl text-slate-900">
              {isRoomsPage ? "Rooms" : `Welcome, ${user?.name}`}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isRoomsPage
                ? "Your live and upcoming sessions will appear here."
                : `${user?.college} · ${user?.role === "mentor" ? "Mentor" : "Mentee"}`}
            </p>
          </div>
          {!isRoomsPage && (
            <Link
              className="inline-flex min-h-11 items-center rounded-button bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              to="/rooms"
            >
              Browse rooms
            </Link>
          )}
        </div>

        <section
          aria-label={isRoomsPage ? "Room list" : "Profile summary"}
          className="mt-8 rounded-card border border-slate-200 bg-surface p-6 shadow-sm sm:p-8"
        >
          {isRoomsPage ? (
            <div className="py-8 text-center">
              <h2 className="text-lg text-slate-900">No sessions yet</h2>
              <p className="mt-2 text-sm text-slate-600">
                New sessions will be listed here when they are available.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Account email</p>
                <p className="mt-1 break-all text-base font-medium text-slate-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Account type</p>
                <p className="mt-1 text-base font-medium capitalize text-slate-900">{user?.role}</p>
              </div>
            </div>
          )}
        </section>
        <span className="sr-only" aria-live="polite">
          Current route: {location.pathname}
        </span>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/dashboard" />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<WorkspacePage />} />
        <Route path="/rooms/*" element={<WorkspacePage mode="rooms" />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}