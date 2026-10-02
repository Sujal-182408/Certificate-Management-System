import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const email = form.email.trim();

    if (!email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      await login(email, form.password);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.message || "Login failed. Please try again."
      );
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">

      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login Card */}
      <section className="relative z-10 w-full max-w-md">

        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">

          {/* Logo / Icon */}
          <div className="mb-7 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
              <ShieldCheck
                size={36}
                strokeWidth={1.7}
              />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center">

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome Back
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to access your CertiVerify
              employee dashboard.
            </p>

          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3.5 text-sm text-red-300"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* Email */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>

              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 transition-all duration-200 focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-400/10">

                <Mail
                  size={19}
                  className="shrink-0 text-slate-500 transition-colors group-focus-within:text-cyan-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={254}
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 transition-all duration-200 focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-400/10">

                <Lock
                  size={19}
                  className="shrink-0 text-slate-500 transition-colors group-focus-within:text-cyan-400"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="shrink-0 text-slate-500 transition hover:text-cyan-300"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 transition-all duration-200 hover:bg-cyan-300 hover:shadow-cyan-400/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />

                  Signing in...
                </>
              ) : (
                <>
                  Sign In

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </>
              )}

            </button>

          </form>

          {/* Register */}
          <div className="mt-7 border-t border-white/10 pt-6 text-center">

            <p className="text-sm text-slate-400">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                Create account
              </Link>

            </p>

          </div>

          {/* Admin Login */}
          <div className="mt-4 text-center">

            <Link
              to="/admin/login"
              className="text-xs text-slate-500 transition hover:text-cyan-300"
            >
              Administrator login
            </Link>

          </div>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} CertiVerify
        </p>

      </section>

    </main>
  );
}