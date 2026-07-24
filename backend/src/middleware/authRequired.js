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
      SELECT u.id, u.name, u.email, u.role, u.status, u.tenant_id,
             t.name AS tenant_name, t.slug AS tenant_slug, t.status AS tenant_status
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = $1 AND u.tenant_id = $2
      LIMIT 1
      `,
      [payload.sub, payload.tenant_id]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active" || user.tenant_status !== "active") {
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
      status: user.status,
      tenant_id: user.tenant_id,
      tenant_name: user.tenant_name,
      tenant_slug: user.tenant_slug
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
