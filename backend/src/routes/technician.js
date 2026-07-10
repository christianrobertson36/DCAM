const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { PERMISSIONS, hasPermission } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const uploadRoot = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));

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

function cleanFilename(value) {
  const text = cleanText(value) || "job-file";
  return text.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 180);
}

function cleanFileKind(value) {
  const text = cleanText(value);
  return text === "document" ? "document" : "photo";
}

function decodeBase64File(value) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const payload = text.includes(",") ? text.split(",").pop() : text;
  return Buffer.from(payload, "base64");
}

function workOrderUploadDir(workOrderId) {
  return path.join(uploadRoot, "work-orders", String(workOrderId));
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

function publicJobFile(row) {
  return {
    id: row.id,
    work_order_id: row.work_order_id,
    file_kind: row.file_kind,
    original_filename: row.original_filename,
    content_type: row.content_type,
    file_size: row.file_size,
    notes: row.notes,
    uploaded_by: row.uploaded_by,
    uploaded_by_name: row.uploaded_by_name,
    created_at: row.created_at
  };
}

function publicChecklistItem(row) {
  return {
    id: row.id,
    work_order_id: row.work_order_id,
    item_text: row.item_text,
    is_completed: row.is_completed,
    completed_at: row.completed_at,
    completed_by: row.completed_by,
    completed_by_name: row.completed_by_name,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function publicJobSignature(row) {
  return {
    id: row.id,
    work_order_id: row.work_order_id,
    signer_name: row.signer_name,
    signer_role: row.signer_role,
    signature_text: row.signature_text,
    notes: row.notes,
    signed_by: row.signed_by,
    signed_by_name: row.signed_by_name,
    signed_at: row.signed_at
  };
}

async function canAccessJob(pool, req, id) {
  const result = await pool.query(
    "SELECT id, assigned_user_id, work_order_reference FROM work_orders WHERE id = $1 LIMIT 1",
    [id]
  );
  const job = result.rows[0];

  if (!job) {
    return { ok: false, status: 404, error: "Job not found" };
  }

  if (!canManageTechnicianJobs(req.user) && job.assigned_user_id !== req.user.id) {
    return { ok: false, status: 403, error: "You can only access jobs assigned to you" };
  }

  return { ok: true, job };
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

router.get("/jobs/:id/checklist", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid job ID" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const result = await pool.query(
      `
      SELECT woci.*, u.name AS completed_by_name
      FROM work_order_checklist_items woci
      LEFT JOIN users u ON u.id = woci.completed_by
      WHERE woci.work_order_id = $1
      ORDER BY woci.is_completed ASC, woci.created_at ASC, woci.id ASC
      `,
      [id]
    );

    return res.json({
      ok: true,
      checklist: result.rows.map(publicChecklistItem)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/jobs/:id/checklist", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_UPDATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const itemText = cleanText(req.body.item_text);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid job ID" });
    }

    if (!itemText) {
      return res.status(400).json({ ok: false, error: "Checklist item text is required" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const result = await pool.query(
      `
      INSERT INTO work_order_checklist_items (
        work_order_id,
        item_text,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $3)
      RETURNING *
      `,
      [id, itemText, req.user.id]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "technician_job.checklist_item_created",
      entityType: "work_order",
      entityId: id,
      metadata: {
        work_order_reference: access.job.work_order_reference,
        checklist_item_id: result.rows[0].id,
        item_text: result.rows[0].item_text
      }
    });

    return res.status(201).json({
      ok: true,
      checklist_item: publicChecklistItem(result.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/jobs/:id/checklist/:itemId", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_UPDATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const itemId = cleanInteger(req.params.itemId);

    if (!id || !itemId) {
      return res.status(400).json({ ok: false, error: "Invalid checklist request" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const existing = await pool.query(
      "SELECT * FROM work_order_checklist_items WHERE id = $1 AND work_order_id = $2 LIMIT 1",
      [itemId, id]
    );
    const current = existing.rows[0];

    if (!current) {
      return res.status(404).json({ ok: false, error: "Checklist item not found" });
    }

    const isCompleted = Boolean(req.body.is_completed);
    const itemText = cleanText(req.body.item_text) || current.item_text;
    const result = await pool.query(
      `
      UPDATE work_order_checklist_items
      SET
        item_text = $1,
        is_completed = $2,
        completed_at = CASE WHEN $2 THEN COALESCE(completed_at, NOW()) ELSE NULL END,
        completed_by = CASE WHEN $2 THEN COALESCE(completed_by, $3) ELSE NULL END,
        updated_by = $3,
        updated_at = NOW()
      WHERE id = $4 AND work_order_id = $5
      RETURNING *
      `,
      [itemText, isCompleted, req.user.id, itemId, id]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "technician_job.checklist_item_updated",
      entityType: "work_order",
      entityId: id,
      metadata: {
        work_order_reference: access.job.work_order_reference,
        checklist_item_id: result.rows[0].id,
        previous_is_completed: current.is_completed,
        is_completed: result.rows[0].is_completed
      }
    });

    return res.json({
      ok: true,
      checklist_item: publicChecklistItem(result.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/jobs/:id/signatures", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid job ID" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const result = await pool.query(
      `
      SELECT wos.*, u.name AS signed_by_name
      FROM work_order_signatures wos
      LEFT JOIN users u ON u.id = wos.signed_by
      WHERE wos.work_order_id = $1
      ORDER BY wos.signed_at DESC, wos.id DESC
      `,
      [id]
    );

    return res.json({
      ok: true,
      signatures: result.rows.map(publicJobSignature)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/jobs/:id/signatures", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_UPDATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const signerName = cleanText(req.body.signer_name);
    const signatureText = cleanText(req.body.signature_text);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid job ID" });
    }

    if (!signerName) {
      return res.status(400).json({ ok: false, error: "Signer name is required" });
    }

    if (!signatureText) {
      return res.status(400).json({ ok: false, error: "Signature is required" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const result = await pool.query(
      `
      INSERT INTO work_order_signatures (
        work_order_id,
        signer_name,
        signer_role,
        signature_text,
        notes,
        signed_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        id,
        signerName,
        cleanText(req.body.signer_role),
        signatureText,
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "technician_job.signature_created",
      entityType: "work_order",
      entityId: id,
      metadata: {
        work_order_reference: access.job.work_order_reference,
        signature_id: result.rows[0].id,
        signer_name: result.rows[0].signer_name,
        signer_role: result.rows[0].signer_role
      }
    });

    return res.status(201).json({
      ok: true,
      signature: publicJobSignature(result.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/jobs/:id/files", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid job ID" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const result = await pool.query(
      `
      SELECT wof.*, u.name AS uploaded_by_name
      FROM work_order_files wof
      LEFT JOIN users u ON u.id = wof.uploaded_by
      WHERE wof.work_order_id = $1
      ORDER BY wof.created_at DESC, wof.id DESC
      `,
      [id]
    );

    return res.json({
      ok: true,
      files: result.rows.map(publicJobFile)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/jobs/:id/files", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_UPDATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const content = decodeBase64File(req.body.content_base64);
    const originalFilename = cleanFilename(req.body.original_filename);
    const contentType = cleanText(req.body.content_type) || "application/octet-stream";
    const fileKind = cleanFileKind(req.body.file_kind);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid job ID" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    if (!content || !content.length) {
      return res.status(400).json({ ok: false, error: "File content is required" });
    }

    if (content.length > 5 * 1024 * 1024) {
      return res.status(400).json({ ok: false, error: "File must be 5MB or smaller" });
    }

    const extension = path.extname(originalFilename).slice(0, 12);
    const storedFilename = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${extension}`;
    const directory = workOrderUploadDir(id);

    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, storedFilename), content);

    const result = await pool.query(
      `
      INSERT INTO work_order_files (
        work_order_id,
        file_kind,
        original_filename,
        stored_filename,
        content_type,
        file_size,
        notes,
        uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        id,
        fileKind,
        originalFilename,
        storedFilename,
        contentType,
        content.length,
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "technician_job.file_uploaded",
      entityType: "work_order",
      entityId: id,
      metadata: {
        work_order_reference: access.job.work_order_reference,
        file_id: result.rows[0].id,
        file_kind: result.rows[0].file_kind,
        original_filename: result.rows[0].original_filename,
        file_size: result.rows[0].file_size
      }
    });

    return res.status(201).json({
      ok: true,
      file: publicJobFile(result.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/jobs/:id/files/:fileId/download", requirePermission(PERMISSIONS.TECHNICIAN_JOBS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const fileId = cleanInteger(req.params.fileId);

    if (!id || !fileId) {
      return res.status(400).json({ ok: false, error: "Invalid file request" });
    }

    const access = await canAccessJob(pool, req, id);

    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const result = await pool.query(
      "SELECT * FROM work_order_files WHERE id = $1 AND work_order_id = $2 LIMIT 1",
      [fileId, id]
    );
    const file = result.rows[0];

    if (!file) {
      return res.status(404).json({ ok: false, error: "File not found" });
    }

    const filePath = path.join(workOrderUploadDir(id), file.stored_filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: "Stored file not found" });
    }

    res.setHeader("Content-Type", file.content_type);
    res.setHeader("Content-Disposition", `attachment; filename="${cleanFilename(file.original_filename)}"`);
    return res.sendFile(filePath);
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
