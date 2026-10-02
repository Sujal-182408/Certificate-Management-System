import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  FileBadge,
  Users,
  PlusCircle,
  LogOut,
} from "lucide-react";

import { apiRequest } from "../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // =========================================================
  // LOAD ADMIN SESSION
  // =========================================================

  useEffect(() => {
    let active = true;

    async function loadAdmin() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/auth/me");

        // Make sure backend actually returned an admin
        if (!data?.admin) {
          throw new Error("Admin authentication required.");
        }

        if (data.admin.role !== "admin") {
          throw new Error("Invalid administrator session.");
        }

        if (!active) return;

        // Successful authentication
        setAdmin(data.admin);

        // Clear any previous/stale error
        setError("");
      } catch (err) {
        console.error("ADMIN PROFILE ERROR:", err);

        if (!active) return;

        setAdmin(null);
        setError(
          err?.message || "Could not load admin profile."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAdmin();

    return () => {
      active = false;
    };
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    try {
      setLoggingOut(true);
      setError("");

      await apiRequest("/auth/logout", {
        method: "POST",
      });

      setAdmin(null);

      navigate("/admin/login", {
        replace: true,
      });
    } catch (err) {
      console.error("ADMIN LOGOUT ERROR:", err);

      setError(
        err?.message || "Logout failed. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  // =========================================================
  // ADMIN CARDS
  // =========================================================

  const cards = [
    {
      title: "Certificates",
      description: "View and manage certificate records.",
      icon: FileBadge,
      link: "/admin/certificates",
    },
    {
      title: "Issue Certificate",
      description: "Create a new certificate record.",
      icon: PlusCircle,
      link: "/admin/certificates/new",
    },
    {
      title: "Employees",
      description: "Employee management workspace.",
      icon: Users,
      link: "/admin/employees",
    },
  ];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
            <ShieldCheck
              size={38}
              className="text-violet-300"
            />
          </div>

          <p className="mt-5 text-lg font-semibold">
            Loading Admin Dashboard...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Verifying administrator session
          </p>

        </div>
      </main>
    );
  }

  // =========================================================
  // AUTHENTICATION FAILED
  // =========================================================

  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">

        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <ShieldCheck size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Admin Authentication Required
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your administrator session is missing or has expired.
            Please log in again.
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate("/admin/login", {
              replace: true,
            })}
            className="
              mt-6
              w-full
              rounded-xl
              bg-violet-500
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-violet-400
            "
          >
            Go to Admin Login
          </button>

        </div>

      </main>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">

          <div className="flex items-center gap-3">

            <div className="rounded-xl border border-violet-400/10 bg-violet-500/10 p-3 text-violet-300">
              <ShieldCheck size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                CertiVerify Admin
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Certificate administration
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-700
              px-4
              py-2.5
              text-sm
              font-medium
              transition
              hover:border-red-400
              hover:bg-red-500/10
              hover:text-red-300
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <LogOut size={17} />

            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </button>

        </header>

        {/* ================= WELCOME ================= */}

        <section className="py-10">

          <p className="text-sm font-semibold tracking-wide text-violet-300">
            ADMINISTRATOR WORKSPACE
          </p>

          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {admin.email}
          </p>

          <p className="mt-3 max-w-2xl text-slate-400">
            Manage certificates, employees, and
            certificate verification from your
            administration workspace.
          </p>

        </section>

        {/* ================= CARDS ================= */}

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {cards.map(
            ({
              title,
              description,
              icon: Icon,
              link,
            }) => (
              <Link
                key={title}
                to={link}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-900
                  p-6
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:border-violet-400/50
                  hover:bg-slate-900/80
                  hover:shadow-xl
                  hover:shadow-violet-950/20
                "
              >

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-500/10
                    text-violet-300
                    transition
                    group-hover:bg-violet-500/20
                  "
                >
                  <Icon size={27} />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {description}
                </p>

                <span
                  className="
                    mt-5
                    inline-block
                    text-sm
                    font-medium
                    text-violet-300
                    transition
                    group-hover:text-violet-200
                  "
                >
                  Open workspace →
                </span>

              </Link>
            )
          )}

        </section>

        {/* ================= ADMIN INFO ================= */}

        <section
          className="
            mt-8
            rounded-2xl
            border
            border-slate-800
            bg-slate-900/50
            p-5
          "
        >

          <div className="flex items-start gap-3">

            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-violet-300"
            />

            <div>

              <h3 className="text-sm font-semibold text-slate-200">
                Administrator Access
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Signed in as{" "}
                <span className="text-slate-300">
                  {admin.email}
                </span>
                . Certificate and employee management
                actions are available from the workspaces
                above.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}