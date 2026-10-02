import { useEffect, useState } from "react";
import "./AdminEmployees.css";
import {
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { apiRequest } from "../../services/api";
import BackButton from "../../components/BackButton";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/admin/employees");

      setEmployees(data?.employees || []);
    } catch (error) {
      console.error("Load employees error:", error);

      setError(
        error?.message || "Unable to load employees."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-employees-page">
      <div className="admin-employees-container">

        {/* Back Button */}
        <BackButton
          text="Back to Dashboard"
          to="/admin"
        />

        {/* Header */}
        <div className="employees-header">
          <div className="employees-title">
            <Users size={32} />

            <div>
              <h1>Manage Employees</h1>

              <p>
                View and manage registered employees.
              </p>
            </div>
          </div>

          <button
            className="refresh-btn"
            onClick={loadEmployees}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "rotate-icon" : ""}
            />

            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="employees-message">
            <Loader2
              size={25}
              className="rotate-icon"
            />

            <span>Loading employees...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="employees-error">
            <AlertCircle size={22} />

            <div>
              <strong>Unable to load employees</strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Employee Table */}
        {!loading && !error && (
          <div className="employees-table-wrapper">

            {employees.length === 0 ? (
              <div className="employees-empty">
                <Users size={40} />

                <h3>No Employees Found</h3>

                <p>
                  There are currently no registered employees.
                </p>
              </div>
            ) : (
              <table className="employees-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>

                      <td>
                        #{employee.id}
                      </td>

                      <td>
                        <div className="employee-name">
                          <div className="employee-avatar">
                            {employee.name
                              ?.charAt(0)
                              ?.toUpperCase() || "E"}
                          </div>

                          <span>
                            {employee.name}
                          </span>
                        </div>
                      </td>

                      <td>
                        {employee.email}
                      </td>

                      <td>
                        <span
                          className={
                            employee.is_active
                              ? "status active"
                              : "status inactive"
                          }
                        >
                          <span className="status-dot"></span>

                          {employee.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {employee.created_at
                          ? new Date(
                              employee.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            )}

          </div>
        )}

      </div>
    </div>
  );
}