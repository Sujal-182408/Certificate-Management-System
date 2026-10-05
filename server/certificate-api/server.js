// ============================================================
// CERTIFICATE API SERVER
// ============================================================

const path = require("path");
const dotenv = require("dotenv");

// Load backend .env
dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const pool = require("./db");

// ============================================================
// AUTH ROUTES
// ============================================================

const {
  router: auth,
  requireAdmin,
} = require("./routes/auth");

const {
  router: employeeAuth,
  requireEmployee,
} = require("./routes/employeeAuth");

// ============================================================
// APP
// ============================================================

const app = express();

app.disable("x-powered-by");

// ============================================================
// CONFIG
// ============================================================

const PORT =
  Number(process.env.PORT) || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://192.168.1.5:5174";

// ============================================================
// COMPANY EMAIL
// ============================================================

function isCompanyEmail(email) {
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@esparksit\.com$/i.test(
    String(email || "").trim()
  );
}

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  "http://localhost:5174",
  "http://127.0.0.1:5174",

  "http://192.168.1.5:5174",

  "https://q8n7zrnv-5173.inc1.devtunnels.ms",

  CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(
        "Blocked CORS origin:",
        origin
      );

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
    ],
  })
);

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

// ============================================================
// COOKIE PARSER
// ============================================================

app.use(cookieParser());

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
  );

  next();
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  async (req, res) => {
    try {
      await pool.query("SELECT 1");

      return res.status(200).json({
        ok: true,
        message:
          "Certificate API is running.",
        database: "connected",
        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Health check database error:",
        error
      );

      return res.status(503).json({
        ok: false,
        message:
          "Certificate API is running but database is unavailable.",
        database: "disconnected",
      });
    }
  }
);

// ============================================================
// AUTH ROUTES
// ============================================================

app.use(
  "/api/auth",
  auth
);

app.use(
  "/api/employee-auth",
  employeeAuth
);

// ============================================================
// ADMIN TEST ROUTE
// ============================================================

app.get(
  "/api/admin/test",
  requireAdmin,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Admin authentication is working.",
      admin: req.admin || null,
    });
  }
);

// ============================================================
// ADMIN - GET ALL EMPLOYEES
// ============================================================

