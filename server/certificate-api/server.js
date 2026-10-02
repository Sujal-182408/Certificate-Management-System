require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const pool = require("./db");

const {
  router: auth,
  requireAdmin,
} = require("./routes/auth");

const {
  router: employeeAuth,
  requireEmployee,
} = require("./routes/employeeAuth");


const app = express();

const PORT =
  process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";


// =====================================================
// STARTUP ENV CHECK
// =====================================================

console.log("======================================");
console.log("CertiVerify Certificate API");
console.log("======================================");

console.log(
  "DB host:",
  process.env.DB_HOST
);

console.log(
  "DB port:",
  process.env.DB_PORT
);

console.log(
  "DB name:",
  process.env.DB_NAME
);

console.log(
  "DB user:",
  process.env.DB_USER
);

console.log(
  "DB password loaded:",
  Boolean(process.env.DB_PASSWORD)
);

console.log(
  "CLIENT_URL:",
  CLIENT_URL
);

console.log(
  "JWT secret loaded:",
  Boolean(process.env.JWT_SECRET)
);

console.log("======================================");


// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);


// =====================================================
// SECURITY HEADERS
// =====================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);


// =====================================================
// BODY PARSERS
// =====================================================

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);


// =====================================================
// COOKIE PARSER
// =====================================================

app.use(cookieParser());


// =====================================================
// REQUEST LOGGER
// =====================================================

app.use(
  (req, res, next) => {

    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
    );

    next();

  }
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",

  async (
    req,
    res,
    next
  ) => {

    try {

      await pool.query(
        "SELECT 1"
      );

      res.json({

        ok: true,

        message:
          "Certificate API is running.",

        timestamp:
          new Date().toISOString(),

      });

    } catch (error) {

      next(error);

    }

  }
);


// =====================================================
// AUTH ROUTES
// =====================================================

app.use(
  "/api/auth",
  auth
);


app.use(
  "/api/employee-auth",
  employeeAuth
);


// =====================================================
// VERIFY RATE LIMITER
// =====================================================

const verifyLimiter =
  rateLimit({

    windowMs:
      60 * 1000,

    limit:
      60,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many verification requests. Please try again later.",
    },

  });


// =====================================================
// ADMIN TEST
// =====================================================

app.get(

  "/api/admin/test",

  requireAdmin,

  async (
    req,
    res
  ) => {

    res.json({

      ok: true,

      message:
        "Admin authentication is working.",

      admin:
        req.admin || null,

    });

  }

);


// =====================================================
// CREATE CERTIFICATE
// POST /api/admin/certificates
// =====================================================

