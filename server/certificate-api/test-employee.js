require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const pool = require("./db");

async function testEmployee() {
  try {
    console.log("Database:", process.env.DB_NAME);
    console.log("Host:", process.env.DB_HOST);
    console.log("Port:", process.env.DB_PORT);
    console.log("User:", process.env.DB_USER);

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        is_active
      FROM employee_users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      LIMIT 1
      `,
      ["nsujalkant@gmail.com"]
    );

    console.log("Employee result:");
    console.log(result.rows);
  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    await pool.end();
  }
}

testEmployee();