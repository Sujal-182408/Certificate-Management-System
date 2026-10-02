import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Mail,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Admin login failed."
        );
      }

      /*
       * Login succeeded.
       * The backend has created the HttpOnly admin cookie.
       *
       * Check the admin session before entering dashboard.
       */
      const meResponse = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const meData = await meResponse.json().catch(() => ({}));

      if (!meResponse.ok || meData?.admin?.role !== "admin") {
        throw new Error(
          "Admin session could not be verified."
        );
      }

      console.log("ADMIN LOGIN SUCCESS");
      console.log("ADMIN:", meData.admin);

      /*
       * IMPORTANT:
       * Admin goes to /admin.
       * Employee login is /login.
       */
      const from =
        location.state?.from?.pathname === "/admin"
          ? "/admin"
          : "/admin";

      navigate(from, {
        replace: true,
      });
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);

      setError(
        err.message || "Unable to sign in as administrator."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-violet-400/20 bg-slate-900 p-8 shadow-2xl">

        <div className="mb-5 flex justify-center">
          <div className="rounded-2xl bg-violet-500/10 p-4 text-violet-300">
            <ShieldCheck size={36} />
          </div>
        </div>

        <h1 className="text-center text-3xl font-bold text-white">
          Admin Portal
        </h1>

        <p className="mt-3 text-center text-sm text-slate-400">
          Sign in to manage CertiVerify.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >

          {/* EMAIL */}

          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm text-slate-200"
            >
              Admin email
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-700 px-3">
              <Mail
                size={18}
                className="text-slate-400"
              />

              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter admin email"
                className="w-full bg-transparent py-3 text-white outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm text-slate-200"
            >
              Password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-700 px-3">
              <LockKeyhole
                size={18}
                className="text-slate-400"
              />

              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                className="w-full bg-transparent py-3 text-white outline-none"
              />
            </div>
          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

        {/* EMPLOYEE LOGIN */}

        <Link
          to="/login"
          className="mt-6 block text-center text-sm text-slate-400 hover:text-white"
        >
          Employee login instead
        </Link>

        {/* HOME */}

        <Link
          to="/"
          className="mt-3 block text-center text-sm text-slate-500 hover:text-white"
        >
          Back to Home
        </Link>

      </section>
    </main>
  );
}