app.post(

  "/api/admin/certificates",

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        certificateNo,
        recipientName,
        courseName,
        issuerName,
        issueDate,
        employeeId,
      } = req.body;


      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (
        !certificateNo ||
        !recipientName ||
        !courseName ||
        !issuerName ||
        !issueDate
      ) {

        return res.status(400).json({

          message:
            "Certificate number, recipient name, course name, issuer name and issue date are required.",

        });

      }


      const cleanCertificateNo =
        String(
          certificateNo
        ).trim();


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


      if (
        !cleanCertificateNo ||
        !cleanRecipientName ||
        !cleanCourseName ||
        !cleanIssuerName
      ) {

        return res.status(400).json({

          message:
            "Certificate fields cannot be empty.",

        });

      }


      // -----------------------------------------------
      // DATE VALIDATION
      // -----------------------------------------------

      const parsedDate =
        new Date(issueDate);


      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        return res.status(400).json({

          message:
            "Invalid issue date.",

        });

      }


      // -----------------------------------------------
      // DUPLICATE CERTIFICATE NUMBER
      // -----------------------------------------------

      const duplicate =
        await pool.query(

          `
          SELECT id
          FROM certificates
          WHERE certificate_no = $1
          LIMIT 1
          `,

          [
            cleanCertificateNo,
          ]

        );


      if (
        duplicate.rows.length > 0
      ) {

        return res.status(409).json({

          message:
            "A certificate with this certificate number already exists.",

        });

      }


      // -----------------------------------------------
      // EMPLOYEE VALIDATION
      // -----------------------------------------------

      let employee = null;


      if (
        employeeId !== undefined &&
        employeeId !== null &&
        String(employeeId).trim() !== ""
      ) {

        const employeeResult =
          await pool.query(

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

            [
              employeeId,
            ]

          );


        if (
          employeeResult.rows.length === 0
        ) {

          return res.status(400).json({

            message:
              "Employee not found.",

          });

        }


        employee =
          employeeResult.rows[0];


        if (
          !employee.is_active
        ) {

          return res.status(400).json({

            message:
              "Employee account is inactive.",

          });

        }


        // Recipient must match employee
        if (
          employee.name
            .trim()
            .toLowerCase() !==
          cleanRecipientName
            .toLowerCase()
        ) {

          return res.status(400).json({

            message:
              "Recipient name must match the selected employee name.",

          });

        }

      }


      // -----------------------------------------------
      // INSERT CERTIFICATE
      // -----------------------------------------------

      const result =
        await pool.query(

          `
          INSERT INTO certificates
          (
            certificate_no,
            recipient_name,
            course_name,
            issuer_name,
            issue_date,
            employee_id,
            status
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'issued'
          )

          RETURNING
            id,
            certificate_no,
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
            cleanCertificateNo,
            cleanRecipientName,
            cleanCourseName,
            cleanIssuerName,
            issueDate,
            employeeId || null,
          ]

        );


      const certificate =
        result.rows[0];


      // -----------------------------------------------
      // AUDIT LOG
      // -----------------------------------------------

      await pool.query(

        `
        INSERT INTO certificate_audit_logs
        (
          certificate_id,
          action,
          performed_by,
          details
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        `,

        [
          certificate.id,

          "CREATE_CERTIFICATE",

          req.admin?.id ||
            null,

          JSON.stringify({
            certificateNo:
              certificate.certificate_no,

            recipientName:
              certificate.recipient_name,

            employeeId:
              certificate.employee_id,
          }),

        ]

      );


      return res.status(201).json({

        message:
          "Certificate created successfully.",

        certificate,

      });

    } catch (error) {

      console.error(
        "Create certificate error:",
        error
      );

      next(error);

    }

  }

);


// =====================================================
// GET ALL CERTIFICATES
// GET /api/admin/certificates
// =====================================================

app.get(

  "/api/admin/certificates",

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await pool.query(

          `
          SELECT

            c.id,

            c.certificate_no,

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

          ORDER BY
            c.created_at DESC
          `

        );


      return res.json({

        certificates:
          result.rows,

      });

    } catch (error) {

      next(error);

    }

  }

);


// =====================================================
// GET SINGLE CERTIFICATE
// GET /api/admin/certificates/:id
// =====================================================

app.get(

  "/api/admin/certificates/:id",

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        id,
      } = req.params;


      const result =
        await pool.query(

          `
          SELECT

            c.id,

            c.certificate_no,

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

          [
            id,
          ]

        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          message:
            "Certificate not found.",

        });

      }


      return res.json({

        certificate:
          result.rows[0],

      });

    } catch (error) {

      next(error);

    }

  }

);


// =====================================================
// UPDATE CERTIFICATE
// PUT /api/admin/certificates/:id
// =====================================================