app.get(
  "/api/admin/employees",
  requireAdmin,
  async (req, res, next) => {
    try {
      const result =
        await pool.query(`
          SELECT
            id,
            name,
            email,
            is_active,
            created_at
          FROM employee_users
          ORDER BY id DESC
        `);

      return res.status(200).json({
        success: true,
        employees:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Get employees error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// ADMIN - GET SINGLE EMPLOYEE + CERTIFICATES
// ============================================================

app.get(
  "/api/admin/employees/:id",
  requireAdmin,
  async (req, res, next) => {
    try {
      const employeeId =
        String(
          req.params.id || ""
        ).trim();

      if (
        !/^\d+$/.test(employeeId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid employee ID.",
        });
      }

      const employeeResult =
        await pool.query(
          `
          SELECT
            id,
            name,
            email,
            is_active,
            created_at
          FROM employee_users
          WHERE id = $1
          LIMIT 1
          `,
          [employeeId]
        );

      if (
        employeeResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found.",
        });
      }

      const employee =
        employeeResult.rows[0];

      const certificateResult =
        await pool.query(
          `
          SELECT
            id,
            certificate_no,
            certificate_type,
            recipient_name,
            course_name,
            issuer_name,
            issue_date,
            verification_token,
            status,
            created_at,
            revoked_at,
            qr_generated_at
          FROM certificates
          WHERE employee_id = $1
          ORDER BY created_at DESC
          `,
          [employeeId]
        );

      return res.status(200).json({
        success: true,

        employee: {
          ...employee,

          certificates:
            certificateResult.rows,
        },
      });
    } catch (error) {
      console.error(
        "Get employee details error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// ADMIN - CREATE CERTIFICATE
//
// Automatically generates:
//
// EITS-CERT-2026-1001
// EITS-CERT-2026-1002
//
// EITS-INTR-2026-1001
// EITS-INTR-2026-1002
//
// Only @esparksit.com employees can receive certificates.
// ============================================================

app.post(
  "/api/admin/certificates",
  requireAdmin,
  async (req, res, next) => {
    const client =
      await pool.connect();

    try {
      const {
        certificateType,
        employeeEmail,
        courseName,
        issuerName,
        issueDate,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (
        !certificateType ||
        !employeeEmail ||
        !courseName ||
        !issuerName ||
        !issueDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Certificate type, employee email, course name, issuer name and issue date are required.",
        });
      }

      // --------------------------------------------------------
      // CLEAN VALUES
      // --------------------------------------------------------

      const cleanCertificateType =
        String(
          certificateType
        )
          .trim()
          .toUpperCase();

      const cleanEmployeeEmail =
        String(
          employeeEmail
        )
          .trim()
          .toLowerCase();

      const cleanCourseName =
        String(
          courseName
        ).trim();

      const cleanIssuerName =
        String(
          issuerName
        ).trim();

      const cleanIssueDate =
        String(
          issueDate
        ).trim();

      // --------------------------------------------------------
      // CERTIFICATE TYPE
      // --------------------------------------------------------

      if (
        !["CERT", "INTR"].includes(
          cleanCertificateType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Certificate type must be CERT or INTR.",
        });
      }

      // --------------------------------------------------------
      // EMAIL FORMAT
      // --------------------------------------------------------

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          cleanEmployeeEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid employee email.",
        });
      }

      // --------------------------------------------------------
      // COMPANY EMAIL CHECK
      // --------------------------------------------------------

      if (
        !isCompanyEmail(
          cleanEmployeeEmail
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Certificates can only be issued to employees with an @esparksit.com company email address.",
        });
      }

      // --------------------------------------------------------
      // COURSE VALIDATION
      // --------------------------------------------------------

      if (
        !cleanCourseName
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Course name is required.",
        });
      }

      if (
        cleanCourseName.length >
        200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Course name must be at most 200 characters.",
        });
      }

      // --------------------------------------------------------
      // ISSUER VALIDATION
      // --------------------------------------------------------

      if (
        !cleanIssuerName
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Issuer name is required.",
        });
      }

      if (
        cleanIssuerName.length >
        200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Issuer name must be at most 200 characters.",
        });
      }

      // --------------------------------------------------------
      // DATE VALIDATION
      // --------------------------------------------------------

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          cleanIssueDate
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Issue date must be in YYYY-MM-DD format.",
        });
      }

      // --------------------------------------------------------
      // CERTIFICATE YEAR
      // --------------------------------------------------------

      const certificateYear =
        Number(
          cleanIssueDate.slice(
            0,
            4
          )
        );

      if (
        !Number.isInteger(
          certificateYear
        ) ||
        certificateYear < 2000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid certificate year.",
        });
      }

      // --------------------------------------------------------
      // FIND EMPLOYEE
      // --------------------------------------------------------

      const employeeResult =
        await client.query(
          `
          SELECT
            id,
            name,
            email,
            is_active
          FROM employee_users
          WHERE LOWER(TRIM(email)) =
                LOWER(TRIM($1))
          LIMIT 1
          `,
          [cleanEmployeeEmail]
        );

      if (
        employeeResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "No employee account exists with this email address.",
        });
      }

      const employee =
        employeeResult.rows[0];

      // --------------------------------------------------------
      // CHECK ACTUAL DATABASE EMAIL
      // --------------------------------------------------------

      if (
        !isCompanyEmail(
          employee.email
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This employee does not have a valid eSparks company email address.",
        });
      }

      // --------------------------------------------------------
      // CHECK ACTIVE
      // --------------------------------------------------------

      if (
        !employee.is_active
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This employee account is inactive.",
        });
      }

      // --------------------------------------------------------
      // START TRANSACTION
      // --------------------------------------------------------

      await client.query(
        "BEGIN"
      );

      // --------------------------------------------------------
      // GENERATE NUMBER
      // --------------------------------------------------------

      const sequenceResult =
        await client.query(
          `
          INSERT INTO certificate_number_sequences (
            certificate_type,
            certificate_year,
            next_number
          )
          VALUES (
            $1,
            $2,
            1002
          )

          ON CONFLICT (
            certificate_type,
            certificate_year
          )

          DO UPDATE SET
            next_number =
              certificate_number_sequences.next_number + 1

          RETURNING
            next_number - 1 AS generated_number
          `,
          [
            cleanCertificateType,
            certificateYear,
          ]
        );

      if (
        sequenceResult.rows.length ===
        0
      ) {
        throw new Error(
          "Unable to generate certificate number."
        );
      }

      const certificateNumberValue =
        Number(
          sequenceResult.rows[0]
            .generated_number
        );

      if (
        !Number.isInteger(
          certificateNumberValue
        ) ||
        certificateNumberValue <
          1001
      ) {
        throw new Error(
          "Invalid generated certificate number."
        );
      }

      // --------------------------------------------------------
      // FINAL AUTOMATIC CERTIFICATE ID
      // --------------------------------------------------------

      const certificateNo =
        `EITS-${cleanCertificateType}-${certificateYear}-${certificateNumberValue}`;

      // --------------------------------------------------------
      // INSERT CERTIFICATE
      // --------------------------------------------------------

      const certificateResult =
        await client.query(
          `
          INSERT INTO certificates (
            certificate_no,
            certificate_type,
            recipient_name,
            course_name,
            issuer_name,
            issue_date,
            employee_id,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'issued'
          )
          RETURNING
            id,
            certificate_no,
            certificate_type,
            recipient_name,
            course_name,
            issuer_name,
            issue_date,
            verification_token,
            status,
            employee_id,
            created_at
          `,
          [
            certificateNo,
            cleanCertificateType,
            employee.name,
            cleanCourseName,
            cleanIssuerName,
            cleanIssueDate,
            employee.id,
          ]
        );

      const certificate =
        certificateResult.rows[0];

      // --------------------------------------------------------
      // AUDIT LOG
      // --------------------------------------------------------

      await client.query(
        `
        INSERT INTO certificate_audit_logs (
          certificate_id,
          action,
          performed_by,
          details
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [
          certificate.id,

          "CERTIFICATE_CREATED",

          req.admin?.email ||
            req.admin?.id?.toString() ||
            "admin",

          JSON.stringify({
            certificate_no:
              certificate.certificate_no,

            certificate_type:
              certificate.certificate_type,

            certificate_year:
              certificateYear,

            employee_id:
              employee.id,

            employee_email:
              employee.email,
          }),
        ]
      );

      // --------------------------------------------------------
      // COMMIT
      // --------------------------------------------------------

      await client.query(
        "COMMIT"
      );

      return res.status(201).json({
        success: true,

        message:
          "Certificate created successfully.",

        certificate: {
          ...certificate,

          employee_name:
            employee.name,

          employee_email:
            employee.email,
        },
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "Create certificate error:",
        error
      );

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Certificate number or verification token already exists.",
        });
      }

      next(error);
    } finally {
      client.release();
    }
  }
);

// ============================================================
// ADMIN - GET ALL CERTIFICATES
// ============================================================

app.get(
  "/api/admin/certificates",
  requireAdmin,
  async (req, res, next) => {
    try {
      const result =
        await pool.query(`
          SELECT
            c.id,
            c.certificate_no,
            c.certificate_type,
            c.recipient_name,
            c.course_name,
            c.issuer_name,
            c.issue_date,
            c.status,
            c.created_at,
            c.revoked_at,
            c.employee_id,

            e.name AS employee_name,
            e.email AS employee_email

          FROM certificates c

          LEFT JOIN employee_users e
            ON c.employee_id = e.id

          ORDER BY c.created_at DESC
        `);

      return res.status(200).json({
        success: true,
        certificates:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Get certificates error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// ADMIN - GET SINGLE CERTIFICATE
// ============================================================

app.get(
  "/api/admin/certificates/:id",
  requireAdmin,
  async (req, res, next) => {
    try {
      const certificateId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          certificateId
        ) ||
        certificateId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid certificate ID.",
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            c.id,
            c.certificate_no,
            c.certificate_type,
            c.recipient_name,
            c.course_name,
            c.issuer_name,
            c.issue_date,
            c.verification_token,
            c.status,
            c.created_at,
            c.revoked_at,
            c.employee_id,

            e.name AS employee_name,
            e.email AS employee_email

          FROM certificates c

          LEFT JOIN employee_users e
            ON c.employee_id = e.id

          WHERE c.id = $1

          LIMIT 1
          `,
          [certificateId]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Certificate not found.",
        });
      }

      return res.status(200).json({
        success: true,
        certificate:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Get certificate error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// ADMIN - UPDATE CERTIFICATE
//
// IMPORTANT:
// certificate_no and certificate_type are IMMUTABLE.
//
// Admin can update:
// - employee
// - recipient
// - course
// - issuer
// - issue date
//
// Certificate number remains the automatically generated ID.
// ============================================================

app.put(
  "/api/admin/certificates/:id",
  requireAdmin,
  async (req, res, next) => {
    const client =
      await pool.connect();

    try {
      const certificateId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          certificateId
        ) ||
        certificateId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid certificate ID.",
        });
      }

      const {
        recipientName,
        courseName,
        issuerName,
        issueDate,
        employeeId,
      } = req.body;

      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (
        !recipientName ||
        !courseName ||
        !issuerName ||
        !issueDate ||
        !employeeId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient name, course name, issuer name, issue date and employee are required.",
        });
      }

      // --------------------------------------------------------
      // CLEAN VALUES
      // --------------------------------------------------------

      const cleanRecipientName =
        String(
          recipientName
        ).trim();

      const cleanCourseName =
        String(
          courseName
        ).trim();

      const cleanIssuerName =
        String(
          issuerName
        ).trim();

      const cleanIssueDate =
        String(
          issueDate
        ).trim();

      const cleanEmployeeId =
        Number(
          employeeId
        );

      // --------------------------------------------------------
      // EMPLOYEE ID
      // --------------------------------------------------------

      if (
        !Number.isInteger(
          cleanEmployeeId
        ) ||
        cleanEmployeeId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid employee ID.",
        });
      }

      // --------------------------------------------------------
      // GET EXISTING CERTIFICATE
      // --------------------------------------------------------

      const existing =
        await client.query(
          `
          SELECT
            id,
            certificate_no,
            certificate_type,
            issue_date,
            employee_id
          FROM certificates
          WHERE id = $1
          LIMIT 1
          `,
          [certificateId]
        );

      if (
        existing.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Certificate not found.",
        });
      }

      const existingCertificate =
        existing.rows[0];

      // --------------------------------------------------------
      // DATE FORMAT
      // --------------------------------------------------------

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          cleanIssueDate
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Issue date must be in YYYY-MM-DD format.",
        });
      }

      // --------------------------------------------------------
      // CERTIFICATE YEAR MUST NOT CHANGE
      // --------------------------------------------------------

      const certificateIdMatch =
        /^EITS-(CERT|INTR)-(\d{4})-\d+$/.exec(
          existingCertificate.certificate_no
        );

      if (
        certificateIdMatch &&
        certificateIdMatch[2] !==
          cleanIssueDate.slice(0, 4)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The issue date year cannot be changed because it is part of the certificate number.",
        });
      }

      // --------------------------------------------------------
      // FIND EMPLOYEE
      // --------------------------------------------------------

      const employeeResult =
        await client.query(
          `
          SELECT
            id,
            name,
            email,
            is_active
          FROM employee_users
          WHERE id = $1
          LIMIT 1
          `,
          [cleanEmployeeId]
        );

      if (
        employeeResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found.",
        });
      }

      const employee =
        employeeResult.rows[0];

      // --------------------------------------------------------
      // COMPANY EMAIL CHECK
      // --------------------------------------------------------

      if (
        !isCompanyEmail(
          employee.email
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Certificates can only be assigned to employees with an @esparksit.com company email address.",
        });
      }

      // --------------------------------------------------------
      // ACTIVE CHECK
      // --------------------------------------------------------

      if (
        !employee.is_active
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Cannot assign certificate to an inactive employee.",
        });
      }

      // --------------------------------------------------------
      // RECIPIENT NAME
      // --------------------------------------------------------

      if (
        cleanRecipientName
          .toLowerCase() !==
        employee.name
          .trim()
          .toLowerCase()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient name must match the selected employee name.",
        });
      }

      // --------------------------------------------------------
      // COURSE
      // --------------------------------------------------------

      if (
        cleanCourseName.length ===
        0 ||
        cleanCourseName.length >
          200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Course name must be between 1 and 200 characters.",
        });
      }

      // --------------------------------------------------------
      // ISSUER
      // --------------------------------------------------------

      if (
        cleanIssuerName.length ===
        0 ||
        cleanIssuerName.length >
          200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Issuer name must be between 1 and 200 characters.",
        });
      }

      // --------------------------------------------------------
      // TRANSACTION
      // --------------------------------------------------------

      await client.query(
        "BEGIN"
      );

      // --------------------------------------------------------
      // UPDATE
      //
      // IMPORTANT:
      // certificate_no is NOT updated.
      // certificate_type is NOT updated.
      // --------------------------------------------------------

      const updateResult =
        await client.query(
          `
          UPDATE certificates

          SET
            recipient_name = $1,
            course_name = $2,
            issuer_name = $3,
            issue_date = $4,
            employee_id = $5

          WHERE id = $6

          RETURNING
            id,
            certificate_no,
            certificate_type,
            recipient_name,
            course_name,
            issuer_name,
            issue_date,
            verification_token,
            status,
            employee_id,
            created_at,
            revoked_at
          `,
          [
            employee.name,
            cleanCourseName,
            cleanIssuerName,
            cleanIssueDate,
            cleanEmployeeId,
            certificateId,
          ]
        );

      const certificate =
        updateResult.rows[0];

      // --------------------------------------------------------
      // AUDIT
      // --------------------------------------------------------

      await client.query(
        `
        INSERT INTO certificate_audit_logs (
          certificate_id,
          action,
          performed_by,
          details
        )

        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [
          certificateId,

          "CERTIFICATE_UPDATED",

          req.admin?.email ||
            req.admin?.id?.toString() ||
            "admin",

          JSON.stringify({
            certificate_no:
              certificate.certificate_no,

            certificate_type:
              certificate.certificate_type,

            employee_id:
              cleanEmployeeId,

            employee_email:
              employee.email,
          }),
        ]
      );

      await client.query(
        "COMMIT"
      );

      return res.status(200).json({
        success: true,

        message:
          "Certificate updated successfully.",

        certificate: {
          ...certificate,

          employee_name:
            employee.name,

          employee_email:
            employee.email,
        },
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "Update certificate error:",
        error
      );

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Certificate already exists.",
        });
      }

      next(error);
    } finally {
      client.release();
    }
  }
);

// ============================================================
// ADMIN - REVOKE CERTIFICATE
// ============================================================

app.patch(
  "/api/admin/certificates/:id/revoke",
  requireAdmin,
  async (req, res, next) => {
    const client =
      await pool.connect();

    try {
      const certificateId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          certificateId
        ) ||
        certificateId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid certificate ID.",
        });
      }

      await client.query(
        "BEGIN"
      );

      const existing =
        await client.query(
          `
          SELECT
            id,
            certificate_no,
            status
          FROM certificates
          WHERE id = $1
          FOR UPDATE
          `,
          [certificateId]
        );

      if (
        existing.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Certificate not found.",
        });
      }

      const certificate =
        existing.rows[0];

      if (
        certificate.status ===
        "revoked"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(409).json({
          success: false,
          message:
            "Certificate is already revoked.",
        });
      }

      const result =
        await client.query(
          `
          UPDATE certificates

          SET
            status = 'revoked',
            revoked_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING
            id,
            certificate_no,
            status,
            revoked_at
          `,
          [certificateId]
        );

      await client.query(
        `
        INSERT INTO certificate_audit_logs (
          certificate_id,
          action,
          performed_by,
          details
        )

        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        `,
        [
          certificateId,

          "CERTIFICATE_REVOKED",

          req.admin?.email ||
            req.admin?.id?.toString() ||
            "admin",

          JSON.stringify({
            certificate_no:
              certificate.certificate_no,
          }),
        ]
      );

      await client.query(
        "COMMIT"
      );

      return res.status(200).json({
        success: true,

        message:
          "Certificate revoked successfully.",

        certificate:
          result.rows[0],
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "Revoke certificate error:",
        error
      );

      next(error);
    } finally {
      client.release();
    }
  }
);

// ============================================================
// ADMIN - DELETE CERTIFICATE
// ============================================================

app.delete(
  "/api/admin/certificates/:id",
  requireAdmin,
  async (req, res, next) => {
    const client =
      await pool.connect();

    try {
      const certificateId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          certificateId
        ) ||
        certificateId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid certificate ID.",
        });
      }

      await client.query(
        "BEGIN"
      );

      const existing =
        await client.query(
          `
          SELECT
            id,
            certificate_no
          FROM certificates
          WHERE id = $1
          FOR UPDATE
          `,
          [certificateId]
        );

      if (
        existing.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          success: false,
          message:
            "Certificate not found.",
        });
      }

      await client.query(
        `
        DELETE FROM certificate_audit_logs
        WHERE certificate_id = $1
        `,
        [certificateId]
      );

      await client.query(
        `
        DELETE FROM certificates
        WHERE id = $1
        `,
        [certificateId]
      );

      await client.query(
        "COMMIT"
      );

      return res.status(200).json({
        success: true,
        message:
          "Certificate deleted successfully.",
        certificateId,
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      console.error(
        "Delete certificate error:",
        error
      );

      next(error);
    } finally {
      client.release();
    }
  }
);

// ============================================================
// EMPLOYEE - GET QR STATUS
// ============================================================

app.get(
  "/api/employee/qr",
  requireEmployee,
  async (req, res, next) => {
    try {
      const employeeId =
        Number(
          req.employee.id
        );

      const result =
        await pool.query(
          `
          SELECT
            c.id,
            c.certificate_no,
            c.certificate_type,
            c.recipient_name,
            c.course_name,
            c.issuer_name,
            c.issue_date,
            c.verification_token,
            c.status,
            c.qr_generated_at

          FROM certificates c

          WHERE c.employee_id = $1
            AND c.status = 'issued'

          ORDER BY c.created_at DESC

          LIMIT 1
          `,
          [employeeId]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "No issued certificate found for this employee.",
        });
      }

      const certificate =
        result.rows[0];

      let verificationUrl =
        null;

      if (
        certificate.qr_generated_at
      ) {
        verificationUrl =
          `${CLIENT_URL}/verify?token=${certificate.verification_token}`;
      }

      return res.status(200).json({
        success: true,

        qrGenerated:
          Boolean(
            certificate.qr_generated_at
          ),

        verificationUrl,

        certificate,
      });
    } catch (error) {
      console.error(
        "Get employee QR error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// EMPLOYEE - GENERATE QR
// ============================================================

app.post(
  "/api/employee/qr",
  requireEmployee,
  async (req, res, next) => {
    try {
      const employeeId =
        Number(
          req.employee.id
        );

      const result =
        await pool.query(
          `
          SELECT
            id,
            certificate_no,
            certificate_type,
            recipient_name,
            course_name,
            issuer_name,
            issue_date,
            verification_token,
            status,
            qr_generated_at

          FROM certificates

          WHERE employee_id = $1
            AND status = 'issued'

          ORDER BY created_at DESC

          LIMIT 1
          `,
          [employeeId]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "No issued certificate found for this employee.",
        });
      }

      const certificate =
        result.rows[0];

      if (
        certificate.qr_generated_at
      ) {
        const verificationUrl =
          `${CLIENT_URL}/verify?token=${certificate.verification_token}`;

        return res.status(200).json({
          success: true,
          qrGenerated: true,
          alreadyGenerated: true,
          verificationUrl,
          certificate,
        });
      }

      const updateResult =
        await pool.query(
          `
          UPDATE certificates

          SET
            qr_generated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING
            qr_generated_at
          `,
          [certificate.id]
        );

      const qrGeneratedAt =
        updateResult.rows[0]
          .qr_generated_at;

      const verificationUrl =
        `${CLIENT_URL}/verify?token=${certificate.verification_token}`;

      return res.status(200).json({
        success: true,
        qrGenerated: true,
        alreadyGenerated: false,
        verificationUrl,

        certificate: {
          ...certificate,

          qr_generated_at:
            qrGeneratedAt,
        },
      });
    } catch (error) {
      console.error(
        "Generate employee QR error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// PUBLIC VERIFICATION RATE LIMIT
// ============================================================

const verifyLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 60,

    standardHeaders:
      "draft-8",

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many verification requests. Please try again later.",
    },
  });

// ============================================================
// PUBLIC CERTIFICATE VERIFICATION
// ============================================================

app.get(
  "/api/verify/:token",
  verifyLimiter,
  async (req, res, next) => {
    try {
      const token =
        String(
          req.params.token || ""
        ).trim();

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (
        !uuidRegex.test(token)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification token.",
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            c.id,
            c.certificate_no,
            c.certificate_type,
            c.recipient_name,
            c.course_name,
            c.issuer_name,
            c.issue_date,
            c.verification_token,
            c.status,
            c.created_at,
            c.revoked_at,

            e.name AS employee_name,
            e.email AS employee_email

          FROM certificates c

          LEFT JOIN employee_users e
            ON c.employee_id = e.id

          WHERE c.verification_token = $1

          LIMIT 1
          `,
          [token]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          valid: false,
          message:
            "Certificate not found.",
        });
      }

      const certificate =
        result.rows[0];

      // --------------------------------------------------------
      // REVOKED
      // --------------------------------------------------------

      if (
        certificate.status !==
        "issued"
      ) {
        return res.status(200).json({
          success: true,
          valid: false,

          status:
            certificate.status,

          message:
            "This certificate has been revoked.",

          certificate: {
            certificate_no:
              certificate.certificate_no,

            certificate_type:
              certificate.certificate_type,

            recipient_name:
              certificate.recipient_name,

            course_name:
              certificate.course_name,

            issuer_name:
              certificate.issuer_name,

            issue_date:
              certificate.issue_date,

            verification_token:
              certificate.verification_token,

            employee_name:
              certificate.employee_name,

            employee_email:
              certificate.employee_email,

            status:
              certificate.status,

            revoked_at:
              certificate.revoked_at,
          },
        });
      }

      // --------------------------------------------------------
      // VALID
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,
        valid: true,
        status: "issued",

        message:
          "Certificate is valid.",

        certificate: {
          id:
            certificate.id,

          certificate_no:
            certificate.certificate_no,

          certificate_type:
            certificate.certificate_type,

          recipient_name:
            certificate.recipient_name,

          course_name:
            certificate.course_name,

          issuer_name:
            certificate.issuer_name,

          issue_date:
            certificate.issue_date,

          verification_token:
            certificate.verification_token,

          employee_name:
            certificate.employee_name,

          employee_email:
            certificate.employee_email,

          status:
            certificate.status,

          created_at:
            certificate.created_at,
        },
      });
    } catch (error) {
      console.error(
        "Certificate verification error:",
        error
      );

      next(error);
    }
  }
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        "Route not found.",
      path:
        req.originalUrl,
    });
  }
);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "GLOBAL ERROR:",
      error
    );

    if (
      error.message ===
      "Not allowed by CORS"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "CORS origin not allowed.",
      });
    }

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error.",
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  try {
    await pool.query(
      "SELECT 1"
    );

    console.log(
      "PostgreSQL connected successfully."
    );

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          "=========================================="
        );

        console.log(
          "Certificate API Server"
        );

        console.log(
          `Local: http://localhost:${PORT}`
        );

        console.log(
          `LAN: http://192.168.1.5:${PORT}`
        );

        console.log(
          `Client: ${CLIENT_URL}`
        );

        console.log(
          "=========================================="
        );
      }
    );
  } catch (error) {
    console.error(
      "Unable to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();

// ============================================================
// EXPORT
// ============================================================

module.exports = app;