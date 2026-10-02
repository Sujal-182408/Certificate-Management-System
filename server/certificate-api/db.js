
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const envPath = path.resolve(__dirname, ".env");

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error("Could not load .env:", envPath);
  throw envResult.error;
}

console.log("Loaded environment file:", envPath);
console.log("DB host:", process.env.DB_HOST);
console.log("DB port:", process.env.DB_PORT);
console.log("DB name:", process.env.DB_NAME);
console.log("DB user:", process.env.DB_USER);
console.log(
  "DB password loaded:",
  Boolean(process.env.DB_PASSWORD)
);

if (
  !process.env.DB_HOST ||
  !process.env.DB_PORT ||
  !process.env.DB_NAME ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD
) {
  throw new Error(
    "Missing database settings. Check the .env file and its location."
  );
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,
  max: 10,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

module.exports = pool;
