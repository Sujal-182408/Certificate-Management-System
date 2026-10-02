
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 10) {
      setError("Password must contain at least 10 characters.");
      return;
    }

    if (new TextEncoder().encode(form.password).length > 72) {
      setError("Password must not exceed 72 UTF-8 bytes.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register(name, email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  }

  const fields = [
    {
      name: "name",
      label: "Full name",
      type: "text",
      placeholder: "Enter your full name",
      icon: UserRound,
      autoComplete: "name",
    },
    {
      name: "email",
      label: "Email address",
      type: "email",
      placeholder: "you@example.com",
      icon: Mail,
      autoComplete: "email",
    },
  ];

  return (
    <main className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Background effects */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-cyan-300">
            <ShieldCheck size={36} strokeWidth={1.7} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create your account
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Join CertiVerify to access your employee certificate
            dashboard.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Name and email */}
          {fields.map((field) => {
            const Icon = field.icon;

            return (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  {field.label}
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/10">
                  <Icon
                    size={19}
                    className="shrink-0 text-slate-500"
                  />

                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    maxLength={field.name === "name" ? 100 : 254}
                    required
                    disabled={loading}
                    className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-60"
                  />
                </div>
              </div>
            );
          })}

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/10">
              <Lock size={19} className="shrink-0 text-slate-500" />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 10 characters"
                autoComplete="new-password"
                minLength={10}
                required
                disabled={loading}
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="shrink-0 text-slate-500 transition hover:text-cyan-300"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Use at least 10 characters.
            </p>
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Confirm password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/10">
              <Lock size={19} className="shrink-0 text-slate-500" />

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={10}
                required
                disabled={loading}
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((prev) => !prev)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="shrink-0 text-slate-500 transition hover:text-cyan-300"
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 font-semibold text-slate-950 transition duration-200 hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            Creating an account does not automatically grant admin
            or certificate-verifier privileges. Those permissions
            must be authorized separately.
          </p>
        </form>

        {/* Login link */}
        <div className="mt-7 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