app.put(

  "/api/admin/certificates/:id",

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        id,
      } = req.params;


      const {
        certificateNo,
        recipientName,
        courseName,
        issuerName,
        issueDate,
        employeeId,
      } = req.body;


      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (
        !certificateNo ||
        !recipientName ||
        !courseName ||
        !issuerName ||
        !issueDate
      ) {

        return res.status(400).json({

          message:
            "All certificate fields are required.",

        });

      }


      const cleanCertificateNo =
        String(
          certificateNo
        ).trim();


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


      const parsedDate =
        new Date(issueDate);


      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        return res.status(400).json({

          message:
            "Invalid issue date.",

        });

      }


      // -----------------------------------------------
      // CERTIFICATE EXISTS
      // -----------------------------------------------

      const existing =
        await pool.query(

          `
          SELECT
            id,
            certificate_no,
            status
          FROM certificates
          WHERE id = $1
          LIMIT 1
          `,

          [
            id,
          ]

        );


      if (
        existing.rows.length === 0
      ) {

        return res.status(404).json({

          message:
            "Certificate not found.",

        });

      }


      // -----------------------------------------------
      // DUPLICATE NUMBER
      // -----------------------------------------------

      const duplicate =
        await pool.query(

          `
          SELECT id

          FROM certificates

          WHERE
            certificate_no = $1
            AND id <> $2

          LIMIT 1
          `,

          [
            cleanCertificateNo,
            id,
          ]

        );


      if (
        duplicate.rows.length > 0
      ) {

        return res.status(409).json({

          message:
            "Another certificate already uses this certificate number.",

        });

      }


      // -----------------------------------------------
      // EMPLOYEE VALIDATION
      // -----------------------------------------------

      if (
        employeeId !== undefined &&
        employeeId !== null &&
        String(employeeId).trim() !== ""
      ) {

        const employeeResult =
          await pool.query(

            `
            SELECT
              id,
              name,
              is_active

            FROM employee_users

            WHERE id = $1

            LIMIT 1
            `,

            [
              employeeId,
            ]

          );


        if (
          employeeResult.rows.length === 0
        ) {

          return res.status(400).json({

            message:
              "Employee not found.",

          });

        }


        const employee =
          employeeResult.rows[0];


        if (
          !employee.is_active
        ) {

          return res.status(400).json({

            message:
              "Employee account is inactive.",

          });

        }


        if (
          employee.name
            .trim()
            .toLowerCase() !==
          cleanRecipientName
            .toLowerCase()
        ) {

          return res.status(400).json({

            message:
              "Recipient name must match the selected employee name.",

          });

        }

      }


      // -----------------------------------------------
      // UPDATE
      // -----------------------------------------------

      const result =
        await pool.query(

          `
          UPDATE certificates

          SET

            certificate_no = $1,

            recipient_name = $2,

            course_name = $3,

            issuer_name = $4,

            issue_date = $5,

            employee_id = $6

          WHERE id = $7

          RETURNING

            id,

            certificate_no,

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
            cleanCertificateNo,

            cleanRecipientName,

            cleanCourseName,

            cleanIssuerName,

            issueDate,

            employeeId || null,

            id,
          ]

        );


      const certificate =
        result.rows[0];


      // -----------------------------------------------
      // AUDIT
      // -----------------------------------------------

      await pool.query(

        `
        INSERT INTO certificate_audit_logs
        (
          certificate_id,
          action,
          performed_by,
          details
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        `,

        [
          id,

          "UPDATE_CERTIFICATE",

          req.admin?.id ||
            null,

          JSON.stringify({
            certificateNo:
              certificate.certificate_no,

            recipientName:
              certificate.recipient_name,

            employeeId:
              certificate.employee_id,
          }),

        ]

      );


      return res.json({

        message:
          "Certificate updated successfully.",

        certificate,

      });

    } catch (error) {

      console.error(
        "Update certificate error:",
        error
      );

      next(error);

    }

  }

);


// =====================================================
// REVOKE CERTIFICATE
// PATCH /api/admin/certificates/:id/revoke
// =====================================================

app.patch(

  "/api/admin/certificates/:id/revoke",

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        id,
      } = req.params;


      // -----------------------------------------------
      // FIND CERTIFICATE
      // -----------------------------------------------

      const existing =
        await pool.query(

          `
          SELECT

            id,

            certificate_no,

            recipient_name,

            status

          FROM certificates

          WHERE id = $1

          LIMIT 1
          `,

          [
            id,
          ]

        );


      if (
        existing.rows.length === 0
      ) {

        return res.status(404).json({

          message:
            "Certificate not found.",

        });

      }


      const certificate =
        existing.rows[0];


      // -----------------------------------------------
      // ALREADY REVOKED
      // -----------------------------------------------

      if (
        certificate.status ===
        "revoked"
      ) {

        return res.status(400).json({

          message:
            "Certificate is already revoked.",

        });

      }


      // -----------------------------------------------
      // REVOKE
      // -----------------------------------------------

      const result =
        await pool.query(

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

            recipient_name,

            course_name,

            issuer_name,

            issue_date,

            status,

            revoked_at,

            employee_id
          `,

          [
            id,
          ]

        );


      // -----------------------------------------------
      // AUDIT
      // -----------------------------------------------

      await pool.query(

        `
        INSERT INTO certificate_audit_logs
        (
          certificate_id,
          action,
          performed_by,
          details
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        `,

        [
          id,

          "REVOKE_CERTIFICATE",

          req.admin?.id ||
            null,

          JSON.stringify({

            certificateNo:
              certificate.certificate_no,

            recipientName:
              certificate.recipient_name,

            previousStatus:
              certificate.status,

            newStatus:
              "revoked",

          }),

        ]

      );


      return res.json({

        message:
          "Certificate revoked successfully.",

        certificate:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        "Revoke certificate error:",
        error
      );

      next(error);

    }

  }

);


// =====================================================
// DELETE CERTIFICATE
// DELETE /api/admin/certificates/:id
// =====================================================

