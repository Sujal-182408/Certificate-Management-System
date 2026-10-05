import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_URL = "/api";

export default function AdminProtectedRoute({
  children,
}) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const response = await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data =
          await response.json().catch(() => ({}));

        console.log(
          "🔐 AdminProtectedRoute /me:",
          response.status,
          data
        );

        if (!mounted) {
          return;
        }

        if (
          response.ok &&
          data?.admin?.role === "admin" &&
          data?.admin?.is_active === true
        ) {
          console.log(
            "✅ Admin session verified:",
            data.admin.email
          );

          setAuthenticated(true);
        } else {
          console.log(
            "❌ Admin session invalid."
          );

          setAuthenticated(false);
        }
      } catch (error) {
        console.error(
          "❌ AdminProtectedRoute error:",
          error
        );

        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f14",
          color: "#fff",
          fontSize: "20px",
        }}
      >
        Loading admin session...
      </div>
    );
  }

  // =====================================================
  // NOT AUTHENTICATED
  // =====================================================

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // =====================================================
  // AUTHENTICATED
  // =====================================================

  return children;
}