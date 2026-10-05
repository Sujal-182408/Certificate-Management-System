import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Loader2,
} from "lucide-react";

import { apiRequest } from "../../services/api";
import companyLogo from "../../assets/logo.png";
import Stamp from "../../assets/sign.png";
import "../../pages/CertificateView.css";

// ============================================================
// NORMALIZE BACKEND CERTIFICATE DATA
// ============================================================

function normalizeCertificate(raw = {}) {
  return {
    id: raw.id ?? null,

    recipientName:
      raw.recipientName ||
      raw.recipient_name ||
      raw.employeeName ||
      raw.employee_name ||
      "",

    courseName:
      raw.courseName ||
      raw.course_name ||
      "",

    certificateNo:
      raw.certificateNo ||
      raw.certificate_no ||
      "",

    issueDate:
      raw.issueDate ||
      raw.issue_date ||
      "",

    issuerName:
      raw.issuerName ||
      raw.issuer_name ||
      "",

    verificationToken:
      raw.verificationToken ||
      raw.verification_token ||
      "",

    status:
      raw.status ||
      "",

    certificateType:
      raw.certificateType ||
      raw.certificate_type ||
      "CERT",

    createdAt:
      raw.createdAt ||
      raw.created_at ||
      "",

    revokedAt:
      raw.revokedAt ||
      raw.revoked_at ||
      "",
  };
}

// ============================================================
// TITLE CASE
// ============================================================

