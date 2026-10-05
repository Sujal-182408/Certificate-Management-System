const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const pool = require("../db");

const isProduction =
  process.env.NODE_ENV === "production";

const {
  requireTrustedOrigin,
} = require("./auth");

const router = express.Router();

// =====================================================
// CONFIG
// =====================================================

const COOKIE_NAME =
  "certificate_employee_session";

const JWT_ISSUER =
  "certificate-api";

const JWT_AUDIENCE =
  "certificate-employee";

const SESSION_MINUTES = 15;

// =====================================================
// LOGIN RATE LIMIT
// =====================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// REGISTER RATE LIMIT
// =====================================================

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// JWT SECRET
// =====================================================

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (
    !secret ||
    Buffer.byteLength(secret, "utf8") < 64
  ) {
    throw new Error(
      "JWT_SECRET must be at least 64 bytes."
    );
  }

  return secret;
}

// =====================================================
// EMAIL NORMALIZATION
// =====================================================

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

// =====================================================
// COMPANY EMAIL VALIDATION
// =====================================================
//
// Only emails ending with @esparksit.com are allowed.
//
// Examples:
//
// ✅ nsujalkant@gmail.com
//
//
// ❌ sujal@gmail.com
// ❌ user@esparksit.in
// ❌ user@esparksit.com.fake.com
//
// =====================================================

function isCompanyEmail(email) {
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@esparksit\.com$/i.test(
    email
  );
}

// =====================================================
// PUBLIC EMPLOYEE
// =====================================================

function publicEmployee(employee) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: "employee",
  };
}

// =====================================================
// SET SESSION COOKIE
// =====================================================

function setSessionCookie(res, employee) {
  const token = jwt.sign(
    {
      sub: String(employee.id),
      role: "employee",
    },
    getJwtSecret(),
    {
      expiresIn: `${SESSION_MINUTES}m`,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );

  res.cookie(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,

      secure:
        isProduction,

      sameSite:
        isProduction
          ? "none"
          : "lax",

      path: "/",

      maxAge:
        SESSION_MINUTES *
        60 *
        1000,
    }
  );
}

// =====================================================
// CLEAR SESSION
// =====================================================

function clearSessionCookie(res) {
  res.clearCookie(
    COOKIE_NAME,
    {
      httpOnly: true,

      secure:
        isProduction,

      sameSite:
        isProduction
          ? "none"
          : "lax",

      path: "/",
    }
  );
}

// =====================================================
// PASSWORD VALIDATION
// =====================================================

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 10 &&
    Buffer.byteLength(
      password,
      "utf8"
    ) <= 72
  );
}

// =====================================================
// REGISTER
// POST /api/employee-auth/register
// =====================================================

router.post(
  "/register",
  registerLimiter,
  requireTrustedOrigin,
  async (req, res, next) => {
    try {
      // ---------------------------------------------
      // NAME
      // ---------------------------------------------

      const name =
        typeof req.body?.name === "string"
          ? req.body.name.trim()
          : "";

      // ---------------------------------------------
      // EMAIL
      // ---------------------------------------------

      const email =
        normalizeEmail(
          req.body?.email
        );

      // ---------------------------------------------
      // PASSWORD
      // ---------------------------------------------

      const password =
        req.body?.password;

      // ---------------------------------------------
      // NAME VALIDATION
      // ---------------------------------------------

      if (
        !name ||
        name.length > 100
      ) {
        return res.status(400).json({
          message:
            "Name is required and must be at most 100 characters.",
        });
      }

      // ---------------------------------------------
      // BASIC EMAIL VALIDATION
      // ---------------------------------------------

      if (
        !email ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+$/.test(
          email
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid email address.",
        });
      }

      // ---------------------------------------------
      // COMPANY EMAIL VALIDATION
      // ---------------------------------------------

      if (
        !isCompanyEmail(email)
      ) {
        return res.status(403).json({
          message:
            "Only eSparks IT Solutions company email addresses are allowed.",
        });
      }

      // ---------------------------------------------
      // PASSWORD VALIDATION
      // ---------------------------------------------

      if (
        !validPassword(password)
      ) {
        return res.status(400).json({
          message:
            "Password must be at least 10 characters and no more than 72 UTF-8 bytes.",
        });
      }

      // ---------------------------------------------
      // HASH PASSWORD
      // ---------------------------------------------

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      // ---------------------------------------------
      // INSERT EMPLOYEE
      // ---------------------------------------------

      const result =
        await pool.query(
          `
          INSERT INTO employee_users
          (
            name,
            email,
            password_hash
          )
          VALUES
          (
            $1,
            $2,
            $3
          )
          RETURNING
            id,
            name,
            email
          `,
          [
            name,
            email,
            passwordHash,
          ]
        );

      const employee =
        result.rows[0];

      // ---------------------------------------------
      // CREATE SESSION
      // ---------------------------------------------

      setSessionCookie(
        res,
        employee
      );

      // ---------------------------------------------
      // RESPONSE
      // ---------------------------------------------

      return res.status(201).json({
        message:
          "Employee registered successfully.",

        employee:
          publicEmployee(
            employee
          ),
      });

    } catch (error) {

      // ---------------------------------------------
      // DUPLICATE EMAIL
      // ---------------------------------------------

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          message:
            "An account with this email already exists.",
        });
      }

      return next(error);
    }
  }
);

// =====================================================
// LOGIN
// POST /api/employee-auth/login
// =====================================================

