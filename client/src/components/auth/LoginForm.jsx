import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your mentoring workspace."
      footer={
        <>
          New to MMM?{" "}
          <Link className="font-semibold text-primary-700 hover:text-primary-600" to="/signup">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-button border border-status-error-100 bg-status-error-50 px-4 py-3 text-sm text-status-error-700" role="alert">
            {error}
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="login-email">
            Email address
          </label>
          <input
            autoComplete="email"
            className="min-h-11 w-full rounded-button border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            id="login-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="login-password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className="min-h-11 w-full rounded-button border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            id="login-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        <button
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-button bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {isSubmitting ? "Signing in" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}