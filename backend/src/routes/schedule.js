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

function cleanTime(value) {
  const text = cleanText(value);
  return text && /^\d{2}:\d{2}$/.test(text) ? text : null;
}

function publicAssignment(row) {
  return {
    id: row.id,
    work_order_id: row.work_order_id,
    work_order_reference: row.work_order_reference,
    work_order_title: row.work_order_title,
    priority: row.priority,
    work_order_status: row.work_order_status,
    customer_name: row.customer_name,
    building_name: row.building_name,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    assigned_user_id: row.assigned_user_id,
    assigned_user_name: row.assigned_user_name,
    assigned_user_role: row.assigned_user_role,
    schedule_date: row.schedule_date,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    notes: row.notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function joinedAssignment(pool, id) {
  const result = await pool.query(
    `
    SELECT
      sa.*,
      wo.work_order_reference,
      wo.title AS work_order_title,
      wo.priority,
      wo.status AS work_order_status,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      u.name AS assigned_user_name,
      u.role AS assigned_user_role
    FROM schedule_assignments sa
    JOIN work_orders wo ON wo.id = sa.work_order_id
    LEFT JOIN customers c ON c.id = wo.customer_id
    LEFT JOIN buildings b ON b.id = wo.building_id
    LEFT JOIN assets a ON a.id = wo.asset_id
    JOIN users u ON u.id = sa.assigned_user_id
    WHERE sa.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.SCHEDULE_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const dateFrom = cleanDate(req.query.date_from);
    const dateTo = cleanDate(req.query.date_to);
    const assignedUserId = cleanInteger(req.query.assigned_user_id);
    const status = cleanText(req.query.status);
    const values = [];
    const where = [];

    if (dateFrom) {
      values.push(dateFrom);
      where.push(`sa.schedule_date >= $${values.length}`);
    }

    if (dateTo) {
      values.push(dateTo);
      where.push(`sa.schedule_date <= $${values.length}`);
    }

    if (assignedUserId) {
      values.push(assignedUserId);
      where.push(`sa.assigned_user_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      where.push(`sa.status = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        sa.*,
        wo.work_order_reference,
        wo.title AS work_order_title,
        wo.priority,
        wo.status AS work_order_status,
        c.company_name AS customer_name,
        b.name AS building_name,
        a.asset_reference,
        a.asset_name,
        u.name AS assigned_user_name,
        u.role AS assigned_user_role
      FROM schedule_assignments sa
      JOIN work_orders wo ON wo.id = sa.work_order_id
      LEFT JOIN customers c ON c.id = wo.customer_id
      LEFT JOIN buildings b ON b.id = wo.building_id
      LEFT JOIN assets a ON a.id = wo.asset_id
      JOIN users u ON u.id = sa.assigned_user_id
      ${whereSql}
      ORDER BY sa.schedule_date ASC, sa.start_time ASC NULLS LAST, sa.id ASC
      LIMIT 500
      `,
      values
    );

    return res.json({
      ok: true,
      assignments: result.rows.map(publicAssignment)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.SCHEDULE_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE schedule_date = CURRENT_DATE)::INT AS today,
        COUNT(*) FILTER (WHERE schedule_date < CURRENT_DATE AND status <> 'Completed')::INT AS overdue,
        COUNT(*) FILTER (WHERE status = 'Scheduled')::INT AS scheduled,
        COUNT(*) FILTER (WHERE status = 'Completed')::INT AS completed
      FROM schedule_assignments
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

router.post("/", requirePermission(PERMISSIONS.SCHEDULE_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const workOrderId = cleanInteger(req.body.work_order_id);
    const assignedUserId = cleanInteger(req.body.assigned_user_id);
    const scheduleDate = cleanDate(req.body.schedule_date);

    if (!workOrderId) {
      return res.status(400).json({ ok: false, error: "Work order is required" });
    }

    if (!assignedUserId) {
      return res.status(400).json({ ok: false, error: "Assigned user is required" });
    }

    if (!scheduleDate) {
      return res.status(400).json({ ok: false, error: "Schedule date is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO schedule_assignments (
        work_order_id,
        assigned_user_id,
        schedule_date,
        start_time,
        end_time,
        status,
        notes,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING *
      `,
      [
        workOrderId,
        assignedUserId,
        scheduleDate,
        cleanTime(req.body.start_time),
        cleanTime(req.body.end_time),
        cleanText(req.body.status) || "Scheduled",
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    const assignment = await joinedAssignment(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "schedule_assignment.created",
      entityType: "schedule_assignment",
      entityId: result.rows[0].id,
      metadata: {
        work_order_id: result.rows[0].work_order_id,
        assigned_user_id: result.rows[0].assigned_user_id,
        schedule_date: result.rows[0].schedule_date,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({
      ok: true,
      assignment: publicAssignment(assignment)
    });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ ok: false, error: "Work order or user not found" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.SCHEDULE_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const workOrderId = cleanInteger(req.body.work_order_id);
    const assignedUserId = cleanInteger(req.body.assigned_user_id);
    const scheduleDate = cleanDate(req.body.schedule_date);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid schedule assignment ID" });
    }

    if (!workOrderId || !assignedUserId || !scheduleDate) {
      return res.status(400).json({ ok: false, error: "Work order, assigned user and date are required" });
    }

    const existing = await pool.query(
      "SELECT * FROM schedule_assignments WHERE id = $1 LIMIT 1",
      [id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Schedule assignment not found" });
    }

    await pool.query(
      `
      UPDATE schedule_assignments
      SET
        work_order_id = $1,
        assigned_user_id = $2,
        schedule_date = $3,
        start_time = $4,
        end_time = $5,
        status = $6,
        notes = $7,
        updated_by = $8,
        updated_at = NOW()
      WHERE id = $9
      `,
      [
        workOrderId,
        assignedUserId,
        scheduleDate,
        cleanTime(req.body.start_time),
        cleanTime(req.body.end_time),
        cleanText(req.body.status) || "Scheduled",
        cleanText(req.body.notes),
        req.user.id,
        id
      ]
    );

    const assignment = await joinedAssignment(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "schedule_assignment.updated",
      entityType: "schedule_assignment",
      entityId: id,
      metadata: {
        previous_assigned_user_id: existing.rows[0].assigned_user_id,
        assigned_user_id: assignment.assigned_user_id,
        previous_schedule_date: existing.rows[0].schedule_date,
        schedule_date: assignment.schedule_date,
        previous_status: existing.rows[0].status,
        status: assignment.status
      }
    });

    return res.json({
      ok: true,
      assignment: publicAssignment(assignment)
    });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ ok: false, error: "Work order or user not found" });
    }

    return next(err);
  }
});

module.exports = router;
