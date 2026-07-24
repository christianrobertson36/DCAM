const express = require("express");

const { getPool } = require("../db/pool");
const { PERMISSIONS } = require("../config/permissions");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const LANGUAGES = ["en", "ro"];
const CURRENCIES = ["GBP", "RON"];

router.use(authRequired);

function publicTenant(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    default_language: row.default_language,
    default_currency: row.default_currency,
    timezone: row.timezone,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

router.get("/", async (req, res, next) => {
  try {
    const result = await getPool().query(
      "SELECT * FROM tenants WHERE id = $1 LIMIT 1",
      [req.user.tenant_id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ ok: false, error: "Company account not found" });
    }
    return res.json({ ok: true, tenant: publicTenant(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.patch("/", requirePermission(PERMISSIONS.SETTINGS_ADMIN), async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim().slice(0, 160);
    const defaultLanguage = String(req.body.default_language || "");
    const defaultCurrency = String(req.body.default_currency || "");
    const timezone = String(req.body.timezone || "").trim().slice(0, 100);

    if (!name || !LANGUAGES.includes(defaultLanguage) || !CURRENCIES.includes(defaultCurrency) || !timezone) {
      return res.status(400).json({ ok: false, error: "Valid company settings are required" });
    }

    const pool = getPool();
    const result = await pool.query(
      `
      UPDATE tenants
      SET name = $1,
          default_language = $2,
          default_currency = $3,
          timezone = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [name, defaultLanguage, defaultCurrency, timezone, req.user.tenant_id]
    );

    await writeAuditEvent(pool, {
      tenantId: req.user.tenant_id,
      actorUserId: req.user.id,
      action: "tenant.settings_updated",
      entityType: "tenant",
      entityId: null,
      metadata: { tenant_id: req.user.tenant_id, name, defaultLanguage, defaultCurrency, timezone }
    });

    return res.json({ ok: true, tenant: publicTenant(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

