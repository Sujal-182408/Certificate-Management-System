import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

export default function ManageCertificates() {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/certificates`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch certificates"
        );
      }

      setCertificates(data?.certificates || []);
    } catch (error) {
      console.error("Certificate fetch error:", error);

      if (error?.message) {
        setError(error.message);
      } else {
        setError("Unable to fetch certificates.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleView = (id) => {
    navigate(`/admin/certificates/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/admin/certificates/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-gray-400">
            Loading certificates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Manage Certificates
            </h1>

            <p className="text-gray-400 mt-2">
              View and manage all issued certificates.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/certificates/new")}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-3 rounded-lg transition"
          >
            + Add Certificate
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-950 border border-red-700 text-red-300 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="font-semibold">
                  Failed to load certificates
                </p>

                <p className="text-sm mt-1">
                  {error}
                </p>
              </div>

              <button
                onClick={fetchCertificates}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white text-sm"
              >
                Retry
              </button>

            </div>
          </div>
        )}

        {/* Empty */}
        {!error && certificates.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <h2 className="text-xl font-semibold">
              No certificates found
            </h2>

            <p className="text-gray-400 mt-2">
              Create your first certificate to see it here.
            </p>

            <button
              onClick={() => navigate("/admin/certificates/new")}
              className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-3 rounded-lg"
            >
              Create Certificate
            </button>
          </div>
        )}

        {/* Desktop Table */}
        {certificates.length > 0 && (
          <div className="hidden md:block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-gray-800">
                  <tr>

                    <th className="px-6 py-4 text-gray-300 font-semibold">
                      Certificate No.
                    </th>

                    <th className="px-6 py-4 text-gray-300 font-semibold">
                      Recipient
                    </th>

                    <th className="px-6 py-4 text-gray-300 font-semibold">
                      Course
                    </th>

                    <th className="px-6 py-4 text-gray-300 font-semibold">
                      Issuer
                    </th>

                    <th className="px-6 py-4 text-gray-300 font-semibold">
                      Issue Date
                    </th>

                    <th className="px-6 py-4 text-gray-300 font-semibold">
                      Status
                    </th>

                    <th className="px-6 py-4 text-gray-300 font-semibold text-right">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {certificates.map((certificate) => (
                    <tr
                      key={certificate.id}
                      className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                    >

                      <td className="px-6 py-5">
                        <span className="font-mono text-cyan-400">
                          {certificate.certificate_no}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold">
                            {certificate.recipient_name || "—"}
                          </p>

                          {certificate.employee_email && (
                            <p className="text-sm text-gray-500">
                              {certificate.employee_email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-gray-300">
                        {certificate.course_name || "—"}
                      </td>

                      <td className="px-6 py-5 text-gray-300">
                        {certificate.issuer_name || "—"}
                      </td>

                      <td className="px-6 py-5 text-gray-300">
                        {formatDate(certificate.issue_date)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            certificate.status === "issued"
                              ? "bg-green-950 text-green-400 border border-green-800"
                              : certificate.status === "revoked"
                              ? "bg-red-950 text-red-400 border border-red-800"
                              : "bg-gray-800 text-gray-300 border border-gray-700"
                          }`}
                        >
                          {certificate.status || "unknown"}
                        </span>
                      </td>

                      <td className="px-6 py-5">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              handleView(certificate.id)
                            }
                            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              handleEdit(certificate.id)
                            }
                            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-sm font-semibold"
                          >
                            Edit
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>
        )}

        {/* Mobile Cards */}
        {certificates.length > 0 && (
          <div className="md:hidden space-y-4">

            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
              >

                <div className="flex justify-between items-start gap-4">

                  <div>
                    <p className="text-cyan-400 font-mono text-sm">
                      {certificate.certificate_no}
                    </p>

                    <h2 className="text-lg font-semibold mt-2">
                      {certificate.recipient_name || "—"}
                    </h2>
                  </div>

                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                      certificate.status === "issued"
                        ? "bg-green-950 text-green-400"
                        : certificate.status === "revoked"
                        ? "bg-red-950 text-red-400"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {certificate.status || "unknown"}
                  </span>

                </div>

                <div className="mt-5 space-y-3 text-sm">

                  <div>
                    <p className="text-gray-500">
                      Course
                    </p>

                    <p className="text-gray-200">
                      {certificate.course_name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Issuer
                    </p>

                    <p className="text-gray-200">
                      {certificate.issuer_name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      Issue Date
                    </p>

                    <p className="text-gray-200">
                      {formatDate(certificate.issue_date)}
                    </p>
                  </div>

                  {certificate.employee_email && (
                    <div>
                      <p className="text-gray-500">
                        Employee
                      </p>

                      <p className="text-gray-200">
                        {certificate.employee_email}
                      </p>
                    </div>
                  )}

                </div>

                <div className="flex gap-2 mt-6">

                  <button
                    onClick={() =>
                      handleView(certificate.id)
                    }
                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                  >
                    View
                  </button>

                  <button
                    onClick={() =>
                      handleEdit(certificate.id)
                    }
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-semibold"
                  >
                    Edit
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}