router.post(
  "/login",
  loginLimiter,
  requireTrustedOrigin,
  async (req, res, next) => {
    try {
      // ---------------------------------------------
      // EMAIL
      // ---------------------------------------------

      const email =
        normalizeEmail(
          req.body?.email
        );

      // ---------------------------------------------
      // PASSWORD
      // ---------------------------------------------

      const password =
        req.body?.password;

      // ---------------------------------------------
      // BASIC VALIDATION
      // ---------------------------------------------

      if (
        !email ||
        typeof password !==
          "string"
      ) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      // ---------------------------------------------
      // FIND EMPLOYEE
      // ---------------------------------------------

      const result =
        await pool.query(
          `
          SELECT
            id,
            name,
            email,
            password_hash,
            is_active
          FROM employee_users
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [email]
        );

      const employee =
        result.rows[0];

      // ---------------------------------------------
      // VERIFY LOGIN
      // ---------------------------------------------

      if (
        !employee ||
        !employee.is_active ||
        !(
          await bcrypt.compare(
            password,
            employee.password_hash
          )
        )
      ) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      // ---------------------------------------------
      // UPDATE LAST LOGIN
      // ---------------------------------------------

      await pool.query(
        `
        UPDATE employee_users
        SET
          last_login_at =
            CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [employee.id]
      );

      // ---------------------------------------------
      // CREATE SESSION COOKIE
      // ---------------------------------------------

      setSessionCookie(
        res,
        employee
      );

      // ---------------------------------------------
      // RESPONSE
      // ---------------------------------------------

      return res.json({
        message:
          "Employee login successful.",

        employee:
          publicEmployee(
            employee
          ),
      });

    } catch (error) {
      return next(error);
    }
  }
);

// =====================================================
// ME
// GET /api/employee-auth/me
// =====================================================

router.get(
  "/me",
  async (req, res, next) => {
    try {
      // ---------------------------------------------
      // READ COOKIE
      // ---------------------------------------------

      const token =
        req.cookies?.[
          COOKIE_NAME
        ];

      // ---------------------------------------------
      // NO COOKIE
      // ---------------------------------------------

      if (!token) {
        return res.status(401).json({
          message:
            "Employee session not found.",
        });
      }

      // ---------------------------------------------
      // VERIFY JWT
      // ---------------------------------------------

      let payload;

      try {
        payload =
          jwt.verify(
            token,
            getJwtSecret(),
            {
              issuer:
                JWT_ISSUER,
              audience:
                JWT_AUDIENCE,
            }
          );
      } catch {
        clearSessionCookie(
          res
        );

        return res.status(401).json({
          message:
            "Employee session is invalid or expired.",
        });
      }

      // ---------------------------------------------
      // VERIFY ROLE
      // ---------------------------------------------

      if (
        payload.role !==
          "employee" ||
        !payload.sub
      ) {
        clearSessionCookie(
          res
        );

        return res.status(401).json({
          message:
            "Invalid employee session.",
        });
      }

      // ---------------------------------------------
      // FIND ACTIVE EMPLOYEE
      // ---------------------------------------------

      const result =
        await pool.query(
          `
          SELECT
            id,
            name,
            email
          FROM employee_users
          WHERE
            id = $1
            AND is_active = TRUE
          LIMIT 1
          `,
          [payload.sub]
        );

      // ---------------------------------------------
      // EMPLOYEE NOT FOUND
      // ---------------------------------------------

      if (
        result.rows.length ===
        0
      ) {
        clearSessionCookie(
          res
        );

        return res.status(401).json({
          message:
            "Employee account is inactive or no longer exists.",
        });
      }

      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      return res.json({
        employee:
          publicEmployee(
            result.rows[0]
          ),
      });

    } catch (error) {
      return next(error);
    }
  }
);

// =====================================================
// LOGOUT
// POST /api/employee-auth/logout
// =====================================================

router.post(
  "/logout",
  requireTrustedOrigin,
  (req, res) => {
    clearSessionCookie(
      res
    );

    return res.json({
      message:
        "Employee logged out successfully.",
    });
  }
);

// =====================================================
// REQUIRE EMPLOYEE
// =====================================================

async function requireEmployee(
  req,
  res,
  next
) {
  try {
    // ---------------------------------------------
    // READ COOKIE
    // ---------------------------------------------

    const token =
      req.cookies?.[
        COOKIE_NAME
      ];

    // ---------------------------------------------
    // NO COOKIE
    // ---------------------------------------------

    if (!token) {
      return res.status(401).json({
        message:
          "Employee authentication required.",
      });
    }

    // ---------------------------------------------
    // VERIFY JWT
    // ---------------------------------------------

    let payload;

    try {
      payload =
        jwt.verify(
          token,
          getJwtSecret(),
          {
            issuer:
              JWT_ISSUER,
            audience:
              JWT_AUDIENCE,
          }
        );
    } catch {
      clearSessionCookie(
        res
      );

      return res.status(401).json({
        message:
          "Invalid or expired employee session.",
      });
    }

    // ---------------------------------------------
    // VERIFY ROLE
    // ---------------------------------------------

    if (
      payload.role !==
        "employee" ||
      !payload.sub
    ) {
      return res.status(403).json({
        message:
          "Employee access only.",
      });
    }

    // ---------------------------------------------
    // FIND ACTIVE EMPLOYEE
    // ---------------------------------------------

    const result =
      await pool.query(
        `
        SELECT
          id,
          name,
          email
        FROM employee_users
        WHERE
          id = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [payload.sub]
      );

    // ---------------------------------------------
    // EMPLOYEE NOT FOUND
    // ---------------------------------------------

    if (
      result.rows.length ===
      0
    ) {
      clearSessionCookie(
        res
      );

      return res.status(401).json({
        message:
          "Employee account is inactive or no longer exists.",
      });
    }

    // ---------------------------------------------
    // ATTACH EMPLOYEE
    // ---------------------------------------------

    req.employee =
      publicEmployee(
        result.rows[0]
      );

    return next();

  } catch (error) {
    return next(error);
  }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  router,
  requireEmployee,
};