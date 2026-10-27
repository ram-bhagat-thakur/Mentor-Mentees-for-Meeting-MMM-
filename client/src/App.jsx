import { Navigate, Route, Routes } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import SignupForm from "./components/auth/SignupForm.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RoomPage from "./pages/RoomPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/dashboard" />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms/:roomId" element={<RoomPage />} />
        <Route path="/rooms" element={<Navigate replace to="/dashboard" />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}