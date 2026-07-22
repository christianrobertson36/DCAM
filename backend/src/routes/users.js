const express = require("express");
const bcrypt = require("bcryptjs");

const { getPool } = require("../db/pool");
const { PERMISSIONS, getPermissionsForRole } = require("../config/permissions");
const { ROLES } = require("../config/roles");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const VALID_ROLES = Object.values(ROLES);
const VALID_STATUSES = ["active", "inactive"];

router.use(authRequired);

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function publicAdminUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    permissions: getPermissionsForRole(row.role),
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function countActiveSuperAdmins(pool, excludedId = null) {
  const values = [ROLES.SUPER_ADMIN];
  let excludedSql = "";

  if (excludedId) {
    values.push(excludedId);
    excludedSql = "AND id <> $2";
  }

  const result = await pool.query(
    `SELECT COUNT(*)::INT AS count FROM users WHERE role = $1 AND status = 'active' ${excludedSql}`,
    values
  );

  return result.rows[0].count;
}

router.get("/roles", requirePermission(PERMISSIONS.ROLES_VIEW), (req, res) => {
  return res.json({
    ok: true,
    roles: VALID_ROLES.map((role) => ({
      role,
      permissions: getPermissionsForRole(role)
    }))
  });
});

router.get("/", requirePermission(PERMISSIONS.USERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const role = cleanText(req.query.role);
    const status = cleanText(req.query.status);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length})`);
    }

    if (role && VALID_ROLES.includes(role)) {
      values.push(role);
      where.push(`role = $${values.length}`);
    }

    if (status && VALID_STATUSES.includes(status)) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    const result = await pool.query(
      `
      SELECT id, name, email, role, status, last_login_at, created_at, updated_at
      FROM users
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY status ASC, name ASC, id ASC
      LIMIT 500
      `,
      values
    );

    return res.json({ ok: true, users: result.rows.map(publicAdminUser) });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id/audit", requirePermission(PERMISSIONS.USERS_VIEW), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ ok: false, error: "Invalid user ID" });
    }

    const result = await getPool().query(
      `
      SELECT ae.id, ae.action, ae.metadata, ae.created_at,
             actor.name AS actor_name, actor.email AS actor_email
      FROM audit_events ae
      LEFT JOIN users actor ON actor.id = ae.actor_user_id
      WHERE ae.entity_type = 'user' AND ae.entity_id = $1
      ORDER BY ae.created_at DESC, ae.id DESC
      LIMIT 100
      `,
      [id]
    );

    return res.json({ ok: true, events: result.rows });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res, next) => {
  try {
    const pool = getPool();
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email)?.toLowerCase();
    const password = String(req.body.password || "");
    const role = cleanText(req.body.role);
    const status = cleanText(req.body.status) || "active";

    if (!name || !email || !email.includes("@")) {
      return res.status(400).json({ ok: false, error: "A valid name and email are required" });
    }

    if (password.length < 12) {
      return res.status(400).json({ ok: false, error: "Temporary password must be at least 12 characters" });
    }

    if (!VALID_ROLES.includes(role) || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid role or status" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, status, last_login_at, created_at, updated_at
      `,
      [name, email, passwordHash, role, status]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "user.created",
      entityType: "user",
      entityId: result.rows[0].id,
      metadata: { name, email, role, status }
    });

    return res.status(201).json({ ok: true, user: publicAdminUser(result.rows[0]) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "A user with this email already exists" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = Number(req.params.id);
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email)?.toLowerCase();
    const role = cleanText(req.body.role);
    const status = cleanText(req.body.status);

    if (!Number.isInteger(id) || id < 1 || !name || !email || !email.includes("@")) {
      return res.status(400).json({ ok: false, error: "Valid user details are required" });
    }

    if (!VALID_ROLES.includes(role) || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid role or status" });
    }

    const existingResult = await pool.query(
      "SELECT id, name, email, role, status FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    const existing = existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const removesActiveSuperAdmin = existing.role === ROLES.SUPER_ADMIN && existing.status === "active" &&
      (role !== ROLES.SUPER_ADMIN || status !== "active");

    if (removesActiveSuperAdmin && await countActiveSuperAdmins(pool, id) < 1) {
      return res.status(409).json({ ok: false, error: "DCAM must retain at least one active Super Administrator" });
    }

    if (id === req.user.id && status !== "active") {
      return res.status(409).json({ ok: false, error: "You cannot deactivate your own account" });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET name = $1, email = $2, role = $3, status = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, email, role, status, last_login_at, created_at, updated_at
      `,
      [name, email, role, status, id]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "user.updated",
      entityType: "user",
      entityId: id,
      metadata: { before: existing, after: { name, email, role, status } }
    });

    return res.json({ ok: true, user: publicAdminUser(result.rows[0]) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "A user with this email already exists" });
    }

    return next(err);
  }
});

router.post("/:id/reset-password", requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = Number(req.params.id);
    const password = String(req.body.password || "");

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ ok: false, error: "Invalid user ID" });
    }

    if (password.length < 12) {
      return res.status(400).json({ ok: false, error: "Temporary password must be at least 12 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id",
      [passwordHash, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "user.password_reset",
      entityType: "user",
      entityId: id,
      metadata: { reset_by_admin: true }
    });

    return res.json({ ok: true, message: "Temporary password saved" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
