import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import {
  BadgeCheck,
  Check,
  Clipboard,
  Copy,
  ExternalLink,
  FileBadge,
  LogOut,
  Mail,
  QrCode,
  RefreshCw,
  ShieldCheck,
  User,
  CalendarDays,
  BookOpen,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";

import { apiRequest } from "../services/api";


// =========================================================
// NORMALIZE CERTIFICATE
// Backend may return snake_case.
// Frontend uses camelCase.
// =========================================================

function normalizeCertificate(raw = {}) {
  return {
    id: raw.id ?? null,

    certificateNo:
      raw.certificateNo ??
      raw.certificate_no ??
      "",

    recipientName:
      raw.recipientName ??
      raw.recipient_name ??
      "",

    courseName:
      raw.courseName ??
      raw.course_name ??
      "",

    issuerName:
      raw.issuerName ??
      raw.issuer_name ??
      "",

    issueDate:
      raw.issueDate ??
      raw.issue_date ??
      "",

    verificationToken:
      raw.verificationToken ??
      raw.verification_token ??
      "",

    status:
      raw.status ??
      "issued",

    createdAt:
      raw.createdAt ??
      raw.created_at ??
      "",

    revokedAt:
      raw.revokedAt ??
      raw.revoked_at ??
      "",
  };
}


export default function EmployeeDashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [employee, setEmployee] =
    useState(null);

  const [certificate, setCertificate] =
    useState(null);

  const [verificationUrl, setVerificationUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [qrLoading, setQrLoading] =
    useState(false);

  const [qrGenerated, setQrGenerated] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [error, setError] =
    useState("");


  // =========================================================
  // LOAD EMPLOYEE + EXISTING QR
  // =========================================================

  useEffect(() => {
    loadEmployee();
  }, []);


  async function loadEmployee() {
    try {
      setLoading(true);
      setError("");

      // -------------------------------------------------------
      // GET CURRENT EMPLOYEE
      // -------------------------------------------------------

      const employeeData =
        await apiRequest(
          "/employee-auth/me",
          {
            method: "GET",
          }
        );

      console.log(
        "========== EMPLOYEE DEBUG =========="
      );

      console.log(
        "EMPLOYEE DATA:",
        employeeData
      );

      console.log(
        "EMPLOYEE OBJECT:",
        employeeData?.employee
      );

      console.log(
        "EMPLOYEE NAME:",
        employeeData?.employee?.name
      );

      console.log(
        "EMPLOYEE EMAIL:",
        employeeData?.employee?.email
      );

      console.log(
        "===================================="
      );


      // -------------------------------------------------------
      // EMPLOYEE NOT FOUND
      // -------------------------------------------------------

      if (!employeeData?.employee) {
        throw new Error(
          "Employee information was not returned."
        );
      }


      // -------------------------------------------------------
      // SAVE EMPLOYEE
      // -------------------------------------------------------

      setEmployee(
        employeeData.employee
      );


      // -------------------------------------------------------
      // CHECK EXISTING QR
      // -------------------------------------------------------

      try {
        const qrData =
          await apiRequest(
            "/employee/qr",
            {
              method: "GET",
            }
          );

        console.log(
          "EXISTING QR DATA:",
          qrData
        );


        // -----------------------------------------------------
        // BACKEND MAY RETURN verificationUrl OR url
        // -----------------------------------------------------

        const existingVerificationUrl =
          qrData?.verificationUrl ||
          qrData?.url;


        // -----------------------------------------------------
        // EXISTING QR FOUND
        // -----------------------------------------------------

        if (existingVerificationUrl) {

          setVerificationUrl(
            existingVerificationUrl
          );


          // ---------------------------------------------------
          // LOAD CERTIFICATE
          // ---------------------------------------------------

          if (qrData?.certificate) {
            setCertificate(
              normalizeCertificate(
                qrData.certificate
              )
            );
          }


          // ---------------------------------------------------
          // SHOW QR
          // ---------------------------------------------------

          setQrGenerated(true);
        }

      } catch (qrError) {

        /*
         * Employee may not have generated
         * QR yet.
         *
         * Do NOT redirect to login.
         */

        console.log(
          "No existing QR:",
          qrError?.message
        );
      }

    } catch (error) {

      console.error(
        "Employee dashboard error:",
        error
      );


      // -------------------------------------------------------
      // AUTHENTICATION ERROR
      // -------------------------------------------------------

      if (
        error?.status === 401 ||
        error?.status === 403
      ) {
        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }


      // -------------------------------------------------------
      // OTHER ERROR
      // -------------------------------------------------------

      setError(
        error?.message ||
          "Unable to load employee dashboard."
      );

    } finally {

      setLoading(false);
    }
  }


  // =========================================================
  // GENERATE QR
  // =========================================================

  async function generateQR() {
    try {

      setQrLoading(true);
      setError("");
      setCopied(false);


      const data =
        await apiRequest(
          "/employee/qr",
          {
            method: "POST",
          }
        );


      console.log(
        "QR RESPONSE:",
        data
      );


      // -------------------------------------------------------
      // VERIFICATION URL
      // -------------------------------------------------------

      const newVerificationUrl =
        data?.verificationUrl ||
        data?.url;


      if (!newVerificationUrl) {

        console.error(
          "QR response does not contain URL:",
          data
        );

        throw new Error(
          "Verification URL was not returned."
        );
      }


      // -------------------------------------------------------
      // SAVE VERIFICATION URL
      // -------------------------------------------------------

      setVerificationUrl(
        newVerificationUrl
      );


      // -------------------------------------------------------
      // SAVE CERTIFICATE
      // -------------------------------------------------------

      if (data?.certificate) {

        setCertificate(
          normalizeCertificate(
            data.certificate
          )
        );
      }


      // -------------------------------------------------------
      // SHOW QR
      // -------------------------------------------------------

      setQrGenerated(true);

    } catch (error) {

      console.error(
        "Generate QR error:",
        error
      );


      setError(
        error?.message ||
          "Something went wrong while generating the QR code."
      );

    } finally {

      setQrLoading(false);
    }
  }


  // =========================================================
  // VERIFY CERTIFICATE
  // =========================================================

  function verifyCertificate() {

    if (!verificationUrl) {

      setError(
        "Verification link is not available."
      );

      return;
    }


    try {

      const url =
        new URL(
          verificationUrl
        );


      const token =
        url.searchParams.get(
          "token"
        );


      if (!token) {

        setError(
          "Verification token is missing."
        );

        return;
      }


      console.log(
        "NAVIGATING TO VERIFY WITH TOKEN"
      );


      navigate(
        `/verify?token=${encodeURIComponent(
          token
        )}`
      );

    } catch (error) {

      console.error(
        "Verification navigation error:",
        error
      );


      setError(
        "Invalid verification URL."
      );
    }
  }


  // =========================================================
  // VIEW CERTIFICATE DIRECTLY
  // =========================================================

  function viewCertificate() {

    if (!verificationUrl) {

      setError(
        "Verification link is not available."
      );

      return;
    }


    try {

      const url =
        new URL(
          verificationUrl
        );


      const token =
        url.searchParams.get(
          "token"
        );


      if (!token) {

        setError(
          "Verification token is missing."
        );

        return;
      }


      navigate(
        `/certificate/view?token=${encodeURIComponent(
          token
        )}`
      );

    } catch (error) {

      console.error(
        "Certificate navigation error:",
        error
      );


      setError(
        "Invalid certificate verification URL."
      );
    }
  }


 // =========================================================
// COPY VERIFICATION URL
// =========================================================

async function copyVerificationUrl() {
  if (!verificationUrl) {
    setError("Verification link is not available.");
    return;
  }

  try {
    // -------------------------------------------------------
    // MODERN CLIPBOARD API
    // Works on HTTPS / secure contexts
    // -------------------------------------------------------

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        verificationUrl
      );
    } else {
      // -----------------------------------------------------
      // FALLBACK
      // Required for HTTP LAN URL:
      // http://192.168.1.5:5174
      // -----------------------------------------------------

      const textArea =
        document.createElement("textarea");

      textArea.value =
        verificationUrl;

      textArea.style.position =
        "fixed";

      textArea.style.left =
        "-9999px";

      textArea.style.top =
        "0";

      textArea.style.width =
        "1px";

      textArea.style.height =
        "1px";

      textArea.style.opacity =
        "0";

      textArea.setAttribute(
        "readonly",
        ""
      );

      document.body.appendChild(
        textArea
      );

      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(
        0,
        textArea.value.length
      );

      const copiedSuccessfully =
        document.execCommand(
          "copy"
        );

      document.body.removeChild(
        textArea
      );

      if (!copiedSuccessfully) {
        throw new Error(
          "Browser copy command failed."
        );
      }
    }

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    setCopied(true);
    setError("");

    setTimeout(() => {
      setCopied(false);
    }, 2000);

  } catch (error) {
    console.error(
      "Copy verification URL error:",
      error
    );

    setCopied(false);

    setError(
      "Unable to copy verification link. Please copy it manually."
    );
  }
}
  // =========================================================
  // LOGOUT
  // =========================================================

  async function logout() {

    try {

      await apiRequest(
        "/employee-auth/logout",
        {
          method: "POST",
        }
      );

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    } finally {

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }
  }


  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(date) {

    if (!date) {
      return "-";
    }


    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }


    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-5 text-white">

        <div className="pointer-events-none absolute -left-40 -top-40 h-88 w-88 rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="pointer-events-none absolute -bottom-40 -right-40 h-88 w-88 rounded-full bg-blue-600/10 blur-[100px]" />

        <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.035] p-8 text-center shadow-2xl backdrop-blur-xl">

          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">

            <ShieldCheck
              size={25}
            />

          </div>


          <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-[3px] border-white/10 border-t-cyan-400" />


          <h2 className="text-lg font-bold text-white">
            Loading Dashboard
          </h2>


          <p className="mt-2 text-xs text-slate-500">
            Securing your certificate portal...
          </p>

        </div>

      </div>
    );
  }


  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070b12] text-white">

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed -left-55 top-[10%] h-105 w-105 rounded-full bg-cyan-500/10 blur-[110px]" />

      <div className="pointer-events-none fixed bottom-[5%] -right-55 h-105 w-105 rounded-full bg-blue-600/10 blur-[110px]" />


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070b12]/80 backdrop-blur-xl">

        <div className="mx-auto flex min-h-18 w-[calc(100%-32px)] max-w-7xl items-center justify-between">

          {/* BRAND */}

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">

              <ShieldCheck
                size={21}
              />

            </div>


            <div className="hidden text-left sm:block">

              <div className="text-[16px] font-extrabold tracking-tight text-white">
                CertiVerify
              </div>

              <div className="text-[9px] font-semibold uppercase tracking-[1px] text-slate-500">
                Certificate Portal
              </div>

            </div>

          </button>


          {/* RIGHT */}

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2.5 sm:flex">

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-300">

                {employee?.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "E"}

              </div>


              <div className="flex flex-col">

                <span className="text-xs font-bold text-slate-200">
                  {employee?.name ||
                    "Employee"}
                </span>

                <span className="text-[10px] text-slate-500">
                  Employee
                </span>

              </div>

            </div>


            <div className="hidden h-7 w-px bg-white/8 sm:block" />


            <button
              type="button"
              onClick={logout}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 text-xs font-bold text-slate-400 transition hover:border-red-400/20 hover:bg-red-400/[0.07] hover:text-red-300"
            >

              <LogOut
                size={16}
              />

              <span className="hidden sm:block">
                Logout
              </span>

            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 mx-auto w-[calc(100%-32px)] max-w-7xl py-10 sm:py-14">


        {/* ===================================================
            HERO
        =================================================== */}

        <section className="mb-8 flex items-end justify-between gap-8">

          <div className="max-w-2xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/6 px-3 py-1.5 text-[9px] font-extrabold tracking-[1.4px] text-cyan-300">

              <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />

              EMPLOYEE PORTAL

            </div>


            <h1 className="text-3xl font-extrabold leading-tight tracking-[-1.5px] text-white sm:text-5xl">

              Welcome back,

              <span className="bg-linear-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">

                {" "}

                {employee?.name ||
                  "Employee"}

              </span>

              <span className="ml-2">
                👋
              </span>

            </h1>


            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-[15px]">
              Manage your certificate and
              securely share its verification
              details from one place.
            </p>

          </div>


          <div className="hidden min-w-55 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/2.5 p-3.5 lg:flex">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-400/8 text-green-400">

              <ShieldCheck
                size={21}
              />

            </div>


            <div className="flex flex-col gap-1">

              <strong className="text-xs text-slate-200">
                Secure Account
              </strong>

              <span className="text-[10px] text-slate-500">
                Your session is protected
              </span>

            </div>

          </div>

        </section>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/6 px-4 py-3 text-xs text-red-300">

            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-400/10 font-bold">
              !
            </div>


            <span className="flex-1">
              {error}
            </span>


            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-lg text-red-300 transition hover:text-white"
            >
              ×
            </button>

          </div>
        )}


        {/* ===================================================
            SUMMARY
        =================================================== */}

        <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">


          {/* EMPLOYEE */}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/15">

            <div className="mb-4 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/8 text-cyan-400">

                <User
                  size={19}
                />

              </div>


              <span className="text-[9px] font-extrabold tracking-[1.3px] text-slate-500">
                EMPLOYEE
              </span>


              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-400/8 px-2 py-1 text-[8px] font-extrabold text-green-400">

                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                Active

              </span>

            </div>


            <h2 className="truncate text-xl font-extrabold text-slate-100">
              {employee?.name ||
                "-"}
            </h2>


            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">

              <Mail
                size={14}
              />

              <span className="truncate">
                {employee?.email ||
                  "-"}
              </span>

            </div>

          </div>


          {/* CERTIFICATE */}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-xl transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400/15">

            <div className="mb-4 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/9 text-indigo-400">

                <FileBadge
                  size={19}
                />

              </div>


              <span className="text-[9px] font-extrabold tracking-[1.3px] text-slate-500">
                CERTIFICATE
              </span>


              <span className="ml-auto flex items-center gap-1 rounded-full bg-cyan-400/8 px-2 py-1 text-[8px] font-extrabold text-cyan-300">

                <Check
                  size={11}
                />

                ISSUED

              </span>

            </div>


            <h2 className="truncate text-xl font-extrabold text-slate-100">
              {certificate?.certificateNo ||
                "Certificate"}
            </h2>


            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">

              <BookOpen
                size={14}
              />

              <span className="truncate">
                {certificate?.courseName ||
                  "Certificate information"}
              </span>

            </div>

          </div>

        </section>


        {/* ===================================================
            MAIN GRID
        =================================================== */}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">


          {/* =================================================
              CERTIFICATE DETAILS
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.035] shadow-2xl">

            <div className="flex items-center gap-3 border-b border-white/6 px-5 py-5">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/9 text-indigo-400">

                <FileBadge
                  size={21}
                />

              </div>


              <div>

                <span className="block text-[9px] font-extrabold tracking-[1.3px] text-slate-500">
                  CERTIFICATE DETAILS
                </span>

                <h2 className="mt-1 text-[17px] font-extrabold text-slate-100">
                  Your Certificate
                </h2>

              </div>

            </div>


            {certificate ? (

              <div className="grid grid-cols-1 sm:grid-cols-2">

                <CertificateDetail
                  label="Certificate Number"
                  value={
                    certificate.certificateNo
                  }
                  borderRight
                />


                <CertificateDetail
                  label="Recipient"
                  value={
                    certificate.recipientName ||
                    employee?.name
                  }
                />


                <CertificateDetail
                  label="Course"
                  value={
                    certificate.courseName
                  }
                  borderRight
                />


                <CertificateDetail
                  label="Issued By"
                  value={
                    certificate.issuerName
                  }
                />


                {/* DATE */}

                <div className="border-b border-white/5 p-5 sm:border-r">

                  <span className="block text-[10px] font-semibold text-slate-500">
                    Issue Date
                  </span>


                  <strong className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-200">

                    <CalendarDays
                      size={14}
                      className="text-slate-500"
                    />

                    {formatDate(
                      certificate.issueDate
                    )}

                  </strong>

                </div>


                {/* STATUS */}

                <div className="p-5">

                  <span className="block text-[10px] font-semibold text-slate-500">
                    Status
                  </span>


                  <strong className="mt-2 flex items-center gap-2 text-sm font-bold capitalize text-green-400">

                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />

                    {certificate.status ||
                      "issued"}

                  </strong>

                </div>

              </div>

            ) : (

              <div className="flex min-h-70 flex-col items-center justify-center p-8 text-center">

                <FileBadge
                  size={35}
                  className="text-slate-700"
                />


                <h3 className="mt-4 text-sm font-bold text-slate-400">
                  Certificate information unavailable
                </h3>


                <p className="mt-2 max-w-xs text-xs leading-6 text-slate-600">
                  Generate your certificate QR
                  to load certificate details.
                </p>

              </div>

            )}

          </div>


          {/* =================================================
              QR
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.035] shadow-2xl">

            {!qrGenerated ? (

              <div className="p-5">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/8 text-cyan-400">

                    <QrCode
                      size={22}
                    />

                  </div>


                  <div>

                    <span className="block text-[9px] font-extrabold tracking-[1.3px] text-slate-500">
                      VERIFICATION
                    </span>

                    <h2 className="mt-1 text-[17px] font-extrabold text-slate-100">
                      Generate QR Code
                    </h2>

                  </div>

                </div>


                <div className="mb-5 flex min-h-47.5 items-center justify-center rounded-xl border border-dashed border-white/9 bg-[radial-gradient(circle,rgba(34,211,238,0.06),transparent_65%)]">

                  <div className="relative h-32 w-32 bg-[linear-gradient(90deg,rgba(255,255,255,.06)_10%,transparent_10%),linear-gradient(rgba(255,255,255,.06)_10%,transparent_10%)] bg-size-[12px_12px]">

                    <div className="absolute left-2 top-2 h-8 w-8 border-[5px] border-cyan-400 border-b-4 border-r-4" />

                    <div className="absolute right-2 top-2 h-8 w-8 border-[5px] border-cyan-400 border-b-4 border-l-4" />

                    <div className="absolute bottom-2 left-2 h-8 w-8 border-[5px] border-cyan-400 border-r-4 border-t-4" />

                    <div className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#070b12] text-cyan-400">

                      <ShieldCheck
                        size={19}
                      />

                    </div>

                  </div>

                </div>


                <p className="mb-5 text-center text-xs leading-6 text-slate-500">
                  Generate your certificate
                  verification QR code. Anyone
                  with this QR code can verify
                  your certificate.
                </p>


                <button
                  type="button"
                  onClick={generateQR}
                  disabled={qrLoading}
                  className="flex min-h-11.5 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 text-xs font-extrabold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:shadow-cyan-900/30 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {qrLoading ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode
                        size={18}
                      />

                      Generate Certificate QR
                    </>
                  )}

                </button>


                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-400/10 bg-amber-400/4 p-3 text-amber-400">

                  <LockKeyhole
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <div>

                    <strong className="block text-[10px] text-amber-300">
                      One-time generation
                    </strong>

                    <span className="mt-1 block text-[10px] leading-5 text-stone-500">
                      Your QR uses the existing
                      certificate verification
                      token.
                    </span>

                  </div>

                </div>

              </div>

            ) : (

              <div className="p-5">

                <div className="mb-4 flex items-start justify-between">

                  <div>

                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-green-400/8 px-2 py-1 text-[8px] font-extrabold tracking-[0.8px] text-green-400">

                      <Check
                        size={11}
                      />

                      GENERATED

                    </div>


                    <h2 className="text-xl font-extrabold text-white">
                      Certificate QR
                    </h2>


                    <p className="mt-1 text-[11px] text-slate-500">
                      Scan to verify certificate
                      authenticity.
                    </p>

                  </div>


                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07] text-cyan-400">

                    <QrCode
                      size={21}
                    />

                  </div>

                </div>


                {/* REAL QR */}

                <div className="flex items-center justify-center rounded-xl border border-white/6 bg-white/1.5 p-5">

                  <div className="rounded-xl bg-white p-3 shadow-2xl">

                    <QRCodeSVG
                      value={
                        verificationUrl
                      }
                      size={205}
                      bgColor="#ffffff"
                      fgColor="#07111f"
                      level="H"
                      includeMargin
                    />

                  </div>

                </div>


                {/* SUCCESS */}

                <div className="my-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-400">

                  <Check
                    size={15}
                  />

                  QR code generated successfully

                </div>


                {/* ACTIONS */}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={
                      verifyCertificate
                    }
                    className="flex min-h-10.75 items-center justify-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/9 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-400/15"
                  >

                    <ExternalLink
                      size={16}
                    />

                    Verify Certificate

                  </button>


                  <button
                    type="button"
                    onClick={
                      copyVerificationUrl
                    }
                    className={`flex min-h-10.75 items-center justify-center gap-2 rounded-xl border text-[11px] font-bold transition ${
                      copied
                        ? "border-green-400/15 bg-green-400/[0.07] text-green-400"
                        : "border-white/8 bg-white/3 text-slate-400 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >

                    {copied ? (
                      <>
                        <Check
                          size={16}
                        />

                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy
                          size={16}
                        />

                        Copy Link
                      </>
                    )}

                  </button>

                </div>


                {/* VIEW CERTIFICATE */}

                <button
                  type="button"
                  onClick={
                    viewCertificate
                  }
                  className="mt-2 flex min-h-10.75 w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 text-[11px] font-bold text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
                >

                  <FileBadge
                    size={16}
                  />

                  View Certificate

                  <ArrowRight
                    size={15}
                  />

                </button>

              </div>

            )}

          </div>

        </section>


        {/* ===================================================
            VERIFICATION LINK
        =================================================== */}

        {qrGenerated &&
          verificationUrl && (

            <section className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/2.5 p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.07] text-cyan-400">

                <Clipboard
                  size={19}
                />

              </div>


              <div className="min-w-0 flex-1">

                <span className="block text-[8px] font-extrabold tracking-[1.2px] text-slate-500">
                  VERIFICATION LINK
                </span>


                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {verificationUrl}
                </p>

              </div>


              <button
                type="button"
                onClick={
                  copyVerificationUrl
                }
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold transition ${
                  copied
                    ? "border-green-400/15 bg-green-400/[0.07] text-green-400"
                    : "border-white/8 bg-white/3 text-slate-400 hover:bg-white/[0.07] hover:text-white"
                }`}
              >

                {copied ? (
                  <>
                    <Check
                      size={15}
                    />

                    Copied
                  </>
                ) : (
                  <>
                    <Copy
                      size={15}
                    />

                    Copy
                  </>
                )}

              </button>

            </section>

          )}


        {/* ===================================================
            SECURITY
        =================================================== */}

        <section className="mt-5 flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-linear-to-r from-cyan-400/5 to-blue-600/2.5 p-5">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07] text-cyan-400">

            <ShieldCheck
              size={23}
            />

          </div>


          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="text-sm font-extrabold text-slate-200">
                Secure Certificate Verification
              </h3>


              <span className="rounded-full bg-cyan-400/8 px-1.5 py-0.5 text-[7px] font-extrabold tracking-[0.7px] text-cyan-300">
                PROTECTED
              </span>

            </div>


            <p className="mt-1.5 max-w-4xl text-[11px] leading-5 text-slate-500">
              Your QR code contains a unique
              verification link connected to
              the CertiVerify system. Anyone
              who scans the code can verify
              the certificate information
              without accessing your employee
              account.
            </p>

          </div>


          <BadgeCheck
            size={28}
            className="hidden shrink-0 text-green-500/60 sm:block"
          />

        </section>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">

            <ShieldCheck
              size={16}
              className="text-cyan-500"
            />

            CertiVerify

          </div>


          <p className="text-[10px] text-slate-700">
            Secure certificate verification platform
          </p>

        </footer>

      </main>

    </div>
  );
}


// =========================================================
// CERTIFICATE DETAIL COMPONENT
// =========================================================

function CertificateDetail({
  label,
  value,
  borderRight = false,
}) {
  return (
    <div
      className={`border-b border-white/5 p-5 ${
        borderRight
          ? "sm:border-r"
          : ""
      }`}
    >

      <span className="block text-[10px] font-semibold text-slate-500">
        {label}
      </span>


      <strong className="mt-2 block truncate text-sm font-bold text-slate-200">
        {value || "-"}
      </strong>

    </div>
  );
}