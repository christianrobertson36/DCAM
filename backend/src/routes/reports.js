const express = require("express");

const { PERMISSIONS, hasPermission } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");
const { createReportPdf } = require("../utils/brandedPdf");

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

  if (!text) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function publicReport(row) {
  return {
    id: row.id,
    report_reference: row.report_reference,
    report_title: row.report_title,
    report_type: row.report_type,
    status: row.status,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    building_id: row.building_id,
    building_name: row.building_name,
    asset_id: row.asset_id,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    work_order_id: row.work_order_id,
    work_order_reference: row.work_order_reference,
    work_order_title: row.work_order_title,
    compliance_service_id: row.compliance_service_id,
    service_reference: row.service_reference,
    service_name: row.service_name,
    date_from: row.date_from,
    date_to: row.date_to,
    summary: row.summary,
    findings: row.findings,
    recommendations: row.recommendations,
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
    "SELECT 'REP-' || LPAD(nextval('report_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function joinedReport(pool, id) {
  const result = await pool.query(
    `
    SELECT
      r.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      wo.work_order_reference,
      wo.title AS work_order_title,
      cs.service_reference,
      cs.service_name,
      approver.name AS approved_by_name
    FROM reports r
    LEFT JOIN customers c ON c.id = r.customer_id
    LEFT JOIN buildings b ON b.id = r.building_id
    LEFT JOIN assets a ON a.id = r.asset_id
    LEFT JOIN work_orders wo ON wo.id = r.work_order_id
    LEFT JOIN compliance_services cs ON cs.id = r.compliance_service_id
    LEFT JOIN users approver ON approver.id = r.approved_by
    WHERE r.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.REPORTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const reportType = cleanText(req.query.report_type);
    const customerId = cleanInteger(req.query.customer_id);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        r.report_reference ILIKE $${values.length}
        OR r.report_title ILIKE $${values.length}
        OR r.summary ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`r.status = $${values.length}`);
    }

    if (reportType) {
      values.push(reportType);
      where.push(`r.report_type = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`r.customer_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        r.*,
        c.company_name AS customer_name,
        b.name AS building_name,
        a.asset_reference,
        a.asset_name,
        wo.work_order_reference,
        wo.title AS work_order_title,
        cs.service_reference,
        cs.service_name,
        approver.name AS approved_by_name
      FROM reports r
      LEFT JOIN customers c ON c.id = r.customer_id
      LEFT JOIN buildings b ON b.id = r.building_id
      LEFT JOIN assets a ON a.id = r.asset_id
      LEFT JOIN work_orders wo ON wo.id = r.work_order_id
      LEFT JOIN compliance_services cs ON cs.id = r.compliance_service_id
      LEFT JOIN users approver ON approver.id = r.approved_by
      ${whereSql}
      ORDER BY r.updated_at DESC, r.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      reports: result.rows.map(publicReport)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.REPORTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Draft')::INT AS draft,
        COUNT(*) FILTER (WHERE status = 'Ready for Review')::INT AS ready_for_review,
        COUNT(*) FILTER (WHERE status = 'Approved')::INT AS approved,
        COUNT(*) FILTER (WHERE status = 'Issued')::INT AS issued
      FROM reports
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

router.get("/:id", requirePermission(PERMISSIONS.REPORTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    const report = await joinedReport(pool, id);

    if (!report) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    return res.json({
      ok: true,
      report: publicReport(report)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id/export", requirePermission(PERMISSIONS.REPORTS_EXPORT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    const report = await joinedReport(pool, id);

    if (!report) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    const format = req.query.format === "json" ? "json" : "pdf";

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "report.exported",
      entityType: "report",
      entityId: id,
      metadata: {
        report_reference: report.report_reference,
        report_title: report.report_title,
        status: report.status,
        format
      }
    });

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${report.report_reference}.json"`);
      return res.send(JSON.stringify({ exported_at: new Date().toISOString(), report: publicReport(report) }, null, 2));
    }

    const pdf = await createReportPdf(pool, report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Content-Disposition", `attachment; filename="${report.report_reference}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.REPORTS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const title = cleanText(req.body.report_title);

    if (!title) {
      return res.status(400).json({ ok: false, error: "Report title is required" });
    }

    const status = cleanText(req.body.status) || "Draft";

    if (status === "Approved" && !hasPermission(req.user, PERMISSIONS.REPORTS_APPROVE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to approve reports" });
    }

    const reference = cleanText(req.body.report_reference) || await nextReference(pool);
    const result = await pool.query(
      `
      INSERT INTO reports (
        report_reference,
        report_title,
        report_type,
        status,
        customer_id,
        building_id,
        asset_id,
        work_order_id,
        compliance_service_id,
        date_from,
        date_to,
        summary,
        findings,
        recommendations,
        approved_by,
        approved_at,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
      RETURNING *
      `,
      [
        reference,
        title,
        cleanText(req.body.report_type) || "Compliance Summary",
        status,
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.work_order_id),
        cleanInteger(req.body.compliance_service_id),
        cleanDate(req.body.date_from),
        cleanDate(req.body.date_to),
        cleanText(req.body.summary),
        cleanText(req.body.findings),
        cleanText(req.body.recommendations),
        status === "Approved" ? req.user.id : null,
        status === "Approved" ? new Date() : null,
        req.user.id
      ]
    );

    const report = await joinedReport(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "report.created",
      entityType: "report",
      entityId: result.rows[0].id,
      metadata: {
        report_reference: result.rows[0].report_reference,
        report_title: result.rows[0].report_title,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({
      ok: true,
      report: publicReport(report)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Report reference already exists" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.REPORTS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const title = cleanText(req.body.report_title);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid report ID" });
    }

    if (!title) {
      return res.status(400).json({ ok: false, error: "Report title is required" });
    }

    const existing = await pool.query("SELECT * FROM reports WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Report not found" });
    }

    const status = cleanText(req.body.status) || "Draft";
    const isApproval = status === "Approved" && existing.rows[0].status !== "Approved";

    if (isApproval && !hasPermission(req.user, PERMISSIONS.REPORTS_APPROVE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to approve reports" });
    }

    await pool.query(
      `
      UPDATE reports
      SET
        report_reference = $1,
        report_title = $2,
        report_type = $3,
        status = $4,
        customer_id = $5,
        building_id = $6,
        asset_id = $7,
        work_order_id = $8,
        compliance_service_id = $9,
        date_from = $10,
        date_to = $11,
        summary = $12,
        findings = $13,
        recommendations = $14,
        approved_by = $15,
        approved_at = $16,
        updated_by = $17,
        updated_at = NOW()
      WHERE id = $18
      `,
      [
        cleanText(req.body.report_reference) || existing.rows[0].report_reference,
        title,
        cleanText(req.body.report_type) || "Compliance Summary",
        status,
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.work_order_id),
        cleanInteger(req.body.compliance_service_id),
        cleanDate(req.body.date_from),
        cleanDate(req.body.date_to),
        cleanText(req.body.summary),
        cleanText(req.body.findings),
        cleanText(req.body.recommendations),
        isApproval ? req.user.id : existing.rows[0].approved_by,
        isApproval ? new Date() : existing.rows[0].approved_at,
        req.user.id,
        id
      ]
    );

    const report = await joinedReport(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: isApproval ? "report.approved" : "report.updated",
      entityType: "report",
      entityId: id,
      metadata: {
        report_reference: report.report_reference,
        previous_status: existing.rows[0].status,
        status: report.status
      }
    });

    return res.json({
      ok: true,
      report: publicReport(report)
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Report reference already exists" });
    }

    return next(err);
  }
});

module.exports = router;
