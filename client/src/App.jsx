import { Navigate, Route, Routes, useParams } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import SignupForm from "./components/auth/SignupForm.jsx";
import EmptyState from "./components/common/EmptyState.jsx";
import WorkspaceLayout from "./components/dashboard/WorkspaceLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function RoomsPage() {
  const { "*": roomId } = useParams();
  return (
    <WorkspaceLayout>
      <main className="container py-10 sm:py-14">
        {roomId ? (
          <EmptyState
            description="This session is listed as live. Room entry and video controls will be connected in the video-call task."
            title="Live room"
          />
        ) : (
          <EmptyState
            description="Live sessions will appear here when mentors open a room."
            title="Your rooms"
          />
        )}
      </main>
    </WorkspaceLayout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/dashboard" />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms/*" element={<RoomsPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}