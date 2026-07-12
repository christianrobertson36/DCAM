const express = require("express");

const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();

router.use(authRequired);

function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length ? text : null;
}

function cleanInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function cleanDate(value) {
  const text = cleanText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function publicPlan(row) {
  return {
    id: row.id,
    plan_reference: row.plan_reference,
    title: row.title,
    plan_type: row.plan_type,
    status: row.status,
    frequency: row.frequency,
    priority: row.priority,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    building_id: row.building_id,
    building_name: row.building_name,
    asset_id: row.asset_id,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    assigned_user_id: row.assigned_user_id,
    assigned_user_name: row.assigned_user_name,
    start_date: row.start_date,
    next_due_date: row.next_due_date,
    last_generated_date: row.last_generated_date,
    estimated_duration_minutes: row.estimated_duration_minutes,
    instructions: row.instructions,
    notes: row.notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextReference(pool) {
  const result = await pool.query(
    "SELECT 'PPM-' || LPAD(nextval('maintenance_plan_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function joinedPlan(pool, id) {
  const result = await pool.query(
    `
    SELECT
      mp.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      u.name AS assigned_user_name
    FROM maintenance_plans mp
    LEFT JOIN customers c ON c.id = mp.customer_id
    LEFT JOIN buildings b ON b.id = mp.building_id
    LEFT JOIN assets a ON a.id = mp.asset_id
    LEFT JOIN users u ON u.id = mp.assigned_user_id
    WHERE mp.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.MAINTENANCE_PLANS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const frequency = cleanText(req.query.frequency);
    const customerId = cleanInteger(req.query.customer_id);
    const buildingId = cleanInteger(req.query.building_id);
    const assetId = cleanInteger(req.query.asset_id);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        mp.plan_reference ILIKE $${values.length}
        OR mp.title ILIKE $${values.length}
        OR mp.instructions ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
        OR b.name ILIKE $${values.length}
        OR a.asset_reference ILIKE $${values.length}
        OR a.asset_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`mp.status = $${values.length}`);
    }

    if (frequency) {
      values.push(frequency);
      where.push(`mp.frequency = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`mp.customer_id = $${values.length}`);
    }

    if (buildingId) {
      values.push(buildingId);
      where.push(`mp.building_id = $${values.length}`);
    }

    if (assetId) {
      values.push(assetId);
      where.push(`mp.asset_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        mp.*,
        c.company_name AS customer_name,
        b.name AS building_name,
        a.asset_reference,
        a.asset_name,
        u.name AS assigned_user_name
      FROM maintenance_plans mp
      LEFT JOIN customers c ON c.id = mp.customer_id
      LEFT JOIN buildings b ON b.id = mp.building_id
      LEFT JOIN assets a ON a.id = mp.asset_id
      LEFT JOIN users u ON u.id = mp.assigned_user_id
      ${whereSql}
      ORDER BY mp.next_due_date ASC NULLS LAST, mp.created_at DESC, mp.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      maintenance_plans: result.rows.map(publicPlan)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.MAINTENANCE_PLANS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Active')::INT AS active,
        COUNT(*) FILTER (WHERE next_due_date < CURRENT_DATE AND status = 'Active')::INT AS overdue,
        COUNT(*) FILTER (WHERE next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND status = 'Active')::INT AS due_soon,
        COUNT(*) FILTER (WHERE status = 'Paused')::INT AS paused,
        COUNT(*) FILTER (WHERE status = 'Retired')::INT AS retired
      FROM maintenance_plans
      `
    );

    return res.json({
      ok: true,
      summary: result.rows[0]
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", requirePermission(PERMISSIONS.MAINTENANCE_PLANS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid maintenance plan ID" });
    }

    const plan = await joinedPlan(pool, id);

    if (!plan) {
      return res.status(404).json({ ok: false, error: "Maintenance plan not found" });
    }

    return res.json({
      ok: true,
      maintenance_plan: publicPlan(plan)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.MAINTENANCE_PLANS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const title = cleanText(req.body.title);

    if (!title) {
      return res.status(400).json({ ok: false, error: "Maintenance plan title is required" });
    }

    const reference = cleanText(req.body.plan_reference) || await nextReference(pool);
    const result = await pool.query(
      `
      INSERT INTO maintenance_plans (
        plan_reference,
        title,
        plan_type,
        status,
        frequency,
        priority,
        customer_id,
        building_id,
        asset_id,
        assigned_user_id,
        start_date,
        next_due_date,
        last_generated_date,
        estimated_duration_minutes,
        instructions,
        notes,
        created_by,
        updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $17
      )
      RETURNING *
      `,
      [
        reference,
        title,
        cleanText(req.body.plan_type) || "Planned Maintenance",
        cleanText(req.body.status) || "Active",
        cleanText(req.body.frequency) || "Monthly",
        cleanText(req.body.priority) || "Normal",
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.assigned_user_id),
        cleanDate(req.body.start_date),
        cleanDate(req.body.next_due_date),
        cleanDate(req.body.last_generated_date),
        cleanInteger(req.body.estimated_duration_minutes),
        cleanText(req.body.instructions),
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    const plan = await joinedPlan(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "maintenance_plan.created",
      entityType: "maintenance_plan",
      entityId: result.rows[0].id,
      metadata: {
        plan_reference: result.rows[0].plan_reference,
        title: result.rows[0].title,
        frequency: result.rows[0].frequency,
        next_due_date: result.rows[0].next_due_date
      }
    });

    return res.status(201).json({
      ok: true,
      maintenance_plan: publicPlan(plan)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Maintenance plan reference already exists" });
    }

    if (err.code === "23503") {
      return res.status(400).json({ ok: false, error: "Linked customer, building, asset or user not found" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.MAINTENANCE_PLANS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const title = cleanText(req.body.title);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid maintenance plan ID" });
    }

    if (!title) {
      return res.status(400).json({ ok: false, error: "Maintenance plan title is required" });
    }

    const existing = await pool.query("SELECT * FROM maintenance_plans WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Maintenance plan not found" });
    }

    await pool.query(
      `
      UPDATE maintenance_plans
      SET
        plan_reference = $1,
        title = $2,
        plan_type = $3,
        status = $4,
        frequency = $5,
        priority = $6,
        customer_id = $7,
        building_id = $8,
        asset_id = $9,
        assigned_user_id = $10,
        start_date = $11,
        next_due_date = $12,
        last_generated_date = $13,
        estimated_duration_minutes = $14,
        instructions = $15,
        notes = $16,
        updated_by = $17,
        updated_at = NOW()
      WHERE id = $18
      `,
      [
        cleanText(req.body.plan_reference) || existing.rows[0].plan_reference,
        title,
        cleanText(req.body.plan_type) || "Planned Maintenance",
        cleanText(req.body.status) || "Active",
        cleanText(req.body.frequency) || "Monthly",
        cleanText(req.body.priority) || "Normal",
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.assigned_user_id),
        cleanDate(req.body.start_date),
        cleanDate(req.body.next_due_date),
        cleanDate(req.body.last_generated_date),
        cleanInteger(req.body.estimated_duration_minutes),
        cleanText(req.body.instructions),
        cleanText(req.body.notes),
        req.user.id,
        id
      ]
    );

    const plan = await joinedPlan(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "maintenance_plan.updated",
      entityType: "maintenance_plan",
      entityId: id,
      metadata: {
        plan_reference: plan.plan_reference,
        previous_status: existing.rows[0].status,
        status: plan.status,
        previous_next_due_date: existing.rows[0].next_due_date,
        next_due_date: plan.next_due_date
      }
    });

    return res.json({
      ok: true,
      maintenance_plan: publicPlan(plan)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Maintenance plan reference already exists" });
    }

    if (err.code === "23503") {
      return res.status(400).json({ ok: false, error: "Linked customer, building, asset or user not found" });
    }

    return next(err);
  }
});

module.exports = router;
