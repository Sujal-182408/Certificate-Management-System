import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FilePenLine } from "lucide-react";
import BackButton from "../../components/BackButton";
import "./EditCertificate.css";

const API_URL = "http://localhost:5000/api";

export default function EditCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    certificateNo: "",
    recipientName: "",
    courseName: "",
    issuerName: "",
    issueDate: "",
    status: "issued",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================
     FETCH CERTIFICATE
  ========================= */

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/admin/certificates/${id}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load certificate."
          );
        }

        const certificate = data.certificate || data;

        setForm({
          certificateNo: certificate.certificate_no || "",
          recipientName: certificate.recipient_name || "",
          courseName: certificate.course_name || "",
          issuerName: certificate.issuer_name || "",
          issueDate: certificate.issue_date
            ? certificate.issue_date.substring(0, 10)
            : "",
          status: certificate.status || "issued",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  /* =========================
     HANDLE INPUT
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  /* =========================
     SAVE
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/admin/certificates/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to update certificate."
        );
      }

      setSuccess("Certificate updated successfully.");

      setTimeout(() => {
        navigate(`/admin/certificates/${id}`);
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="edit-certificate-page">
        <div className="edit-loading">
          Loading certificate...
        </div>
      </div>
    );
  }

  /* =========================
     PAGE
  ========================= */

  return (
    <div className="edit-certificate-page">

<BackButton
  text="Back to Certificates"
  to="/admin/certificates"
/>

      {/* SUCCESS */}

      {success && (
        <div className="edit-success-message">
          ✓ {success}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="edit-error-message">
          ⚠ {error}
        </div>
      )}

      {/* TOP BAR */}

      <div className="edit-certificate-topbar">

        <div className="edit-title-section">

          <div className="edit-title-icon">
            <FilePenLine size={22} />
          </div>

          <div>
            <h1>Edit Certificate</h1>

            <p>
              Update certificate information
            </p>
          </div>

        </div>

        <button
          type="button"
          className="edit-back-btn"
          onClick={() =>
            navigate("/admin/certificates")
          }
        >
          <ArrowLeft size={16} />
          Back to Certificates
        </button>

      </div>


      {/* MAIN */}

      <div className="edit-certificate-layout">

        {/* =========================
            FORM
        ========================= */}

        <div className="edit-certificate-card">

          <div className="edit-card-header">

            <h2>
              Certificate Information
            </h2>

            <p>
              Modify the information below.
            </p>

          </div>


          <form
            className="edit-certificate-form"
            onSubmit={handleSubmit}
          >

            {/* CERTIFICATE NUMBER */}

            <div className="edit-form-group">

              <label>
                Certificate Number
                <span className="required">*</span>
              </label>

              <input
                type="text"
                name="certificateNo"
                value={form.certificateNo}
                onChange={handleChange}
                required
              />

              <span className="field-help">
                Unique certificate identification number.
              </span>

            </div>


            {/* RECIPIENT */}

            <div className="edit-form-group">

              <label>
                Recipient Name
                <span className="required">*</span>
              </label>

              <input
                type="text"
                name="recipientName"
                value={form.recipientName}
                onChange={handleChange}
                required
              />

            </div>


            {/* COURSE */}

            <div className="edit-form-group">

              <label>
                Course Name
                <span className="required">*</span>
              </label>

              <input
                type="text"
                name="courseName"
                value={form.courseName}
                onChange={handleChange}
                required
              />

            </div>


            {/* ISSUER */}

            <div className="edit-form-group">

              <label>
                Issuer
                <span className="required">*</span>
              </label>

              <input
                type="text"
                name="issuerName"
                value={form.issuerName}
                onChange={handleChange}
                required
              />

            </div>


            {/* DATE */}

            <div className="edit-form-group">

              <label>
                Issue Date
              </label>

              <input
                type="date"
                name="issueDate"
                value={form.issueDate}
                onChange={handleChange}
              />

            </div>


            {/* STATUS */}

            <div className="edit-form-group">

              <label>
                Certificate Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >

                <option value="issued">
                  Issued
                </option>

                <option value="revoked">
                  Revoked
                </option>

              </select>

            </div>


            {/* FOOTER */}

            <div className="edit-form-footer">

              <div className="edit-footer-info">
                Changes will update the existing certificate.
              </div>

              <div className="edit-footer-buttons">

                <button
                  type="button"
                  className="cancel-edit-btn"
                  onClick={() =>
                    navigate("/admin/certificates")
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-edit-btn"
                  disabled={saving}
                >

                  <Save size={16} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </div>

          </form>

        </div>


        {/* =========================
            SIDEBAR
        ========================= */}

        <aside className="edit-sidebar">

          {/* PREVIEW */}

          <div className="edit-preview-card">

            <h3>
              Certificate Preview
            </h3>

            <div className="preview-certificate">

              <span className="preview-label">
                Certificate No.
              </span>

              <div className="preview-value">
                {form.certificateNo || "-"}
              </div>


              <span className="preview-label">
                Recipient
              </span>

              <div className="preview-value preview-recipient">
                {form.recipientName || "-"}
              </div>


              <span className="preview-label">
                Course
              </span>

              <div className="preview-value">
                {form.courseName || "-"}
              </div>


              <span className="preview-label">
                Issuer
              </span>

              <div className="preview-value">
                {form.issuerName || "-"}
              </div>


              <span
                className={`preview-status ${
                  form.status === "issued"
                    ? "issued"
                    : "revoked"
                }`}
              >
                {form.status}
              </span>

            </div>

          </div>


          {/* WARNING */}

          <div className="edit-warning-card">

            <h3>
              ⚠ Important
            </h3>

            <p>
              Make sure all certificate information
              is correct before saving your changes.
            </p>

          </div>

        </aside>

      </div>

    </div>
  );
}