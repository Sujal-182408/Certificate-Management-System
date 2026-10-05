const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../db");

const router = express.Router();

// =====================================================
// CONFIG
// =====================================================

const ADMIN_COOKIE_NAME = "certificate_admin_session";
const ADMIN_JWT_ISSUER = "certificate-api";
const ADMIN_JWT_AUDIENCE = "certificate-admin";
const SESSION_MINUTES = 15;

// =====================================================
// ENVIRONMENT
// =====================================================

const isProduction =
  process.env.NODE_ENV === "production";

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
// TRUSTED ORIGIN
// =====================================================

function requireTrustedOrigin(req, res, next) {
  try {
    const origin = req.get("origin");

    if (!origin) {
      return next();
    }

    const trustedOrigins = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",

      "http://localhost:5174",
      "http://127.0.0.1:5174",

      "http://192.168.1.5:5174",

      "https://q8n7zrnv-5173.inc1.devtunnels.ms",
    ];

    if (process.env.CLIENT_URL) {
      const clientUrl = process.env.CLIENT_URL
        .trim()
        .replace(/\/$/, "");

      if (
        clientUrl &&
        !trustedOrigins.includes(clientUrl)
      ) {
        trustedOrigins.push(clientUrl);
      }
    }

    const normalizedOrigin = origin
      .trim()
      .replace(/\/$/, "");

    console.log(
      "🌐 Request Origin:",
      normalizedOrigin
    );

    console.log(
      "✅ Trusted Origins:",
      trustedOrigins
    );

    if (
      !trustedOrigins.includes(
        normalizedOrigin
      )
    ) {
      console.log(
        "❌ UNTRUSTED ORIGIN:",
        normalizedOrigin
      );

      return res.status(403).json({
        message: "Untrusted request origin.",
      });
    }

    console.log(
      "✅ TRUSTED ORIGIN:",
      normalizedOrigin
    );

    return next();
  } catch (error) {
    return next(error);
  }
}

// =====================================================
// ADMIN AUTH MIDDLEWARE
// =====================================================

function requireAdmin(req, res, next) {
  try {
    // =================================================
    // READ ADMIN COOKIE
    // =================================================

    const token =
      req.cookies?.[ADMIN_COOKIE_NAME];

    console.log(
      "🔐 Admin cookie present:",
      Boolean(token)
    );

    // =================================================
    // NO COOKIE
    // =================================================

    if (!token) {
      return res.status(401).json({
        message:
          "Admin authentication required.",
      });
    }

    // =================================================
    // VERIFY JWT
    // =================================================

    const decoded = jwt.verify(
      token,
      getJwtSecret(),
      {
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      }
    );

    // =================================================
    // ROLE CHECK
    // =================================================

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message:
          "Admin access required.",
      });
    }

    // =================================================
    // MAKE ADMIN AVAILABLE
    // =================================================

    req.admin = decoded;

    console.log(
      "✅ Admin authenticated:",
      decoded.email
    );

    return next();
  } catch (error) {
    console.error(
      "❌ Admin authentication error:",
      error.name,
      error.message
    );

    return res.status(401).json({
      message:
        "Invalid or expired admin session.",
    });
  }
}

// =====================================================
// ADMIN LOGIN
// POST /api/auth/login
// =====================================================

router.post(
  "/login",
  requireTrustedOrigin,
  async (req, res, next) => {
    try {
      // =================================================
      // GET LOGIN DATA
      // =================================================

      const email = String(
        req.body?.email || ""
      )
        .trim()
        .toLowerCase();

      const password =
        req.body?.password;

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !email ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      // =================================================
      // FIND ADMIN
      // =================================================

      const result = await pool.query(
        `
        SELECT
          id,
          email,
          password_hash,
          role,
          is_active
        FROM admin_users
        WHERE LOWER(email) = $1
        LIMIT 1
        `,
        [email]
      );

      // =================================================
      // ADMIN NOT FOUND
      // =================================================

      if (result.rows.length === 0) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      const admin =
        result.rows[0];

      // =================================================
      // ACTIVE CHECK
      // =================================================

      if (!admin.is_active) {
        return res.status(403).json({
          message:
            "Admin account is inactive.",
        });
      }

      // =================================================
      // ROLE CHECK
      // =================================================

      if (admin.role !== "admin") {
        return res.status(403).json({
          message:
            "Admin access denied.",
        });
      }

      // =================================================
      // PASSWORD HASH CHECK
      // =================================================

      if (
        !admin.password_hash ||
        typeof admin.password_hash !== "string"
      ) {
        console.error(
          "Admin password hash is missing."
        );

        return res.status(500).json({
          message:
            "Admin password is not configured.",
        });
      }

      // =================================================
      // PASSWORD CHECK
      // =================================================

      const passwordMatch =
        await bcrypt.compare(
          password,
          admin.password_hash
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid email or password.",
        });
      }

      // =================================================
      // CREATE JWT
      // =================================================

      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        getJwtSecret(),
        {
          expiresIn: `${SESSION_MINUTES}m`,
          issuer: ADMIN_JWT_ISSUER,
          audience: ADMIN_JWT_AUDIENCE,
        }
      );

      // =================================================
      // UPDATE LAST LOGIN
      // =================================================

      await pool.query(
        `
        UPDATE admin_users
        SET
          last_login_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [admin.id]
      );

      // =================================================
      // ADMIN SESSION COOKIE
      // =================================================

      res.cookie(
        ADMIN_COOKIE_NAME,
        token,
        {
          httpOnly: true,

          // HTTP localhost/LAN
          secure: isProduction,

          // Same-origin through Vite proxy
          sameSite: isProduction
            ? "none"
            : "lax",

          path: "/",

          maxAge:
            SESSION_MINUTES *
            60 *
            1000,
        }
      );

      console.log(
        "✅ Admin login successful:",
        admin.email
      );

      // =================================================
      // SUCCESS
      // =================================================

      return res.json({
        message:
          "Admin login successful.",

        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error(
        "❌ Admin login error:",
        error
      );

      return next(error);
    }
  }
);

// =====================================================
// ADMIN ME
// GET /api/auth/me
// =====================================================

router.get(
  "/me",
  requireAdmin,
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          email,
          role,
          is_active,
          created_at,
          last_login_at
        FROM admin_users
        WHERE id = $1
        LIMIT 1
        `,
        [req.admin.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          message:
            "Admin account not found.",
        });
      }

      const admin =
        result.rows[0];

      if (!admin.is_active) {
        return res.status(403).json({
          message:
            "Admin account is inactive.",
        });
      }

      return res.json({
        admin,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// =====================================================
// ADMIN LOGOUT
// POST /api/auth/logout
// =====================================================

router.post(
  "/logout",
  requireTrustedOrigin,
  (req, res) => {
    res.clearCookie(
      ADMIN_COOKIE_NAME,
      {
        httpOnly: true,

        secure: isProduction,

        sameSite: isProduction
          ? "none"
          : "lax",

        path: "/",
      }
    );

    return res.json({
      message:
        "Admin logout successful.",
    });
  }
);

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  router,
  requireAdmin,
  requireTrustedOrigin,
};