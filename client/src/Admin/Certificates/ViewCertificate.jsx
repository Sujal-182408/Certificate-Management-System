import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Edit3,
  ShieldCheck,
  ShieldX,
  Loader2,
} from "lucide-react";

import BackButton from "../../components/BackButton";
import { apiRequest } from "../../services/api";

// Company logo
import companyLogo from "../../assets/logo.png";

export default function ViewCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==============================
  // FETCH CERTIFICATE
  // ==============================
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(
          `/admin/certificates/${id}`
        );

        setCertificate(data.certificate || data);
      } catch (err) {
        console.error(
          "Certificate fetch error:",
          err
        );

        setError(
          err?.message ||
            "Failed to load certificate."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCertificate();
    }
  }, [id]);

  // ==============================
  // FORMAT DATE
  // ==============================
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==============================
  // LOADING
  // ==============================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2
            size={42}
            className="animate-spin text-cyan-400"
          />

          <p className="text-sm text-slate-400">
            Loading certificate...
          </p>
        </div>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <ShieldX
              size={30}
              className="text-red-400"
            />
          </div>

          <h2 className="text-xl font-bold text-white">
            Unable to Load Certificate
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/admin/certificates")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            <ArrowLeft size={17} />
            Back to Certificates
          </button>
        </div>
      </div>
    );
  }

  // ==============================
  // NO CERTIFICATE
  // ==============================
  if (!certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">
          Certificate not found.
        </p>
      </div>
    );
  }

  // ==============================
  // STATUS
  // ==============================
  const isValid =
    certificate.status === "issued";

  // ==============================
  // TOKEN
  // ==============================
  const verificationToken =
    certificate.verification_token ||
    certificate.verificationToken ||
    "";

  // ==============================
  // QR URL
  // ==============================
  const verificationUrl =
    verificationToken
      ? `${window.location.origin}/verify?token=${encodeURIComponent(
          verificationToken
        )}`
      : "";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-10">

      {/* ==============================
          TOP BAR
      ============================== */}
      <div className="mx-auto mb-6 flex w-full max-w-7xl items-center justify-between gap-4">

        <BackButton
          text="Back to Certificates"
          to="/admin/certificates"
        />

        <button
          onClick={() =>
            navigate(
              `/admin/certificates/${id}/edit`
            )
          }
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-400/20"
        >
          <Edit3 size={17} />
          Edit Certificate
        </button>

      </div>

      {/* ==============================
          CERTIFICATE
      ============================== */}
      <div className="mx-auto w-full max-w-6xl">

        <div
          className={`relative overflow-hidden rounded-[28px] bg-white shadow-2xl ${
            !isValid
              ? "ring-4 ring-red-500/40"
              : "ring-4 ring-cyan-400/20"
          }`}
        >

          {/* OUTER BORDER */}
          <div className="m-3 rounded-[22px] border-[3px] border-slate-800 p-2 sm:m-5 sm:p-3">

            {/* INNER BORDER */}
            <div className="relative min-h-[700px] rounded-[16px] border border-slate-300 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">

              {/* DECORATIVE CORNERS */}

              <div className="pointer-events-none absolute left-3 top-3 h-14 w-14 border-l-2 border-t-2 border-cyan-500/60" />

              <div className="pointer-events-none absolute right-3 top-3 h-14 w-14 border-r-2 border-t-2 border-cyan-500/60" />

              <div className="pointer-events-none absolute bottom-3 left-3 h-14 w-14 border-b-2 border-l-2 border-cyan-500/60" />

              <div className="pointer-events-none absolute bottom-3 right-3 h-14 w-14 border-b-2 border-r-2 border-cyan-500/60" />

              {/* ==========================
                  HEADER
              ========================== */}
              <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">

                {/* COMPANY LOGO */}
                <div className="flex items-center">

                  <img
                    src={companyLogo}
                    alt="eSparks IT Solutions"
                    className="h-16 w-auto max-w-[220px] object-contain sm:h-20"
                    draggable="false"
                  />

                </div>

                {/* QR */}
                <div className="flex flex-col items-center self-end sm:self-start">

                  {verificationUrl ? (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-md">

                        <QRCodeSVG
                          value={verificationUrl}
                          size={125}
                          bgColor="#ffffff"
                          fgColor="#07111f"
                          level="H"
                          includeMargin
                        />

                      </div>

                      <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Scan to Verify
                      </span>
                    </>
                  ) : (
                    <div className="flex h-[145px] w-[145px] items-center justify-center rounded-xl border border-red-200 bg-red-50 text-center">
                      <span className="px-4 text-xs font-semibold text-red-500">
                        QR unavailable
                      </span>
                    </div>
                  )}

                </div>

              </div>

              {/* ==========================
                  TITLE
              ========================== */}
              <div className="mt-10 text-center sm:mt-8">

                <p className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-600">
                  Achievement
                </p>

                <h1 className="mt-3 text-3xl font-extrabold tracking-[0.12em] text-slate-900 sm:text-5xl">
                  CERTIFICATE
                </h1>

                <h2 className="mt-1 text-lg font-semibold tracking-[0.3em] text-slate-600 sm:text-2xl">
                  OF COMPLETION
                </h2>

                <div className="mx-auto mt-5 flex items-center justify-center gap-3">

                  <div className="h-px w-16 bg-slate-300" />

                  <div className="h-2 w-2 rotate-45 bg-cyan-500" />

                  <div className="h-px w-16 bg-slate-300" />

                </div>

              </div>

              {/* ==========================
                  MAIN CONTENT
              ========================== */}
              <div className="mt-10 text-center sm:mt-12">

                <p className="text-sm text-slate-500 sm:text-base">
                  This certificate is proudly presented to
                </p>

                <h3 className="mt-4 break-words font-serif text-3xl font-bold text-slate-900 sm:text-5xl">
                  {certificate.recipient_name ||
                    certificate.recipientName ||
                    "-"}
                </h3>

                <div className="mx-auto mt-4 h-[2px] w-48 bg-gradient-to-r from-transparent via-cyan-500 to-transparent sm:w-72" />

                <p className="mt-7 text-sm text-slate-500 sm:text-base">
                  for successfully completing the course
                </p>

                <h4 className="mt-4 text-2xl font-bold text-cyan-700 sm:text-3xl">
                  {certificate.course_name ||
                    certificate.courseName ||
                    "-"}
                </h4>

                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                  and demonstrating dedication,
                  commitment, and successful
                  completion of the required
                  learning objectives.
                </p>

              </div>

              {/* ==========================
                  FOOTER
              ========================== */}
              <div className="mt-12 grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 sm:grid-cols-3 sm:items-end">

                {/* CERTIFICATE NUMBER */}
                <div className="text-center sm:text-left">

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Certificate No.
                  </p>

                  <p className="mt-2 break-all text-sm font-bold text-slate-800">
                    {certificate.certificate_no ||
                      certificate.certificateNo ||
                      "-"}
                  </p>

                </div>

                {/* SEAL */}
                <div className="flex justify-center">

                  <div
                    className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 ${
                      isValid
                        ? "border-cyan-500 text-cyan-700"
                        : "border-red-500 text-red-600"
                    }`}
                  >

                    {isValid ? (
                      <ShieldCheck size={25} />
                    ) : (
                      <ShieldX size={25} />
                    )}

                    <span className="mt-1 text-[8px] font-black tracking-wider">
                      {isValid
                        ? "VERIFIED"
                        : "REVOKED"}
                    </span>

                  </div>

                </div>

                {/* ISSUE DATE */}
                <div className="text-center sm:text-right">

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Issue Date
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {formatDate(
                      certificate.issue_date ||
                        certificate.issueDate
                    )}
                  </p>

                </div>

              </div>

              {/* ==========================
                  ISSUER
              ========================== */}
              <div className="mt-10 flex flex-col items-center text-center">

                <div className="mb-2 h-px w-48 bg-slate-400" />

                <p className="text-sm font-bold text-slate-800">
                  {certificate.issuer_name ||
                    certificate.issuerName ||
                    "eSparks IT Solutions"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Authorized Issuer
                </p>

              </div>

              {/* ==========================
                  STATUS
              ========================== */}
              <div className="mt-7 flex justify-center">

                <div
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                    isValid
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200"
                  }`}
                >

                  {isValid ? (
                    <ShieldCheck size={15} />
                  ) : (
                    <ShieldX size={15} />
                  )}

                  {isValid
                    ? "VERIFIED & VALID"
                    : "REVOKED"}

                </div>

              </div>

              {/* ==========================
                  VERIFICATION TEXT
              ========================== */}
              <div className="mt-6 text-center">

                <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">
                  This certificate can be independently
                  verified using the QR code above.
                </p>

              </div>

            </div>
          </div>

          {/* REVOKED OVERLAY */}
          {!isValid && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

              <div className="rotate-[-12deg] rounded-xl border-4 border-red-500/70 px-8 py-4 text-4xl font-black tracking-[0.2em] text-red-500/70 sm:text-6xl">
                REVOKED
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}