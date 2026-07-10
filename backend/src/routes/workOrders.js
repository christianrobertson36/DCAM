const express = require("express");

const { PERMISSIONS, hasPermission } = require("../config/permissions");
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

function publicWorkOrder(row) {
  return {
    id: row.id,
    work_order_reference: row.work_order_reference,
    work_order_type: row.work_order_type,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    building_id: row.building_id,
    building_name: row.building_name,
    asset_id: row.asset_id,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    assigned_user_id: row.assigned_user_id,
    assigned_user_name: row.assigned_user_name,
    due_date: row.due_date,
    completion_notes: row.completion_notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextReference(pool) {
  const result = await pool.query(
    "SELECT 'WO-' || LPAD(nextval('work_order_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function joinedWorkOrder(pool, id) {
  const result = await pool.query(
    `
    SELECT
      wo.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      u.name AS assigned_user_name
    FROM work_orders wo
    LEFT JOIN customers c ON c.id = wo.customer_id
    LEFT JOIN buildings b ON b.id = wo.building_id
    LEFT JOIN assets a ON a.id = wo.asset_id
    LEFT JOIN users u ON u.id = wo.assigned_user_id
    WHERE wo.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.WORK_ORDERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const priority = cleanText(req.query.priority);
    const customerId = cleanInteger(req.query.customer_id);
    const buildingId = cleanInteger(req.query.building_id);
    const assetId = cleanInteger(req.query.asset_id);
    const assignedUserId = cleanInteger(req.query.assigned_user_id);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        wo.work_order_reference ILIKE $${values.length}
        OR wo.title ILIKE $${values.length}
        OR wo.description ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
        OR b.name ILIKE $${values.length}
        OR a.asset_reference ILIKE $${values.length}
        OR a.asset_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`wo.status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      where.push(`wo.priority = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`wo.customer_id = $${values.length}`);
    }

    if (buildingId) {
      values.push(buildingId);
      where.push(`wo.building_id = $${values.length}`);
    }

    if (assetId) {
      values.push(assetId);
      where.push(`wo.asset_id = $${values.length}`);
    }

    if (assignedUserId) {
      values.push(assignedUserId);
      where.push(`wo.assigned_user_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        wo.*,
        c.company_name AS customer_name,
        b.name AS building_name,
        a.asset_reference,
        a.asset_name,
        u.name AS assigned_user_name
      FROM work_orders wo
      LEFT JOIN customers c ON c.id = wo.customer_id
      LEFT JOIN buildings b ON b.id = wo.building_id
      LEFT JOIN assets a ON a.id = wo.asset_id
      LEFT JOIN users u ON u.id = wo.assigned_user_id
      ${whereSql}
      ORDER BY wo.created_at DESC, wo.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      work_orders: result.rows.map(publicWorkOrder)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.WORK_ORDERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Open')::INT AS open,
        COUNT(*) FILTER (WHERE status = 'In Progress')::INT AS in_progress,
        COUNT(*) FILTER (WHERE status = 'On Hold')::INT AS on_hold,
        COUNT(*) FILTER (WHERE status = 'Completed')::INT AS completed,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status <> 'Completed')::INT AS overdue
      FROM work_orders
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

router.get("/:id", requirePermission(PERMISSIONS.WORK_ORDERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid work order ID" });
    }

    const workOrder = await joinedWorkOrder(pool, id);

    if (!workOrder) {
      return res.status(404).json({ ok: false, error: "Work order not found" });
    }

    return res.json({
      ok: true,
      work_order: publicWorkOrder(workOrder)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.WORK_ORDERS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const title = cleanText(req.body.title);

    if (!title) {
      return res.status(400).json({ ok: false, error: "Work order title is required" });
    }

    const assignedUserId = cleanInteger(req.body.assigned_user_id);

    if (assignedUserId && !hasPermission(req.user, PERMISSIONS.WORK_ORDERS_ASSIGN)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to assign work" });
    }

    const reference = cleanText(req.body.work_order_reference) || await nextReference(pool);
    const values = [
      reference,
      cleanText(req.body.work_order_type) || "Reactive",
      title,
      cleanText(req.body.description),
      cleanText(req.body.priority) || "Normal",
      cleanText(req.body.status) || "Open",
      cleanInteger(req.body.customer_id),
      cleanInteger(req.body.building_id),
      cleanInteger(req.body.asset_id),
      assignedUserId,
      cleanDate(req.body.due_date),
      cleanText(req.body.completion_notes),
      req.user.id
    ];

    const result = await pool.query(
      `
      INSERT INTO work_orders (
        work_order_reference,
        work_order_type,
        title,
        description,
        priority,
        status,
        customer_id,
        building_id,
        asset_id,
        assigned_user_id,
        due_date,
        completion_notes,
        created_by,
        updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $13
      )
      RETURNING *
      `,
      values
    );

    const workOrder = await joinedWorkOrder(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "work_order.created",
      entityType: "work_order",
      entityId: result.rows[0].id,
      metadata: {
        work_order_reference: result.rows[0].work_order_reference,
        title: result.rows[0].title,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        assigned_user_id: result.rows[0].assigned_user_id
      }
    });

    return res.status(201).json({
      ok: true,
      work_order: publicWorkOrder(workOrder)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Work order reference already exists" });
    }
    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.WORK_ORDERS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const title = cleanText(req.body.title);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid work order ID" });
    }

    if (!title) {
      return res.status(400).json({ ok: false, error: "Work order title is required" });
    }

    const existing = await pool.query("SELECT * FROM work_orders WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Work order not found" });
    }

    const assignedUserId = cleanInteger(req.body.assigned_user_id);

    if (
      assignedUserId !== existing.rows[0].assigned_user_id &&
      !hasPermission(req.user, PERMISSIONS.WORK_ORDERS_ASSIGN)
    ) {
      return res.status(403).json({ ok: false, error: "You do not have permission to assign work" });
    }

    const values = [
      cleanText(req.body.work_order_reference) || existing.rows[0].work_order_reference,
      cleanText(req.body.work_order_type) || "Reactive",
      title,
      cleanText(req.body.description),
      cleanText(req.body.priority) || "Normal",
      cleanText(req.body.status) || "Open",
      cleanInteger(req.body.customer_id),
      cleanInteger(req.body.building_id),
      cleanInteger(req.body.asset_id),
      assignedUserId,
      cleanDate(req.body.due_date),
      cleanText(req.body.completion_notes),
      req.user.id,
      id
    ];

    await pool.query(
      `
      UPDATE work_orders
      SET
        work_order_reference = $1,
        work_order_type = $2,
        title = $3,
        description = $4,
        priority = $5,
        status = $6,
        customer_id = $7,
        building_id = $8,
        asset_id = $9,
        assigned_user_id = $10,
        due_date = $11,
        completion_notes = $12,
        updated_by = $13,
        updated_at = NOW()
      WHERE id = $14
      `,
      values
    );

    const workOrder = await joinedWorkOrder(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "work_order.updated",
      entityType: "work_order",
      entityId: id,
      metadata: {
        work_order_reference: workOrder.work_order_reference,
        previous_status: existing.rows[0].status,
        status: workOrder.status,
        previous_assigned_user_id: existing.rows[0].assigned_user_id,
        assigned_user_id: workOrder.assigned_user_id
      }
    });

    return res.json({
      ok: true,
      work_order: publicWorkOrder(workOrder)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Work order reference already exists" });
    }
    return next(err);
  }
});

module.exports = router;
