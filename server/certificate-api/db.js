const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

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

console.log("PostgreSQL configuration:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  ssl: true,
  nodeEnv: process.env.NODE_ENV,
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: {
    rejectUnauthorized: true,
  },

  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 10000,
  max: Number(process.env.DB_POOL_MAX) || 5,
});

pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error.message
  );
});

module.exports = pool;