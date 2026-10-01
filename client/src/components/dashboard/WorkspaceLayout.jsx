import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function WorkspaceLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isRoomsPage = location.pathname.startsWith("/rooms");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200 bg-surface">
        <div className="container flex min-h-16 items-center justify-between gap-3">
          <Link className="flex min-h-11 min-w-0 items-center gap-3" to="/dashboard">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-button bg-primary-600 text-xs font-bold text-white">
              MMM
            </span>
            <span className="hidden truncate text-sm font-semibold text-slate-900 sm:inline">
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
              Dashboard
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
      {children}
    </div>
  );
}