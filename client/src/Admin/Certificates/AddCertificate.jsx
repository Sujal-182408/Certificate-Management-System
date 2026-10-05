import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Award,
  CalendarDays,
  Building2,
  Mail,
  CheckCircle,
  AlertCircle,
  UserRound,
  FileCheck2,
} from "lucide-react";

import BackButton from "../../components/BackButton";

const API_URL = "/api";

export default function AddCertificate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    certificateType: "CERT",
    employeeEmail: "",
    courseName: "",
    issuerName: "eSparks IT Solutions",
    issueDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [createdCertificate, setCreatedCertificate] =
    useState(null);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
    setCreatedCertificate(null);
  }

  // =====================================================
  // VALIDATE EMAIL
  // =====================================================

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }

  // =====================================================
  // HANDLE SUBMIT
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");
    setCreatedCertificate(null);

    try {
      // =================================================
      // CLEAN VALUES
      // =================================================

      const certificateType =
        form.certificateType
          .trim()
          .toUpperCase();

      const employeeEmail =
        form.employeeEmail
          .trim()
          .toLowerCase();

      const courseName =
        form.courseName.trim();

      const issuerName =
        form.issuerName.trim();

      const issueDate =
        form.issueDate;

      // =================================================
      // CERTIFICATE TYPE VALIDATION
      // =================================================

      if (
        !["CERT", "INTR"].includes(
          certificateType
        )
      ) {
        throw new Error(
          "Please select a valid certificate type."
        );
      }

      // =================================================
      // EMPLOYEE EMAIL VALIDATION
      // =================================================

      if (!employeeEmail) {
        throw new Error(
          "Employee Gmail is required."
        );
      }

      if (!isValidEmail(employeeEmail)) {
        throw new Error(
          "Please enter a valid employee Gmail."
        );
      }

      // =================================================
      // COURSE VALIDATION
      // =================================================

      if (!courseName) {
        throw new Error(
          "Course name is required."
        );
      }

      if (courseName.length > 200) {
        throw new Error(
          "Course name must be at most 200 characters."
        );
      }

      // =================================================
      // ISSUER VALIDATION
      // =================================================

      if (!issuerName) {
        throw new Error(
          "Issuer name is required."
        );
      }

      if (issuerName.length > 200) {
        throw new Error(
          "Issuer name must be at most 200 characters."
        );
      }

      // =================================================
      // ISSUE DATE VALIDATION
      // =================================================

      if (!issueDate) {
        throw new Error(
          "Issue date is required."
        );
      }

      // =================================================
      // CREATE CERTIFICATE
      //
      // IMPORTANT:
      //
      // certificateNo is NOT sent.
      //
      // employeeId is NOT sent.
      //
      // recipientName is NOT sent.
      //
      // Backend generates certificateNo.
      // Backend finds employee by email.
      // Backend gets recipient name from PostgreSQL.
      // =================================================

      const response = await fetch(
        `${API_URL}/admin/certificates`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            certificateType,
            employeeEmail,
            courseName,
            issuerName,
            issueDate,
          }),
        }
      );

      // =================================================
      // READ RESPONSE
      // =================================================

      const data =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "Create certificate:",
        response.status,
        data
      );

      // =================================================
      // ADMIN SESSION EXPIRED
      // =================================================

      if (response.status === 401) {
        throw new Error(
          "Admin authentication required. Please login again."
        );
      }

      // =================================================
      // EMPLOYEE NOT FOUND
      // =================================================

      if (response.status === 404) {
        throw new Error(
          data?.message ||
            "No employee account exists with this Gmail."
        );
      }

      // =================================================
      // EMPLOYEE INACTIVE
      // =================================================

      if (response.status === 403) {
        throw new Error(
          data?.message ||
            "This employee account is inactive."
        );
      }

      // =================================================
      // DUPLICATE
      // =================================================

      if (response.status === 409) {
        throw new Error(
          data?.message ||
            "Unable to create the certificate because a duplicate value exists."
        );
      }

      // =================================================
      // OTHER SERVER ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to create certificate."
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setSuccess(
        data?.message ||
          "Certificate created successfully!"
      );

      setCreatedCertificate(
        data?.certificate || null
      );

      // =================================================
      // RESET FORM
      // =================================================

      setForm({
        certificateType: "CERT",
        employeeEmail: "",
        courseName: "",
        issuerName:
          "eSparks IT Solutions",
        issueDate: "",
      });
    } catch (err) {
      console.error(
        "Create certificate error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while creating the certificate."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-midnight px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <div className="mb-6">
          <BackButton />
        </div>

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
            <Award size={30} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create Certificate
          </h1>

          <p className="mt-2 text-slate-400">
            Create and issue a certificate for a
            registered employee.
          </p>
        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-emerald-300">

            <div className="flex items-start gap-3">
              <CheckCircle
                size={22}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0">
                <p className="font-semibold">
                  {success}
                </p>

                <p className="mt-1 text-sm text-emerald-300/80">
                  The certificate ID was generated
                  automatically by the server.
                </p>
              </div>
            </div>

            {/* =============================================
                CREATED CERTIFICATE DETAILS
            ============================================= */}

            {createdCertificate && (
              <div className="mt-5 rounded-xl border border-emerald-400/10 bg-black/10 p-4">

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* CERTIFICATE NUMBER */}

                  {createdCertificate
                    .certificate_no && (
                    <div>
                      <p className="text-xs text-emerald-300/60">
                        Certificate ID
                      </p>

                      <p className="mt-1 break-all text-sm font-bold text-white">
                        {
                          createdCertificate.certificate_no
                        }
                      </p>
                    </div>
                  )}

                  {/* CERTIFICATE TYPE */}

                  {createdCertificate
                    .certificate_type && (
                    <div>
                      <p className="text-xs text-emerald-300/60">
                        Certificate Type
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white">
                        {createdCertificate
                          .certificate_type ===
                        "INTR"
                          ? "Internship"
                          : "Certificate"}
                      </p>
                    </div>
                  )}

                  {/* EMPLOYEE */}

                  {createdCertificate
                    .employee_name && (
                    <div>
                      <p className="text-xs text-emerald-300/60">
                        Employee
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white">
                        {
                          createdCertificate.employee_name
                        }
                      </p>
                    </div>
                  )}

                  {/* EMPLOYEE EMAIL */}

                  {createdCertificate
                    .employee_email && (
                    <div>
                      <p className="text-xs text-emerald-300/60">
                        Employee Gmail
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-white">
                        {
                          createdCertificate.employee_email
                        }
                      </p>
                    </div>
                  )}

                  {/* VERIFICATION TOKEN */}

                  {createdCertificate
                    .verification_token && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-emerald-300/60">
                        Verification Token
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-white">
                        {
                          createdCertificate.verification_token
                        }
                      </p>
                    </div>
                  )}

                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="mt-4 text-sm underline transition hover:text-white"
            >
              Return to dashboard
            </button>
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">

            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Certificate creation failed
              </p>

              <p className="mt-1 text-sm text-red-300/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="grid gap-6 md:grid-cols-2">

            {/* =================================================
                CERTIFICATE TYPE
            ================================================= */}

            <div>
              <label
                htmlFor="certificateType"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Certificate Type
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/20">

                <FileCheck2
                  size={19}
                  className="shrink-0 text-slate-500"
                />

                <select
                  id="certificateType"
                  name="certificateType"
                  value={
                    form.certificateType
                  }
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none"
                >
                  <option
                    value="CERT"
                    className="bg-slate-900"
                  >
                    Certificate
                  </option>

                  <option
                    value="INTR"
                    className="bg-slate-900"
                  >
                    Internship
                  </option>
                </select>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                The certificate ID will be generated
                automatically.
              </p>
            </div>

            {/* =================================================
                GENERATED ID PREVIEW
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Certificate ID
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-4">

                <FileCheck2
                  size={19}
                  className="shrink-0 text-cyan-400"
                />

                <div className="py-3.5">
                  <p className="text-sm font-semibold text-cyan-200">
                    Auto Generated
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    EITS-
                    {form.certificateType}-
                    YYYY-1001+
                  </p>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                This value cannot be manually changed.
              </p>
            </div>

            {/* =================================================
                EMPLOYEE GMAIL
            ================================================= */}

            <div className="md:col-span-2">
              <label
                htmlFor="employeeEmail"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Employee Gmail
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/20">

                <Mail
                  size={19}
                  className="shrink-0 text-slate-500"
                />

                <input
                  id="employeeEmail"
                  name="employeeEmail"
                  type="email"
                  value={
                    form.employeeEmail
                  }
                  onChange={handleChange}
                  placeholder="employee@gmail.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                This Gmail must already exist in
                the employee database.
              </p>
            </div>

            {/* =================================================
                DATABASE LINK INFORMATION
            ================================================= */}

            <div className="md:col-span-2">
              <div className="flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">

                <UserRound
                  size={20}
                  className="mt-0.5 shrink-0 text-cyan-300"
                />

                <div>
                  <p className="text-sm font-medium text-cyan-200">
                    Employee verification
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    The server will match this Gmail
                    against registered employee
                    accounts before creating the
                    certificate.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                COURSE NAME
            ================================================= */}

            <div>
              <label
                htmlFor="courseName"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Course Name
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/20">

                <Award
                  size={19}
                  className="shrink-0 text-slate-500"
                />

                <input
                  id="courseName"
                  name="courseName"
                  type="text"
                  value={
                    form.courseName
                  }
                  onChange={handleChange}
                  placeholder="Web Development"
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* =================================================
                ISSUER NAME
            ================================================= */}

            <div>
              <label
                htmlFor="issuerName"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Issuer Name
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/20">

                <Building2
                  size={19}
                  className="shrink-0 text-slate-500"
                />

                <input
                  id="issuerName"
                  name="issuerName"
                  type="text"
                  value={
                    form.issuerName
                  }
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none"
                />
              </div>
            </div>

            {/* =================================================
                ISSUE DATE
            ================================================= */}

            <div className="md:col-span-2">
              <label
                htmlFor="issueDate"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Issue Date
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 transition focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/20">

                <CalendarDays
                  size={19}
                  className="shrink-0 text-slate-500"
                />

                <input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  value={
                    form.issueDate
                  }
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-transparent py-3.5 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              SECURITY NOTICE
          ================================================= */}

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/50 p-4">

            <p className="text-xs leading-5 text-slate-400">
              <span className="font-semibold text-slate-300">
                Security:
              </span>{" "}
              Certificate ID, employee ID and
              recipient name are never accepted
              from the frontend. The backend
              generates the certificate ID and
              obtains employee information directly
              from PostgreSQL.
            </p>
          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-1/3"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 py-3.5 font-semibold text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300 hover:shadow-cyan-400/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-2/3"
            >
              {loading
                ? "Creating Certificate..."
                : "Create Certificate"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}