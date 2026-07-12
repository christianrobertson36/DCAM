const express = require("express");

const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");

const router = express.Router();

const ENTITY_PERMISSIONS = Object.freeze({
  customer: PERMISSIONS.CUSTOMERS_VIEW,
  building: PERMISSIONS.BUILDINGS_VIEW,
  asset: PERMISSIONS.ASSETS_VIEW,
  work_order: PERMISSIONS.WORK_ORDERS_VIEW,
  schedule_assignment: PERMISSIONS.SCHEDULE_VIEW,
  maintenance_plan: PERMISSIONS.MAINTENANCE_PLANS_VIEW,
  compliance_service: PERMISSIONS.COMPLIANCE_SERVICES_VIEW,
  staff_profile: PERMISSIONS.STAFF_VIEW,
  staff_qualification: PERMISSIONS.STAFF_VIEW,
  asset_option: PERMISSIONS.ASSETS_ADMIN,
  settings: PERMISSIONS.SETTINGS_ADMIN
});

router.use(authRequired);

router.get("/:entityType/:entityId", (req, res, next) => {
  const permission = ENTITY_PERMISSIONS[req.params.entityType];

  if (!permission) {
    return res.status(404).json({
      ok: false,
      error: "History is not available for this record type"
    });
  }

  return requirePermission(permission)(req, res, next);
}, async (req, res, next) => {
  try {
    const pool = getPool();
    const entityType = req.params.entityType;
    const entityId = Number(req.params.entityId);

    if (!Number.isInteger(entityId) || entityId < 1) {
      return res.status(400).json({
        ok: false,
        error: "Invalid history record ID"
      });
    }

    const result = await pool.query(
      `
      SELECT
        ae.id,
        ae.action,
        ae.entity_type,
        ae.entity_id,
        ae.metadata,
        ae.created_at,
        u.name AS actor_name,
        u.email AS actor_email,
        u.role AS actor_role
      FROM audit_events ae
      LEFT JOIN users u ON u.id = ae.actor_user_id
      WHERE ae.entity_type = $1
        AND ae.entity_id = $2
      ORDER BY ae.created_at DESC, ae.id DESC
      LIMIT 50
      `,
      [entityType, entityId]
    );

    return res.json({
      ok: true,
      history: result.rows
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
