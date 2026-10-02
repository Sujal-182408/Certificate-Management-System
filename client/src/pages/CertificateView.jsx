import { useEffect, useState } from "react";

import {
  useLocation,
  useSearchParams,
} from "react-router-dom";

import { QRCodeSVG } from "qrcode.react";

import { Loader2, ShieldCheck } from "lucide-react";

import { apiRequest } from "../services/api";

import BackButton from "../components/BackButton";

import companyLogo from "../assets/logo.png";


export default function CertificateView() {

  const [searchParams] = useSearchParams();

  const location = useLocation();

  const token = searchParams.get("token");


  const [certificate, setCertificate] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  /*
   * ============================================================
   * DETERMINE WHO IS VIEWING THE CERTIFICATE
   * ============================================================
   *
   * Admin certificate:
   * /admin/...
   *
   * Employee certificate:
   * /certificate/...
   * /verify/...
   * /dashboard/...
   *
   * If the current pathname starts with /admin,
   * the Back button goes to /admin.
   *
   * Otherwise it goes to the employee dashboard.
   */

  const isAdmin = location.pathname.startsWith("/admin");

  const dashboardPath = isAdmin
    ? "/admin"
    : "/dashboard";


  /*
   * ============================================================
   * LOAD CERTIFICATE
   * ============================================================
   */

  useEffect(() => {

    async function loadCertificate() {

      if (!token) {

        setError(
          "Certificate verification token is missing."
        );

        setLoading(false);

        return;
      }


      try {

        setLoading(true);

        setError("");


        const result = await apiRequest(
          `/verify/${encodeURIComponent(token)}`
        );


        if (!result?.certificate) {

          throw new Error(
            "Certificate information was not returned."
          );

        }


        setCertificate(result.certificate);

      } catch (err) {

        console.error(
          "Certificate error:",
          err
        );

        setError(
          err?.message ||
          "Unable to verify this certificate."
        );

      } finally {

        setLoading(false);

      }

    }


    loadCertificate();

  }, [token]);


  /*
   * ============================================================
   * VERIFICATION URL
   * ============================================================
   *
   * IMPORTANT:
   * This uses the SAME existing certificate token.
   * We are NOT generating a new UUID.
   */

  const verificationUrl = token
    ? `${window.location.origin}/verify?token=${encodeURIComponent(
        token
      )}`
    : "";


  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {

    return (

      <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center text-white">

        <Loader2
          size={45}
          className="animate-spin text-cyan-400"
        />

        <h2 className="mt-5 text-xl font-semibold">
          Loading Certificate...
        </h2>

        <p className="mt-2 text-gray-400 text-sm">
          Please wait while we verify the certificate.
        </p>

      </div>

    );

  }


  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error || !certificate) {

    return (

      <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-5 text-white text-center">

        <ShieldCheck
          size={60}
          className="text-yellow-500"
        />

        <h2 className="mt-5 text-2xl font-bold">
          Certificate Unavailable
        </h2>

        <p className="mt-3 max-w-md text-gray-400">
          {error ||
            "Certificate could not be loaded."}
        </p>


        <div className="mt-6">

          <BackButton to={dashboardPath} />

        </div>

      </div>

    );

  }


  /*
   * ============================================================
   * FORMAT ISSUE DATE
   * ============================================================
   */

  const formattedDate = certificate.issueDate
    ? new Date(
        certificate.issueDate
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )
    : "—";


  /*
   * ============================================================
   * CERTIFICATE
   * ============================================================
   */

  return (

    <div className="min-h-screen bg-[#07111f] px-3 py-6 sm:px-6 lg:px-10">


      {/* ========================================================
          BACK BUTTON
          ======================================================== */}

      <div className="mx-auto mb-5 max-w-300">

        <BackButton to={dashboardPath} />

      </div>


      {/* ========================================================
          CERTIFICATE
          ======================================================== */}

      <main className="mx-auto w-full max-w-300">

        <section
          className="
            relative
            overflow-hidden
            bg-white
            shadow-[0_30px_80px_rgba(0,0,0,0.45)]
            select-none
          "
        >


          {/* ====================================================
              OUTER GOLD BORDER
              ==================================================== */}

          <div
            className="
              m-3
              border-2
              border-[#c9a45c]
              p-5
              sm:m-4
              sm:p-8
              lg:p-10
            "
          >


            {/* ==================================================
                INNER BORDER
                ================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                inset-5
                border
                border-[#c9a45c]/40
                sm:inset-6.25
                lg:inset-7.5
              "
            />


            {/* ==================================================
                HEADER
                ================================================== */}

            <header
              className="
                relative
                z-10
                flex
                items-start
                justify-between
                gap-5
              "
            >


              {/* =================================================
                  COMPANY LOGO
                  ================================================= */}

              <div className="flex items-center gap-3 sm:gap-4">

                <img
                  src={companyLogo}
                  alt="Company Logo"
                  draggable="false"
                  className="
                    h-14
                    w-14
                    object-contain
                    sm:h-20
                    sm:w-35
                  "
                />

              </div>


              {/* =================================================
                  QR CODE
                  ================================================= */}

              <div
                className="
                  flex
                  flex-col
                  items-center
                  gap-2
                  shrink-0
                "
              >

                <div className="rounded-md bg-white p-1">

                  <QRCodeSVG
                    value={verificationUrl}
                    size={135}
                    bgColor="#ffffff"
                    fgColor="#07111f"
                    level="H"
                    includeMargin
                  />

                </div>

                <span
                  className="
                    text-[8px]
                    font-extrabold
                    tracking-[2px]
                    text-[#07111f]
                    sm:text-[10px]
                  "
                >
                  SCAN TO VERIFY
                </span>

              </div>

            </header>


            {/* ==================================================
                CENTER
                ================================================== */}

            <div
              className="
                relative
                z-10
                mx-auto
                mt-12
                max-w-4xl
                text-center
                sm:mt-16
              "
            >


              {/* =================================================
                  SMALL TITLE
                  ================================================= */}

              <p
                className="
                  text-xs
                  font-semibold
                  tracking-[4px]
                  text-[#8b6b2f]
                  sm:text-base
                  sm:tracking-[6px]
                "
              >
                CERTIFICATE
              </p>


              {/* =================================================
                  MAIN TITLE
                  ================================================= */}

              <h1
                className="
                  mt-1
                  text-4xl
                  font-extrabold
                  tracking-[2px]
                  text-[#07111f]
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                OF COMPLETION
              </h1>


              {/* =================================================
                  GOLD LINE
                  ================================================= */}

              <div className="mx-auto my-6 h-0.75 w-24 bg-[#c9a45c]" />


              {/* =================================================
                  DESCRIPTION
                  ================================================= */}

              <p className="text-sm text-gray-500 sm:text-base">
                This certificate is proudly presented to
              </p>


              {/* =================================================
                  EMPLOYEE NAME
                  ================================================= */}

              <h2
                className="
                  mt-3
                  font-serif
                  text-4xl
                  italic
                  font-semibold
                  text-[#07111f]
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                {certificate.recipientName}
              </h2>


              {/* =================================================
                  COMPLETION
                  ================================================= */}

              <p className="mt-6 text-sm text-gray-500 sm:text-base">
                for successfully completing
              </p>


              {/* =================================================
                  COURSE
                  ================================================= */}

              <h3
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-[#8b6b2f]
                  sm:text-3xl
                "
              >
                {certificate.courseName}
              </h3>


              <p
                className="
                  mx-auto
                  mt-5
                  max-w-2xl
                  text-sm
                  leading-7
                  text-gray-500
                "
              >
                This certificate recognizes the successful
                completion of the above-mentioned program.
              </p>

            </div>


            {/* ==================================================
                DETAILS
                ================================================== */}

            <div
              className="
                relative
                z-10
                mt-12
                flex
                flex-col
                items-center
                justify-between
                gap-8
                sm:mt-16
                sm:flex-row
                sm:gap-4
              "
            >


              {/* =================================================
                  CERTIFICATE NUMBER
                  ================================================= */}

              <div className="text-center sm:text-left">

                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-[1.5px]
                    text-gray-500
                  "
                >
                  Certificate No.
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-[#07111f]
                  "
                >
                  {certificate.certificateNo}
                </p>

              </div>


              {/* =================================================
                  VERIFIED SEAL
                  ================================================= */}

              <div
                className="
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-[#c9a45c]
                "
              >

                <div
                  className="
                    flex
                    h-16
                    w-16
                    flex-col
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-dashed
                    border-[#c9a45c]
                    text-[#8b6b2f]
                  "
                >

                  <ShieldCheck size={24} />

                  <span
                    className="
                      mt-0.5
                      text-[7px]
                      font-extrabold
                      tracking-[1px]
                    "
                  >
                    VERIFIED
                  </span>

                </div>

              </div>


              {/* =================================================
                  ISSUE DATE
                  ================================================= */}

              <div className="text-center sm:text-right">

                <p
                  className="
                    text-[10px]
                    uppercase
                    tracking-[1.5px]
                    text-gray-500
                  "
                >
                  Issue Date
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-[#07111f]
                  "
                >
                  {formattedDate}
                </p>

              </div>

            </div>


            {/* ==================================================
                SIGNATURE
                ================================================== */}

            <div
              className="
                relative
                z-10
                mx-auto
                mt-10
                flex
                w-52
                flex-col
                items-center
                text-center
              "
            >

              <div className="mb-2 w-44 border-t border-gray-500" />

              <p className="text-xs font-bold text-[#07111f]">
                Authorized by
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                {certificate.issuerName}
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>

  );
}