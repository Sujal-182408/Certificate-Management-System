const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

// Load local .env only during local development.
// Vercel provides environment variables automatically.
if (process.env.NODE_ENV !== "production") {
  const envPath = path.resolve(__dirname, ".env");

  const envResult = dotenv.config({
    path: envPath,
  });

  if (envResult.error) {
    console.error("Could not load .env:", envPath);
    throw envResult.error;
  }

  console.log("Loaded environment file:", envPath);
}

// Required database variables
const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing database environment variables: ${missingVariables.join(", ")}`
  );
}

// PostgreSQL configuration
const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Required for Neon PostgreSQL
  ssl: {
    rejectUnauthorized: true,
  },

  // Connection settings
  connectionTimeoutMillis: 15000,
  max: Number(process.env.DB_POOL_MAX) || 5,
  idleTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

// Handle unexpected PostgreSQL pool errors
pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error.message
  );
});

module.exports = pool;