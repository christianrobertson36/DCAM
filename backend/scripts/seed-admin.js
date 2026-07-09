const bcrypt = require("bcryptjs");

const { getPool } = require("../src/db/pool");
const { ROLES } = require("../src/config/roles");

async function seedAdmin() {
  const pool = getPool();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@dcam.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.SEED_ADMIN_NAME || "DCAM Super Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES ($1, $2, $3, $4, 'active')
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      status = 'active',
      updated_at = NOW()
    `,
    [name, email.toLowerCase(), passwordHash, ROLES.SUPER_ADMIN]
  );

  console.log("Seed admin ready:", email);
  await pool.end();
}

seedAdmin().catch((err) => {
  console.error("Seed admin failed:", err);
  process.exit(1);
});
