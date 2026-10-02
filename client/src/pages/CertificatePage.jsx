import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { BadgeCheck, FileCheck2, ShieldCheck, XCircle } from "lucide-react";
import { apiRequest } from "../services/api";
import "./CertificateView.css";

export default function CertificatePage() {
  const { id } = useParams();
  const location = useLocation();

  const [certificate, setCertificate] = useState(
    location.state?.certificate || null
  );
  const [loading, setLoading] = useState(!location.state?.certificate);
  const [error, setError] = useState("");

  useEffect(() => {
    if (certificate) return;

    let cancelled = false;

    async function fetchCertificate() {
      try {
        const result = await apiRequest(
          `/certificates/${encodeURIComponent(id)}`
        );

        if (!cancelled) {
          setCertificate(result.certificate);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCertificate();

    return () => {
      cancelled = true;
    };
  }, [id, certificate]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 text-center text-slate-400">
        Loading certificate details...
      </main>
    );
  }

  if (error || !certificate) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <XCircle className="mx-auto text-red-400" size={48} />

        <h1 className="mt-5 text-2xl font-bold text-white">
          Certificate unavailable
        </h1>

        <p className="mt-3 text-slate-400">
          {error || "No certificate information was found."}
        </p>

        <Link
          to="/verify"
          className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
        >
          Return to verification
        </Link>
      </main>
    );
  }

  const isValid = certificate.status === "valid";

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-10">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
              <ShieldCheck size={30} />
            </div>

            <div>
              <p className="text-sm text-slate-400">CERTIFICATE RECORD</p>
              <h1 className="text-2xl font-bold text-white">
                Verification result
              </h1>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              isValid
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-red-400/10 text-red-300"
            }`}
          >
            {isValid ? (
              <BadgeCheck size={18} />
            ) : (
              <XCircle size={18} />
            )}

            {isValid ? "Valid certificate" : "Not valid"}
          </div>
        </div>

        <div className="my-8 border-t border-white/10" />

        <div className="mb-8 text-center">
          <FileCheck2 className="mx-auto text-cyan-300" size={44} />

          <h2 className="mt-4 text-2xl font-bold text-white">
            {certificate.title || "Employee Certificate"}
          </h2>

          <p className="mt-2 text-slate-400">
            Certificate details returned by the verification service.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {[
            ["Employee name", certificate.employeeName],
            ["Certificate ID", certificate.certificateNumber],
            ["Organization", certificate.organization],
            ["Issue date", certificate.issueDate],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 wrap-break-word font-medium text-white">
                {value || "Not provided"}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-5 text-slate-500">
          This result reflects the status returned by the server at the time
          of verification. Only the official backend determines certificate
          validity.
        </p>
      </div>
    </main>
  );
}