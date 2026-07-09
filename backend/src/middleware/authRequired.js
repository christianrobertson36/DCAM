const { verifyToken } = require("../auth/tokens");
const { hasPermission } = require("../config/permissions");
const { getPool } = require("../db/pool");

async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required"
    });
  }

  try {
    const payload = verifyToken(token);
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT id, name, email, role, status, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [payload.sub]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return res.status(401).json({
        ok: false,
        error: "User not found or inactive"
      });
    }

    req.user = {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: "Invalid or expired token"
    });
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        ok: false,
        error: "You do not have permission to perform this action"
      });
    }

    return next();
  };
}

module.exports = {
  authRequired,
  requirePermission
};
