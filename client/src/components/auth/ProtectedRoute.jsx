import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background" aria-label="Loading session">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" role="status" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  return <Outlet />;
}