function toTitleCase(value = "") {
  return value
    .toLowerCase()
    .replace(
      /(^|[\s'-])([a-z])/g,
      (_, separator, letter) =>
        `${separator}${letter.toUpperCase()}`
    );
}

// ============================================================
// DATE FORMATTER
// ============================================================

function formatCertificateDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ============================================================
// ADMIN CERTIFICATE VIEW
// ============================================================

const ViewCertificate = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================================
  // VERIFICATION URL
  // ==========================================================

  const verificationUrl = useMemo(() => {
    if (!certificate?.verificationToken) {
      return "";
    }

    return `${window.location.origin}/verify?token=${encodeURIComponent(
      certificate.verificationToken
    )}`;
  }, [certificate?.verificationToken]);

  // ==========================================================
  // LOAD CERTIFICATE
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadCertificate() {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error(
            "Certificate ID is missing."
          );
        }

        const data = await apiRequest(
          `/admin/certificates/${encodeURIComponent(id)}`
        );

        if (!mounted) {
          return;
        }

        const normalized = normalizeCertificate(
          data?.certificate
        );

        if (!normalized.id) {
          throw new Error(
            "Certificate information could not be found."
          );
        }

        setCertificate(normalized);
      } catch (err) {
        console.error(
          "Admin certificate loading error:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err?.message ||
            "Unable to load this certificate."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCertificate();

    return () => {
      mounted = false;
    };
  }, [id]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="certificate-state-page">
        <div className="certificate-state-card">
          <Loader2
            className="certificate-state-icon spin"
            size={42}
          />

          <h2>
            Loading Certificate
          </h2>

          <p>
            Please wait while the certificate
            details are loaded.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !certificate) {
    return (
      <div className="certificate-state-page">
        <div className="certificate-state-card certificate-error-card">
          <AlertCircle
            className="certificate-state-icon error-icon"
            size={46}
          />

          <h2>
            Certificate Unavailable
          </h2>

          <p>
            {error ||
              "The requested certificate could not be found."}
          </p>

          <button
            type="button"
            className="certificate-back-button"
            onClick={() =>
              navigate("/admin/certificates")
            }
          >
            <ArrowLeft size={18} />

            Back to Certificates
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CERTIFICATE DATA
  // ==========================================================

  const recipientName =
    certificate.recipientName ||
    "Certificate Recipient";

  const courseName =
    certificate.courseName ||
    "Completed Program";

  const certificateNo =
    certificate.certificateNo ||
    "N/A";

  const issuerName =
    certificate.issuerName ||
    "eSparks IT Solutions";

  const issueDate =
    formatCertificateDate(
      certificate.issueDate
    ) || "N/A";

  const status =
    certificate.status?.toLowerCase() ||
    "issued";

  const isIssued =
    status === "issued";

  // ==========================================================
  // CERTIFICATE
  // ==========================================================

  return (
    <div className="certificate-page">

      {/* =====================================================
          ADMIN ACTION BAR
      ====================================================== */}

      <div className="certificate-actions no-print">

        <button
          type="button"
          className="certificate-dashboard-button"
          onClick={() =>
            navigate("/admin/certificates")
          }
        >
          <ArrowLeft size={17} />

          Back to Certificates
        </button>

        <div className="certificate-admin-actions">

          <button
            type="button"
            className="certificate-edit-button"
            onClick={() =>
              navigate(
                `/admin/certificates/${id}/edit`
              )
            }
          >
            <Edit3 size={17} />

            Edit Certificate
          </button>

          <div className="certificate-verification-status">

            {isIssued ? (
              <>
                <CheckCircle2 size={17} />

                Certificate Verified
              </>
            ) : (
              <>
                <AlertCircle size={17} />

                Certificate Revoked
              </>
            )}

          </div>

        </div>
      </div>

      {/* =====================================================
          CERTIFICATE WRAPPER
      ====================================================== */}

      <div className="certificate-wrapper">

        <div
          className={`certificate-document ${
            isIssued
              ? ""
              : "certificate-document-revoked"
          }`}
        >

          {/* =================================================
              WATERMARK
          ================================================== */}

          <div className="certificate-watermark">
            eSPARKS
          </div>

          <div className="certificate-watermark-sub">
            CERTIFICATE • VERIFIED
          </div>

          {/* =================================================
              DECORATIVE CORNERS
          ================================================== */}

          <div className="certificate-corner certificate-corner-tl">
            <span></span>
          </div>

          <div className="certificate-corner certificate-corner-tr">
            <span></span>
          </div>

          <div className="certificate-corner certificate-corner-bl">
            <span></span>
          </div>

          <div className="certificate-corner certificate-corner-br">
            <span></span>
          </div>

          {/* =================================================
              GOLD RIBBONS
          ================================================== */}

          <div className="certificate-ribbon certificate-ribbon-tl"></div>

          <div className="certificate-ribbon certificate-ribbon-br"></div>

          {/* =================================================
              BORDERS
          ================================================== */}

          <div className="certificate-outer-border"></div>

          <div className="certificate-gold-border"></div>

          <div className="certificate-inner-border"></div>

          {/* =================================================
              SECURITY PATTERN
          ================================================== */}

          <div className="certificate-security-pattern">
            <span>eSparks</span>
            <span>eSparks</span>
            <span>eSparks</span>
            <span>eSparks</span>
            <span>eSparks</span>
            <span>eSparks</span>
          </div>

          {/* =================================================
              HEADER
          ================================================== */}

          <header className="certificate-header">

            {/* COMPANY BRAND */}

            <div className="certificate-brand">

              <img
                src={companyLogo}
                alt="eSparks IT Solutions"
                className="certificate-logo "
              />

             
            </div>

            {/* QR CODE */}

            <div className="certificate-qr-section">

              {verificationUrl ? (
                <>
                  <div className="certificate-qr-box">

                    <QRCodeSVG
                      value={verificationUrl}
                      size={112}
                      bgColor="#ffffff"
                      fgColor="#09284f"
                      level="H"
                      includeMargin={false}
                    />

                  </div>

                  <div className="certificate-qr-title">
                    SCAN TO VERIFY
                  </div>

                  <div className="certificate-qr-subtitle">
                    Certificate authenticity
                  </div>
                </>
              ) : (
                <>
                  <div className="certificate-qr-box certificate-qr-unavailable">

                    <AlertCircle size={28} />

                    <span>
                      QR unavailable
                    </span>

                  </div>

                  <div className="certificate-qr-title">
                    VERIFICATION UNAVAILABLE
                  </div>
                </>
              )}

            </div>

          </header>

          {/* =================================================
              TITLE
          ================================================== */}

          <section className="certificate-title-section">

            <p className="certificate-title-small">
              CERTIFICATE OF
            </p>

            <h1>
              COMPLETION
            </h1>

            <div className="certificate-title-decoration">

              <span></span>

              <i>
                ◆
              </i>

              <span></span>

            </div>

          </section>

          {/* =================================================
              MAIN CONTENT
          ================================================== */}

          <main className="certificate-main-content">

            <p className="certificate-presented">
              This certificate is proudly presented to
            </p>

            <h2 className="certificate-recipient">
              {toTitleCase(recipientName)}
            </h2>

            <div className="certificate-recipient-line"></div>

            <p className="certificate-completion">
              for successfully completing the
            </p>

            <h3 className="certificate-course">
              {courseName}
            </h3>

            <p className="certificate-description">
              This certificate recognizes the successful
              completion of the program and acknowledges
              the dedication, effort and commitment
              demonstrated by the recipient.
            </p>

          </main>

          {/* =================================================
              SIDE DECORATIONS
          ================================================== */}

          <div className="certificate-side-decoration certificate-side-left">

            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>

          </div>

          <div className="certificate-side-decoration certificate-side-right">

            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>

          </div>

          {/* =================================================
              BOTTOM SECTION
          ================================================== */}

          <section className="certificate-bottom">

            {/* DATE OF ISSUE */}

            <div className="certificate-bottom-item">

              <div className="certificate-bottom-icon">
                ◫
              </div>

              <div className="certificate-bottom-label">
                DATE OF ISSUE
              </div>

              <div className="certificate-bottom-value">
                {issueDate}
              </div>

              <div className="certificate-bottom-line"></div>

            </div>

            {/* CERTIFICATE NUMBER */}

            <div className="certificate-bottom-item">

              <div className="certificate-bottom-icon">
                ▤
              </div>

              <div className="certificate-bottom-label">
                CERTIFICATE NO.
              </div>

              <div className="certificate-bottom-value certificate-number">
                {certificateNo}
              </div>

              <div className="certificate-bottom-line"></div>

            </div>

            {/* SEAL */}

            <div className="certificate-seal-wrapper">

              <div className="certificate-seal">

                <div className="certificate-seal-inner">

                  <div className="seal-stars">
                    ★ ★ ★
                  </div>

                  <div className="seal-logo">
                    e
                  </div>

                  <strong>
                    eSPARKS
                  </strong>

                  <small>
                    IT SOLUTIONS
                  </small>

                  <div className="seal-certified">
                    CERTIFIED
                  </div>

                  <div className="seal-stars-bottom">
                    ★ ★ ★
                  </div>

                </div>

              </div>

              <div className="seal-ribbon">
                <span></span>
                <span></span>
              </div>

            </div>

            {/* AUTHORIZED SIGNATURE */}

            <div className="certificate-signature">

           
              <img
                src={Stamp}
                alt="eSparks IT Solutions"
                className="certificate-logo "
              />

              <div className="signature-line"></div>

              <div className="signature-title">
                Authorized Signatory
              </div>

              <div className="signature-company">
                {issuerName}
              </div>

            </div>

          </section>

          {/* =================================================
              FOOTER
          ================================================== */}

          <footer className="certificate-footer">

            <div className="certificate-footer-icon">
              ✓
            </div>

            <div className="certificate-footer-content">

              <strong>
                Digitally Verifiable Certificate
              </strong>

              <span>
                Scan the QR code to verify authenticity.
              </span>

            </div>

            <div className="certificate-footer-number">
              {certificateNo}
            </div>

          </footer>

          {/* =================================================
              REVOKED OVERLAY
          ================================================== */}

          {!isIssued && (
            <div className="certificate-revoked-overlay">

              <div className="certificate-revoked-badge">

                <AlertCircle size={22} />

                CERTIFICATE REVOKED

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ViewCertificate;