app.delete(

  "/api/admin/certificates/:id",

  requireAdmin,

  async (
    req,
    res,
    next
  ) => {

    const client =
      await pool.connect();


    try {

      const {
        id,
      } = req.params;


      await client.query(
        "BEGIN"
      );


      // -----------------------------------------------
      // FIND CERTIFICATE
      // -----------------------------------------------

      const certificateResult =
        await client.query(

          `
          SELECT

            id,

            certificate_no,

            recipient_name,

            status

          FROM certificates

          WHERE id = $1

          FOR UPDATE
          `,

          [
            id,
          ]

        );


      if (
        certificateResult.rows.length ===
        0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({

          message:
            "Certificate not found.",

        });

      }


      const certificate =
        certificateResult.rows[0];


      // -----------------------------------------------
      // AUDIT LOG
      //
      // IMPORTANT:
      // Delete audit records first if the
      // certificate table has a foreign key.
      // -----------------------------------------------

      await client.query(

        `
        INSERT INTO certificate_audit_logs
        (
          certificate_id,
          action,
          performed_by,
          details
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        `,

        [
          id,

          "DELETE_CERTIFICATE",

          req.admin?.id ||
            null,

          JSON.stringify({

            certificateNo:
              certificate.certificate_no,

            recipientName:
              certificate.recipient_name,

            previousStatus:
              certificate.status,

          }),

        ]

      );


      // -----------------------------------------------
      // DELETE AUDIT LOGS
      // -----------------------------------------------

      await client.query(

        `
        DELETE FROM certificate_audit_logs

        WHERE certificate_id = $1
        `,

        [
          id,
        ]

      );


      // -----------------------------------------------
      // DELETE CERTIFICATE
      // -----------------------------------------------

      await client.query(

        `
        DELETE FROM certificates

        WHERE id = $1
        `,

        [
          id,
        ]

      );


      await client.query(
        "COMMIT"
      );


      return res.json({

        message:
          "Certificate deleted successfully.",

      });

    } catch (error) {

      await client.query(
        "ROLLBACK"
      );


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

// =====================================================
// GET EMPLOYEE QR
// GET /api/employee/qr
// =====================================================

app.get(
  "/api/employee/qr",
  requireEmployee,
  async (req, res, next) => {
    try {
      const employeeId = req.employee?.id;

      if (!employeeId) {
        return res.status(401).json({
          message: "Employee authentication required.",
        });
      }

      const result = await pool.query(
        `
        SELECT
          id,
          certificate_no,
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

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "No issued certificate found for this employee.",
        });
      }

      const certificate = result.rows[0];

      const clientUrl =
        process.env.CLIENT_URL ||
        "http://localhost:5173";

      const verificationUrl =
        `${clientUrl}/verify?token=${certificate.verification_token}`;

      return res.json({
        qrGenerated: Boolean(certificate.qr_generated_at),
        url: certificate.qr_generated_at
          ? verificationUrl
          : null,

        certificate: {
          id: certificate.id,
          certificateNo: certificate.certificate_no,
          recipientName: certificate.recipient_name,
          courseName: certificate.course_name,
          issuerName: certificate.issuer_name,
          issueDate: certificate.issue_date,
          status: certificate.status,
        },
      });

    } catch (error) {
      console.error("GET QR ERROR:", error);
      next(error);
    }
  }
);

// =====================================================
// EMPLOYEE QR
// POST /api/employee/qr
// =====================================================

app.post(
  "/api/employee/qr",
  requireEmployee,
  async (req, res, next) => {
    try {
      const employeeId = req.employee?.id;

      if (!employeeId) {
        return res.status(401).json({
          message: "Employee authentication required.",
        });
      }

      const result = await pool.query(
        `
        SELECT
          id,
          certificate_no,
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

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "No issued certificate found for this employee.",
        });
      }

      const certificate = result.rows[0];

      const clientUrl =
        process.env.CLIENT_URL ||
        "http://localhost:5173";

      const verificationUrl =
        `${clientUrl}/verify?token=${certificate.verification_token}`;

      // ==========================================
      // QR ALREADY GENERATED
      // ==========================================

      if (certificate.qr_generated_at) {
        return res.json({
          message: "QR code already generated.",
          alreadyGenerated: true,
          url: verificationUrl,

          certificate: {
            id: certificate.id,
            certificateNo: certificate.certificate_no,
            recipientName: certificate.recipient_name,
            courseName: certificate.course_name,
            issuerName: certificate.issuer_name,
            issueDate: certificate.issue_date,
            status: certificate.status,
          },
        });
      }

      // ==========================================
      // FIRST QR GENERATION
      // ==========================================

      await pool.query(
        `
        UPDATE certificates
        SET qr_generated_at = NOW()
        WHERE id = $1
        `,
        [certificate.id]
      );

      // ==========================================
      // RESPONSE
      // ==========================================

      return res.json({
        message: "QR verification URL generated.",
        alreadyGenerated: false,
        url: verificationUrl,

        certificate: {
          id: certificate.id,
          certificateNo: certificate.certificate_no,
          recipientName: certificate.recipient_name,
          courseName: certificate.course_name,
          issuerName: certificate.issuer_name,
          issueDate: certificate.issue_date,
          status: certificate.status,
        },
      });

    } catch (error) {
      console.error(
        "QR GENERATION ERROR:",
        error
      );

      next(error);
    }
  }
);
// =====================================================
// PUBLIC CERTIFICATE VERIFICATION
// GET /api/verify/:token
// =====================================================

app.get("/api/verify/:token", async (req, res, next) => {
  try {
    const token = req.params.token;

    console.log("VERIFY TOKEN:", token);

    const result = await pool.query(
      `
      SELECT
        certificate_no,
        recipient_name,
        course_name,
        issuer_name,
        issue_date,
        status
      FROM certificates
      WHERE verification_token = $1
      LIMIT 1
      `,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        verified: false,
        message: "Certificate not found.",
      });
    }

    const certificate = result.rows[0];

    if (certificate.status !== "issued") {
      return res.status(403).json({
        verified: false,
        message: "This certificate has been revoked.",
      });
    }

    return res.json({
      verified: true,
      message: "Certificate is valid.",
      certificate: {
        certificateNo: certificate.certificate_no,
        recipientName: certificate.recipient_name,
        courseName: certificate.course_name,
        issuerName: certificate.issuer_name,
        issueDate: certificate.issue_date,
        status: certificate.status,
      },
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    next(error);
  }
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use(

  (req, res) => {

    res.status(404).json({

      message:
        "Route not found.",

      path:
        req.originalUrl,

    });

  }

);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(

  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "======================================"
    );

    console.error(
      "SERVER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "======================================"
    );


    // -----------------------------------------------
    // DUPLICATE KEY
    // -----------------------------------------------

    if (
      error.code ===
      "23505"
    ) {

      return res.status(409).json({

        message:
          "A record with the same value already exists.",

      });

    }


    // -----------------------------------------------
    // FOREIGN KEY
    // -----------------------------------------------

    if (
      error.code ===
      "23503"
    ) {

      return res.status(400).json({

        message:
          "This record cannot be changed because it is referenced by another record.",

      });

    }


    // -----------------------------------------------
    // CHECK CONSTRAINT
    // -----------------------------------------------

    if (
      error.code ===
      "23514"
    ) {

      return res.status(400).json({

        message:
          "Database validation failed.",

      });

    }


    // -----------------------------------------------
    // JSON ERROR
    // -----------------------------------------------

    if (
      error instanceof
        SyntaxError &&
      error.status === 400 &&
      "body" in error
    ) {

      return res.status(400).json({

        message:
          "Invalid JSON request body.",

      });

    }


    // -----------------------------------------------
    // DEFAULT
    // -----------------------------------------------

    return res.status(500).json({

      message:
        "Internal server error.",

      ...(process.env.NODE_ENV !==
        "production" && {

        error:
          error.message,

      }),

    });

  }

);


// =====================================================
// START SERVER
// =====================================================

async function startServer() {

  try {

    // -----------------------------------------------
    // DATABASE TEST
    // -----------------------------------------------

    await pool.query(
      "SELECT 1"
    );


    console.log(
      "Database connected successfully."
    );


    // -----------------------------------------------
    // SERVER
    // -----------------------------------------------

    app.listen(
      PORT,
      () => {

        console.log(
          "======================================"
        );

        console.log(
          `Certificate API running on http://localhost:${PORT}`
        );

        console.log(
          `Frontend URL: ${CLIENT_URL}`
        );

        console.log(
          "======================================"
        );

      }
    );

  } catch (error) {

    console.error(
      "Failed to start server."
    );

    console.error(
      error
    );

    process.exit(1);

  }

}


startServer();


// =====================================================
// EXPORT
// =====================================================

module.exports = app;