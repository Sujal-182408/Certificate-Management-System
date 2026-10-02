import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ShieldCheck,
  ShieldX,
  Search,
  ArrowRight,
  ScanLine,
} from "lucide-react";

import QRScanner from "../components/QRScanner";
import BackButton from "../components/BackButton";
import { apiRequest } from "../services/api";

export default function VerifyCertificate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(
    searchParams.get("token") || ""
  );

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [manualToken, setManualToken] = useState(token);


  // =====================================================
  // VERIFY CERTIFICATE
  // =====================================================

async function verifyCertificate(value) {
  let cleanValue = value?.trim();

  if (!cleanValue) {
    setError("Please scan a valid certificate QR code.");
    return;
  }

  // =====================================================
  // IF A FULL VERIFICATION URL WAS PASSED,
  // EXTRACT ONLY THE TOKEN
  // =====================================================

  try {
    const parsedUrl = new URL(cleanValue);

    if (parsedUrl.pathname === "/verify") {
      const urlToken = parsedUrl.searchParams.get("token");

      if (urlToken) {
        cleanValue = urlToken.trim();
      }
    }
  } catch {
    // Not a URL.
    // Assume it is already a raw UUID token.
  }

  // =====================================================
  // VALIDATE TOKEN
  // =====================================================

  if (!/^[0-9a-f-]{36}$/i.test(cleanValue)) {
    setError("Invalid certificate verification token.");
    return;
  }

  try {
    setLoading(true);
    setError("");
    setCertificate(null);

    console.log("=================================");
    console.log("VERIFY TOKEN:", cleanValue);
    console.log(
      "VERIFY URL:",
      `/verify/${encodeURIComponent(cleanValue)}`
    );
    console.log("=================================");

    const result = await apiRequest(
      `/verify/${encodeURIComponent(cleanValue)}`
    );

    console.log("VERIFY RESULT:", result);

    if (!result?.verified) {
      throw new Error(
        result?.message ||
          "Certificate verification failed."
      );
    }

    if (!result?.certificate) {
      throw new Error(
        "Certificate information was not returned."
      );
    }

    setToken(cleanValue);
    setManualToken(cleanValue);
    setCertificate(result.certificate);

    console.log(
      "Certificate verified successfully."
    );

  } catch (err) {
    console.error(
      "VERIFY ERROR:",
      err
    );

    setError(
      err?.message ||
        "Certificate verification failed."
    );

  } finally {
    setLoading(false);
  }
}

  // =====================================================
  // AUTO VERIFY TOKEN FROM URL
  // =====================================================

  useEffect(() => {
    const urlToken = searchParams.get("token");

    if (urlToken) {
      setToken(urlToken);
      setManualToken(urlToken);

      verifyCertificate(urlToken);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // =====================================================
  // MANUAL VERIFICATION
  // =====================================================

  function handleManualVerify(event) {
    event.preventDefault();

    verifyCertificate(manualToken);
  }


  // =====================================================
  // QR SCANNER
  // =====================================================

function handleScanResult(scannedValue) {
  if (!scannedValue) return;

  const cleanValue = scannedValue.trim();

  console.log("QR SCANNED:", cleanValue);

  // Let verifyCertificate() handle both:
  // 1. Full URL
  // 2. Raw UUID
  verifyCertificate(cleanValue);
}


  // =====================================================
  // RESET VERIFICATION
  // =====================================================

  function resetVerification() {
    setCertificate(null);
    setError("");
    setManualToken("");
    setToken("");
  }


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen w-full bg-[#060a0f] px-4 py-8 text-white sm:px-6 lg:px-8">

      <div className="mx-auto w-full max-w-5xl">

        {/* BACK BUTTON */}

        <div className="mb-7">
          <BackButton
            text="Back to Dashboard"
            to="/dashboard"
          />
        </div>


        {/* HEADER */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">

            <ShieldCheck
              size={32}
              className="text-cyan-400"
            />

          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Certificate Verification
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Scan the certificate QR code or enter the
            verification token to verify certificate
            authenticity.
          </p>

        </div>


        {/* =================================================
            VERIFICATION FORM
        ================================================= */}

        {!certificate && (

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/3 shadow-2xl">

            <div className="border-b border-white/10 px-5 py-5 sm:px-7">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">

                  <ScanLine size={22} />

                </div>

                <div>

                  <h2 className="text-lg font-bold">
                    Scan Certificate QR
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Point your camera at the certificate QR
                    code.
                  </p>

                </div>

              </div>

            </div>


            <div className="p-5 sm:p-7">

              {/* QR SCANNER */}

              <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">

                <QRScanner
                  onScan={handleScanResult}
                />

              </div>


              {/* OR */}

              <div className="my-7 flex items-center gap-4">

                <div className="h-px flex-1 bg-white/10" />

                <span className="rounded-full border border-white/10 bg-white/3 px-4 py-1.5 text-xs font-semibold text-slate-500">
                  OR
                </span>

                <div className="h-px flex-1 bg-white/10" />

              </div>


              {/* MANUAL TOKEN */}

              <div>

                <div className="mb-3">

                  <h3 className="text-sm font-semibold text-white">
                    Enter Verification Token
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the unique certificate verification
                    token manually.
                  </p>

                </div>


                <form
                  onSubmit={handleManualVerify}
                  className="flex flex-col gap-3 sm:flex-row"
                >

                  <input
                    type="text"
                    value={manualToken}
                    onChange={(event) =>
                      setManualToken(event.target.value)
                    }
                    placeholder="Enter verification token"
                    className="h-12 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/60"
                  />


                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <Search size={18} />

                    {loading
                      ? "Verifying..."
                      : "Verify Certificate"}

                  </button>

                </form>

              </div>


              {/* ERROR */}

              {error && (

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">

                  <ShieldX
                    size={20}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <div>

                    <p className="font-semibold">
                      Verification Failed
                    </p>

                    <p className="mt-1 leading-6 text-red-300/80">
                      {error}
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        )}


        {/* =================================================
            VERIFIED CERTIFICATE
        ================================================= */}

        {certificate && (

          <div
            className={`overflow-hidden rounded-2xl border p-8 text-center shadow-2xl ${
              certificate.status === "issued"
                ? "border-emerald-400/20 bg-emerald-400/6"
                : "border-red-400/20 bg-red-400/6"
            }`}
          >

            {certificate.status === "issued" ? (

              <>

                {/* ICON */}

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">

                  <ShieldCheck
                    size={45}
                    className="text-emerald-400"
                  />

                </div>


                {/* TITLE */}

                <h2 className="mt-6 text-2xl font-extrabold text-emerald-400 sm:text-3xl">
                  Certificate Verified
                </h2>


                <p className="mt-3 text-sm text-slate-400">
                  Certificate authenticity has been
                  successfully verified.
                </p>


                {/* CERTIFICATE NUMBER */}

                <div className="mx-auto mt-6 max-w-md rounded-xl border border-white/10 bg-black/20 px-5 py-4">

                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Certificate Number
                  </p>

                  <p className="mt-1 break-all font-mono text-sm font-semibold text-white">
                    {certificate.certificateNo}
                  </p>

                </div>


                {/* DETAILS */}

                <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                    <p className="text-xs text-slate-500">
                      Recipient
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {certificate.recipientName}
                    </p>

                  </div>


                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                    <p className="text-xs text-slate-500">
                      Course
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {certificate.courseName}
                    </p>

                  </div>


                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                    <p className="text-xs text-slate-500">
                      Issuer
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {certificate.issuerName}
                    </p>

                  </div>


                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                    <p className="text-xs text-slate-500">
                      Status
                    </p>

                    <p className="mt-1 font-semibold text-emerald-400">
                      {certificate.status}
                    </p>

                  </div>

                </div>


                {/* VIEW CERTIFICATE */}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/certificate/view?token=${encodeURIComponent(
                        token
                      )}`
                    )
                  }
                  className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >

                  View Certificate

                  <ArrowRight size={16} />

                </button>


                {/* VERIFY ANOTHER */}

                <div>

                  <button
                    type="button"
                    onClick={resetVerification}
                    className="mt-4 text-sm text-slate-500 hover:text-cyan-400"
                  >
                    Verify Another Certificate
                  </button>

                </div>

              </>

            ) : (

              <>
                {/* REVOKED */}

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10">

                  <ShieldX
                    size={45}
                    className="text-red-400"
                  />

                </div>


                <h2 className="mt-6 text-2xl font-extrabold text-red-400">
                  Certificate Revoked
                </h2>


                <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
                  This certificate is no longer valid.
                </p>


                <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-400/10 bg-black/20 px-5 py-4">

                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Certificate Number
                  </p>

                  <p className="mt-1 break-all font-mono text-sm font-semibold text-white">
                    {certificate.certificateNo}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={resetVerification}
                  className="mt-7 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 text-sm font-semibold text-white"
                >
                  Verify Another Certificate
                </button>

              </>

            )}

          </div>

        )}


        {/* =================================================
            SECURITY CARDS
        ================================================= */}

        {!certificate && (

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <SecurityCard
              title="Secure Verification"
              text="Certificate details are checked directly against the verification server."
            />

            <SecurityCard
              title="Unique Token"
              text="Every certificate uses a unique verification token."
            />

            <SecurityCard
              title="QR Enabled"
              text="Scan the certificate QR code for quick verification."
            />

          </div>

        )}


        {/* FOOTER */}

        <div className="mt-8 pb-5 text-center">

          <p className="text-xs text-slate-600">
            CertiVerify • Secure Certificate Verification
          </p>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// SECURITY CARD
// =====================================================

function SecurityCard({ title, text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/2.5 p-5">

      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">

        <ShieldCheck size={18} />

      </div>

      <h3 className="text-sm font-bold text-white">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {text}
      </p>

    </div>
  );
}