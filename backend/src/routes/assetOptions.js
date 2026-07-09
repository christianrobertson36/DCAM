const express = require("express");

const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();

const OPTION_TYPES = new Set(["category", "type", "status", "condition", "ownership"]);

router.use(authRequired);

function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length ? text : null;
}

function cleanInteger(value, fallback = 100) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function cleanBoolean(value, fallback = true) {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return fallback;
}

function publicOption(row) {
  return {
    id: row.id,
    option_type: row.option_type,
    label: row.label,
    sort_order: row.sort_order,
    is_active: row.is_active,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function groupOptions(rows) {
  return rows.reduce((groups, row) => {
    const option = publicOption(row);
    groups[option.option_type] = groups[option.option_type] || [];
    groups[option.option_type].push(option);
    return groups;
  }, {});
}

router.get("/", requirePermission(PERMISSIONS.ASSETS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const includeInactive = req.query.include_inactive === "true";
    const values = [];
    const where = [];

    if (!includeInactive) {
      where.push("is_active = TRUE");
    }

    if (cleanText(req.query.option_type)) {
      values.push(cleanText(req.query.option_type));
      where.push(`option_type = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT *
      FROM asset_options
      ${whereSql}
      ORDER BY option_type ASC, sort_order ASC, label ASC
      `,
      values
    );

    return res.json({
      ok: true,
      options: result.rows.map(publicOption),
      grouped: groupOptions(result.rows)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.ASSETS_ADMIN), async (req, res, next) => {
  try {
    const pool = getPool();
    const optionType = cleanText(req.body.option_type);
    const label = cleanText(req.body.label);

    if (!OPTION_TYPES.has(optionType)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid asset option type"
      });
    }

    if (!label) {
      return res.status(400).json({
        ok: false,
        error: "Option label is required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO asset_options (
        option_type,
        label,
        sort_order,
        is_active,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $5)
      RETURNING *
      `,
      [
        optionType,
        label,
        cleanInteger(req.body.sort_order),
        cleanBoolean(req.body.is_active),
        req.user.id
      ]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "asset_option.created",
      entityType: "asset_option",
      entityId: result.rows[0].id,
      metadata: {
        option_type: result.rows[0].option_type,
        label: result.rows[0].label,
        is_active: result.rows[0].is_active
      }
    });

    return res.status(201).json({
      ok: true,
      option: publicOption(result.rows[0])
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        ok: false,
        error: "Asset option already exists"
      });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.ASSETS_ADMIN), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id, null);
    const label = cleanText(req.body.label);

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Invalid asset option ID"
      });
    }

    if (!label) {
      return res.status(400).json({
        ok: false,
        error: "Option label is required"
      });
    }

    const existing = await pool.query(
      "SELECT * FROM asset_options WHERE id = $1 LIMIT 1",
      [id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({
        ok: false,
        error: "Asset option not found"
      });
    }

    const result = await pool.query(
      `
      UPDATE asset_options
      SET
        label = $1,
        sort_order = $2,
        is_active = $3,
        updated_by = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [
        label,
        cleanInteger(req.body.sort_order),
        cleanBoolean(req.body.is_active),
        req.user.id,
        id
      ]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "asset_option.updated",
      entityType: "asset_option",
      entityId: id,
      metadata: {
        option_type: result.rows[0].option_type,
        previous_label: existing.rows[0].label,
        label: result.rows[0].label,
        previous_is_active: existing.rows[0].is_active,
        is_active: result.rows[0].is_active
      }
    });

    return res.json({
      ok: true,
      option: publicOption(result.rows[0])
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        ok: false,
        error: "Asset option already exists"
      });
    }

    return next(err);
  }
});

module.exports = router;
