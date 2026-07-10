const express = require("express");

const { PERMISSIONS, hasPermission } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();

router.use(authRequired);

const JOB_STATUSES = ["Open", "In Progress", "On Hold", "Completed"];

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

function canManageTechnicianJobs(user) {
  return hasPermission(user, PERMISSIONS.TECHNICIAN_JOBS_MANAGE);
}

function jobScope(req, values) {
  if (canManageTechnicianJobs(req.user)) {
    const assignedUserId = cleanInteger(req.query.assigned_user_id);

    if (assignedUserId) {
      values.push(assignedUserId);
      return `wo.assigned_user_id = $${values.length}`;
    }

    return null;
  }

  values.push(req.user.id);
  return `wo.assigned_user_id = $${values.length}`;
}

function publicTechnicianJob(row) {
  return {
    id: row.id,
    work_order_reference: row.work_order_reference,
    work_order_type: row.work_order_type,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    customer_name: row.customer_name,
    building_name: row.building_name,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    assigned_user_id: row.assigned_user_id,
    assigned_user_name: row.assigned_user_name,
    due_date: row.due_date,
    next_schedule_date: row.next_schedule_date,
    next_start_time: row.next_start_time,
    completion_notes: row.completion_notes,
    updated_at: row.updated_at
  };
}

async function getTechnicianJob(pool, id) {
  const result = await pool.query(
    `
    SELECT
      wo.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      u.name AS assigned_user_name,
      schedule.next_schedule_date,
      schedule.next_start_time
    FROM work_orders wo
    LEFT JOIN customers c ON c.id = wo.customer_id
    LEFT JOIN buildings b ON b.id = wo.building_id
    LEFT JOIN assets a ON a.id = wo.asset_id
    LEFT JOIN users u ON u.id = wo.assigned_user_id
    LEFT JOIN LATERAL (
      SELECT sa.schedule_date AS next_schedule_date, sa.start_time AS next_start_time
      FROM schedule_assignments sa
      WHERE sa.work_order_id = wo.id
      ORDER BY sa.schedule_date ASC, sa.start_time ASC NULLS LAST, sa.id ASC
      LIMIT 1
    ) schedule ON TRUE
    WHERE wo.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/jobs", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const status = cleanText(req.query.status);
    const values = [];
    const where = [];
    const scope = jobScope(req, values);

    if (scope) {
      where.push(scope);
    }

    if (status) {
      values.push(status);
      where.push(`wo.status = $${values.length}`);
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
        u.name AS assigned_user_name,
        schedule.next_schedule_date,
        schedule.next_start_time
      FROM work_orders wo
      LEFT JOIN customers c ON c.id = wo.customer_id
      LEFT JOIN buildings b ON b.id = wo.building_id
      LEFT JOIN assets a ON a.id = wo.asset_id
      LEFT JOIN users u ON u.id = wo.assigned_user_id
      LEFT JOIN LATERAL (
        SELECT sa.schedule_date AS next_schedule_date, sa.start_time AS next_start_time
        FROM schedule_assignments sa
        WHERE sa.work_order_id = wo.id
        ORDER BY sa.schedule_date ASC, sa.start_time ASC NULLS LAST, sa.id ASC
        LIMIT 1
      ) schedule ON TRUE
      ${whereSql}
      ORDER BY
        schedule.next_schedule_date ASC NULLS LAST,
        wo.due_date ASC NULLS LAST,
        wo.priority DESC,
        wo.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      jobs: result.rows.map(publicTechnicianJob)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/jobs/summary", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const values = [];
    const where = [];
    const scope = jobScope(req, values);

    if (scope) {
      where.push(scope);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE wo.status = 'Open')::INT AS open,
        COUNT(*) FILTER (WHERE wo.status = 'In Progress')::INT AS in_progress,
        COUNT(*) FILTER (WHERE wo.status = 'On Hold')::INT AS on_hold,
        COUNT(*) FILTER (WHERE wo.status = 'Completed')::INT AS completed,
        COUNT(*) FILTER (WHERE wo.due_date < CURRENT_DATE AND wo.status <> 'Completed')::INT AS overdue
      FROM work_orders wo
      ${whereSql}
      `,
      values
    );

    return res.json({
      ok: true,
      summary: result.rows[0]
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/jobs/:id", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_UPDATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const status = cleanText(req.body.status);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid job ID" });
    }

    if (!JOB_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid job status" });
    }

    const existing = await pool.query("SELECT * FROM work_orders WHERE id = $1 LIMIT 1", [id]);
    const current = existing.rows[0];

    if (!current) {
      return res.status(404).json({ ok: false, error: "Job not found" });
    }

    if (!canManageTechnicianJobs(req.user) && current.assigned_user_id !== req.user.id) {
      return res.status(403).json({ ok: false, error: "You can only update jobs assigned to you" });
    }

    await pool.query(
      `
      UPDATE work_orders
      SET
        status = $1,
        completion_notes = $2,
        updated_by = $3,
        updated_at = NOW()
      WHERE id = $4
      `,
      [
        status,
        cleanText(req.body.completion_notes),
        req.user.id,
        id
      ]
    );

    const job = await getTechnicianJob(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "technician_job.updated",
      entityType: "work_order",
      entityId: id,
      metadata: {
        work_order_reference: job.work_order_reference,
        previous_status: current.status,
        status: job.status,
        assigned_user_id: job.assigned_user_id
      }
    });

    return res.json({
      ok: true,
      job: publicTechnicianJob(job)
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
