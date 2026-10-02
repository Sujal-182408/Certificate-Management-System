import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Award,
  CalendarDays,
  FileText,
  Building2,
  UserRound,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import BackButton from "../../components/BackButton";

const API_URL = "http://localhost:5000/api";

export default function AddCertificate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    certificateNo: "",
    recipientName: "",
    courseName: "",
    issuerName: "eSparks IT Solutions",
    issueDate: "",
    employeeId: "1",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/admin/certificates`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificateNo: form.certificateNo.trim(),
          recipientName: form.recipientName.trim(),
          courseName: form.courseName.trim(),
          issuerName: form.issuerName.trim(),
          issueDate: form.issueDate,
          employeeId: Number(form.employeeId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to create certificate."
        );
      }

      setSuccess("Certificate created successfully!");

      setForm({
        certificateNo: "",
        recipientName: "",
        courseName: "",
        issuerName: "eSparks IT Solutions",
        issueDate: "",
        employeeId: "1",
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-midnight px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">

        {/* Back Button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
            <Award size={30} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create Certificate
          </h1>

          <p className="mt-2 text-slate-400">
            Create and issue a new certificate for an employee.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-300">
            <CheckCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-medium">
                {success}
              </p>

              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="mt-2 text-sm underline transition hover:text-white"
              >
                Return to dashboard
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="
            rounded-3xl
            border
            border-white/10
            bg-slate-900/80
            p-6
            shadow-2xl
            backdrop-blur-xl
            sm:p-8
          "
        >
          <div className="grid gap-6 md:grid-cols-2">

            {/* Certificate Number */}
            <div>
              <label
                htmlFor="certificateNo"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Certificate Number
              </label>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950/80
                  px-4
                  transition
                  focus-within:border-cyan-400
                  focus-within:ring-1
                  focus-within:ring-cyan-400/30
                "
              >
                <FileText
                  size={19}
                  className="text-slate-500"
                />

                <input
                  id="certificateNo"
                  name="certificateNo"
                  type="text"
                  value={form.certificateNo}
                  onChange={handleChange}
                  placeholder="CERT-2026-001"
                  required
                  disabled={loading}
                  className="
                    w-full
                    bg-transparent
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-600
                  "
                />
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Employee ID
              </label>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950/80
                  px-4
                  transition
                  focus-within:border-cyan-400
                  focus-within:ring-1
                  focus-within:ring-cyan-400/30
                "
              >
                <UserRound
                  size={19}
                  className="text-slate-500"
                />

                <input
                  id="employeeId"
                  name="employeeId"
                  type="number"
                  min="1"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="
                    w-full
                    bg-transparent
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                  "
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                JOY currently has Employee ID 1.
              </p>
            </div>

            {/* Recipient Name */}
            <div>
              <label
                htmlFor="recipientName"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Recipient Name
              </label>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950/80
                  px-4
                  transition
                  focus-within:border-cyan-400
                  focus-within:ring-1
                  focus-within:ring-cyan-400/30
                "
              >
                <UserRound
                  size={19}
                  className="text-slate-500"
                />

                <input
                  id="recipientName"
                  name="recipientName"
                  type="text"
                  value={form.recipientName}
                  onChange={handleChange}
                  placeholder="JOY"
                  required
                  disabled={loading}
                  className="
                    w-full
                    bg-transparent
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-600
                  "
                />
              </div>
            </div>

            {/* Course Name */}
            <div>
              <label
                htmlFor="courseName"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Course Name
              </label>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950/80
                  px-4
                  transition
                  focus-within:border-cyan-400
                  focus-within:ring-1
                  focus-within:ring-cyan-400/30
                "
              >
                <Award
                  size={19}
                  className="text-slate-500"
                />

                <input
                  id="courseName"
                  name="courseName"
                  type="text"
                  value={form.courseName}
                  onChange={handleChange}
                  placeholder="Web Development"
                  required
                  disabled={loading}
                  className="
                    w-full
                    bg-transparent
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-600
                  "
                />
              </div>
            </div>

            {/* Issuer */}
            <div>
              <label
                htmlFor="issuerName"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Issuer Name
              </label>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950/80
                  px-4
                  transition
                  focus-within:border-cyan-400
                  focus-within:ring-1
                  focus-within:ring-cyan-400/30
                "
              >
                <Building2
                  size={19}
                  className="text-slate-500"
                />

                <input
                  id="issuerName"
                  name="issuerName"
                  type="text"
                  value={form.issuerName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="
                    w-full
                    bg-transparent
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                  "
                />
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <label
                htmlFor="issueDate"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Issue Date
              </label>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-white/10
                  bg-slate-950/80
                  px-4
                  transition
                  focus-within:border-cyan-400
                  focus-within:ring-1
                  focus-within:ring-cyan-400/30
                "
              >
                <CalendarDays
                  size={19}
                  className="text-slate-500"
                />

                <input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="
                    w-full
                    bg-transparent
                    py-3.5
                    text-sm
                    text-white
                    outline-none
                  "
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              mt-8
              flex
              w-full
              items-center
              justify-center
              rounded-xl
              bg-cyan-400
              py-3.5
              font-semibold
              text-slate-950
              shadow-lg
              shadow-cyan-400/10
              transition-all
              duration-200
              hover:bg-cyan-300
              hover:shadow-cyan-400/20
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading
              ? "Creating Certificate..."
              : "Create Certificate"}
          </button>
        </form>
      </div>
    </main>
  );
}