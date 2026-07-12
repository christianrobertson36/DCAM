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

function cleanBoolean(value) {
  return value === true || value === "true";
}

function publicService(row) {
  return {
    id: row.id,
    service_reference: row.service_reference,
    service_name: row.service_name,
    service_type: row.service_type,
    status: row.status,
    priority: row.priority,
    result_status: row.result_status,
    risk_rating: row.risk_rating,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    building_id: row.building_id,
    building_name: row.building_name,
    asset_id: row.asset_id,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    work_order_id: row.work_order_id,
    work_order_reference: row.work_order_reference,
    assigned_user_id: row.assigned_user_id,
    assigned_user_name: row.assigned_user_name,
    scheduled_date: row.scheduled_date,
    completed_date: row.completed_date,
    defects_found: row.defects_found,
    certificate_required: row.certificate_required,
    certificate_status: row.certificate_status,
    report_status: row.report_status,
    findings: row.findings,
    corrective_actions: row.corrective_actions,
    notes: row.notes,
    approved_by: row.approved_by,
    approved_by_name: row.approved_by_name,
    approved_at: row.approved_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextReference(pool) {
  const result = await pool.query(
    "SELECT 'CS-' || LPAD(nextval('compliance_service_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function joinedService(pool, id) {
  const result = await pool.query(
    `
    SELECT
      cs.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      wo.work_order_reference,
      u.name AS assigned_user_name,
      approver.name AS approved_by_name
    FROM compliance_services cs
    LEFT JOIN customers c ON c.id = cs.customer_id
    LEFT JOIN buildings b ON b.id = cs.building_id
    LEFT JOIN assets a ON a.id = cs.asset_id
    LEFT JOIN work_orders wo ON wo.id = cs.work_order_id
    LEFT JOIN users u ON u.id = cs.assigned_user_id
    LEFT JOIN users approver ON approver.id = cs.approved_by
    WHERE cs.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.COMPLIANCE_SERVICES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const serviceType = cleanText(req.query.service_type);
    const resultStatus = cleanText(req.query.result_status);
    const customerId = cleanInteger(req.query.customer_id);
    const buildingId = cleanInteger(req.query.building_id);
    const assetId = cleanInteger(req.query.asset_id);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        cs.service_reference ILIKE $${values.length}
        OR cs.service_name ILIKE $${values.length}
        OR cs.findings ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
        OR b.name ILIKE $${values.length}
        OR a.asset_reference ILIKE $${values.length}
        OR a.asset_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`cs.status = $${values.length}`);
    }

    if (serviceType) {
      values.push(serviceType);
      where.push(`cs.service_type = $${values.length}`);
    }

    if (resultStatus) {
      values.push(resultStatus);
      where.push(`cs.result_status = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`cs.customer_id = $${values.length}`);
    }

    if (buildingId) {
      values.push(buildingId);
      where.push(`cs.building_id = $${values.length}`);
    }

    if (assetId) {
      values.push(assetId);
      where.push(`cs.asset_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        cs.*,
        c.company_name AS customer_name,
        b.name AS building_name,
        a.asset_reference,
        a.asset_name,
        wo.work_order_reference,
        u.name AS assigned_user_name,
        approver.name AS approved_by_name
      FROM compliance_services cs
      LEFT JOIN customers c ON c.id = cs.customer_id
      LEFT JOIN buildings b ON b.id = cs.building_id
      LEFT JOIN assets a ON a.id = cs.asset_id
      LEFT JOIN work_orders wo ON wo.id = cs.work_order_id
      LEFT JOIN users u ON u.id = cs.assigned_user_id
      LEFT JOIN users approver ON approver.id = cs.approved_by
      ${whereSql}
      ORDER BY cs.scheduled_date ASC NULLS LAST, cs.created_at DESC, cs.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      compliance_services: result.rows.map(publicService)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.COMPLIANCE_SERVICES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Planned')::INT AS planned,
        COUNT(*) FILTER (WHERE status = 'In Progress')::INT AS in_progress,
        COUNT(*) FILTER (WHERE result_status = 'Pass')::INT AS passed,
        COUNT(*) FILTER (WHERE result_status = 'Fail')::INT AS failed,
        COUNT(*) FILTER (WHERE defects_found = TRUE)::INT AS defects,
        COUNT(*) FILTER (WHERE report_status = 'Approved')::INT AS approved
      FROM compliance_services
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

router.get("/:id", requirePermission(PERMISSIONS.COMPLIANCE_SERVICES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid compliance service ID" });
    }

    const service = await joinedService(pool, id);

    if (!service) {
      return res.status(404).json({ ok: false, error: "Compliance service not found" });
    }

    return res.json({
      ok: true,
      compliance_service: publicService(service)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.COMPLIANCE_SERVICES_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const serviceName = cleanText(req.body.service_name);

    if (!serviceName) {
      return res.status(400).json({ ok: false, error: "Service name is required" });
    }

    const reference = cleanText(req.body.service_reference) || await nextReference(pool);
    const result = await pool.query(
      `
      INSERT INTO compliance_services (
        service_reference,
        service_name,
        service_type,
        status,
        priority,
        result_status,
        risk_rating,
        customer_id,
        building_id,
        asset_id,
        work_order_id,
        assigned_user_id,
        scheduled_date,
        completed_date,
        defects_found,
        certificate_required,
        certificate_status,
        report_status,
        findings,
        corrective_actions,
        notes,
        created_by,
        updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $22
      )
      RETURNING *
      `,
      [
        reference,
        serviceName,
        cleanText(req.body.service_type) || "Technical Compliance Audit",
        cleanText(req.body.status) || "Planned",
        cleanText(req.body.priority) || "Normal",
        cleanText(req.body.result_status) || "Not Started",
        cleanText(req.body.risk_rating) || "Unrated",
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.work_order_id),
        cleanInteger(req.body.assigned_user_id),
        cleanDate(req.body.scheduled_date),
        cleanDate(req.body.completed_date),
        cleanBoolean(req.body.defects_found),
        req.body.certificate_required !== false,
        cleanText(req.body.certificate_status) || "Not Required",
        cleanText(req.body.report_status) || "Draft",
        cleanText(req.body.findings),
        cleanText(req.body.corrective_actions),
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    const service = await joinedService(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "compliance_service.created",
      entityType: "compliance_service",
      entityId: result.rows[0].id,
      metadata: {
        service_reference: result.rows[0].service_reference,
        service_type: result.rows[0].service_type,
        status: result.rows[0].status,
        result_status: result.rows[0].result_status
      }
    });

    return res.status(201).json({
      ok: true,
      compliance_service: publicService(service)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Compliance service reference already exists" });
    }

    if (err.code === "23503") {
      return res.status(400).json({ ok: false, error: "Linked customer, building, asset, work order or user not found" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.COMPLIANCE_SERVICES_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const serviceName = cleanText(req.body.service_name);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid compliance service ID" });
    }

    if (!serviceName) {
      return res.status(400).json({ ok: false, error: "Service name is required" });
    }

    const existing = await pool.query("SELECT * FROM compliance_services WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Compliance service not found" });
    }

    const reportStatus = cleanText(req.body.report_status) || "Draft";
    const wantsApproval = reportStatus === "Approved" && existing.rows[0].report_status !== "Approved";

    if (wantsApproval && !hasPermission(req.user, PERMISSIONS.COMPLIANCE_SERVICES_APPROVE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to approve compliance reports" });
    }

    await pool.query(
      `
      UPDATE compliance_services
      SET
        service_reference = $1,
        service_name = $2,
        service_type = $3,
        status = $4,
        priority = $5,
        result_status = $6,
        risk_rating = $7,
        customer_id = $8,
        building_id = $9,
        asset_id = $10,
        work_order_id = $11,
        assigned_user_id = $12,
        scheduled_date = $13,
        completed_date = $14,
        defects_found = $15,
        certificate_required = $16,
        certificate_status = $17,
        report_status = $18,
        findings = $19,
        corrective_actions = $20,
        notes = $21,
        approved_by = CASE WHEN $22 THEN $23 ELSE approved_by END,
        approved_at = CASE WHEN $22 THEN NOW() ELSE approved_at END,
        updated_by = $23,
        updated_at = NOW()
      WHERE id = $24
      `,
      [
        cleanText(req.body.service_reference) || existing.rows[0].service_reference,
        serviceName,
        cleanText(req.body.service_type) || "Technical Compliance Audit",
        cleanText(req.body.status) || "Planned",
        cleanText(req.body.priority) || "Normal",
        cleanText(req.body.result_status) || "Not Started",
        cleanText(req.body.risk_rating) || "Unrated",
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.work_order_id),
        cleanInteger(req.body.assigned_user_id),
        cleanDate(req.body.scheduled_date),
        cleanDate(req.body.completed_date),
        cleanBoolean(req.body.defects_found),
        req.body.certificate_required !== false,
        cleanText(req.body.certificate_status) || "Not Required",
        reportStatus,
        cleanText(req.body.findings),
        cleanText(req.body.corrective_actions),
        cleanText(req.body.notes),
        wantsApproval,
        req.user.id,
        id
      ]
    );

    const service = await joinedService(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: wantsApproval ? "compliance_service.approved" : "compliance_service.updated",
      entityType: "compliance_service",
      entityId: id,
      metadata: {
        service_reference: service.service_reference,
        previous_status: existing.rows[0].status,
        status: service.status,
        previous_result_status: existing.rows[0].result_status,
        result_status: service.result_status,
        previous_report_status: existing.rows[0].report_status,
        report_status: service.report_status
      }
    });

    return res.json({
      ok: true,
      compliance_service: publicService(service)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Compliance service reference already exists" });
    }

    if (err.code === "23503") {
      return res.status(400).json({ ok: false, error: "Linked customer, building, asset, work order or user not found" });
    }

    return next(err);
  }
});

module.exports = router;
