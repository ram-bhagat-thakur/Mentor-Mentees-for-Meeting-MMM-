import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const approvedCampusDomains = (import.meta.env.VITE_APPROVED_CAMPUS_EMAIL_DOMAINS || "")
  .split(",")
  .map((domain) => domain.trim().toLowerCase().replace(/^\.+/, ""))
  .filter(Boolean);

function isInstitutionalEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@").at(-1);
  if (!domain || domain === normalizedEmail) return false;

  return (
    domain.endsWith(".edu") ||
    domain.endsWith(".ac.in") ||
    approvedCampusDomains.some((approved) => domain === approved || domain.endsWith(`.${approved}`))
  );
}

const inputClasses =
  "min-h-11 w-full rounded-button border border-slate-300 bg-white px-3.5 text-base text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

export default function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "mentee",
    college: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailDomainError =
    form.email.includes("@") && !isInstitutionalEmail(form.email)
      ? "Use your .edu, .ac.in, or approved campus email address."
      : "";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFormError("");
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    } else if (!isInstitutionalEmail(form.email)) {
      nextErrors.email = "Use your .edu, .ac.in, or approved campus email address.";
    }
    if (form.password.length < 10) nextErrors.password = "Use at least 10 characters.";
    if (new TextEncoder().encode(form.password).length > 72) {
      nextErrors.password = "Password must be no more than 72 bytes.";
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!form.college.trim()) nextErrors.college = "Enter your college or university.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        college: form.college.trim(),
      });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose your role and use an institutional email to get started."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-primary-700 hover:text-primary-600" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        {formError && (
          <p className="rounded-button border border-status-error-100 bg-status-error-50 px-4 py-3 text-sm text-status-error-700" role="alert">
            {formError}
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="signup-name">
            Full name
          </label>
          <input
            autoComplete="name"
            className={inputClasses}
            id="signup-name"
            name="name"
            onChange={updateField}
            value={form.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
          />
          {errors.name && <p className="mt-1.5 text-sm text-status-error-700" id="signup-name-error">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="signup-email">
            Institutional email
          </label>
          <input
            autoComplete="email"
            className={inputClasses}
            id="signup-email"
            name="email"
            onChange={updateField}
            type="email"
            value={form.email}
            aria-invalid={Boolean(errors.email || emailDomainError)}
            aria-describedby={errors.email || emailDomainError ? "signup-email-error" : undefined}
          />
          {(errors.email || emailDomainError) && (
            <p className="mt-1.5 text-sm text-status-error-700" id="signup-email-error">
              {errors.email || emailDomainError}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-800">I am joining as</legend>
          <div className="grid grid-cols-2 gap-2">
            {["mentee", "mentor"].map((role) => (
              <label
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-button border px-3 text-sm font-medium capitalize transition-colors ${
                  form.role === role
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                key={role}
              >
                <input
                  checked={form.role === role}
                  className="sr-only"
                  name="role"
                  onChange={updateField}
                  type="radio"
                  value={role}
                />
                {role}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="signup-college">
            College or university
          </label>
          <input
            autoComplete="organization"
            className={inputClasses}
            id="signup-college"
            name="college"
            onChange={updateField}
            value={form.college}
            aria-invalid={Boolean(errors.college)}
            aria-describedby={errors.college ? "signup-college-error" : undefined}
          />
          {errors.college && <p className="mt-1.5 text-sm text-status-error-700" id="signup-college-error">{errors.college}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="signup-password">
            Password
          </label>
          <input
            autoComplete="new-password"
            className={inputClasses}
            id="signup-password"
            name="password"
            onChange={updateField}
            type="password"
            value={form.password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
          />
          {errors.password && <p className="mt-1.5 text-sm text-status-error-700" id="signup-password-error">{errors.password}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="signup-confirm-password">
            Confirm password
          </label>
          <input
            autoComplete="new-password"
            className={inputClasses}
            id="signup-confirm-password"
            name="confirmPassword"
            onChange={updateField}
            type="password"
            value={form.confirmPassword}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-status-error-700" id="signup-confirm-password-error">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-button bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {isSubmitting ? "Creating account" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}