const express = require("express");

const { PERMISSIONS, hasPermission } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");
const { createCertificatePdf } = require("../utils/brandedPdf");

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

function publicCertificate(row) {
  return {
    id: row.id,
    certificate_reference: row.certificate_reference,
    certificate_title: row.certificate_title,
    certificate_type: row.certificate_type,
    status: row.status,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    building_id: row.building_id,
    building_name: row.building_name,
    asset_id: row.asset_id,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    compliance_service_id: row.compliance_service_id,
    service_reference: row.service_reference,
    service_name: row.service_name,
    report_id: row.report_id,
    report_reference: row.report_reference,
    report_title: row.report_title,
    issue_date: row.issue_date,
    expiry_date: row.expiry_date,
    certificate_body: row.certificate_body,
    issued_by: row.issued_by,
    issued_by_name: row.issued_by_name,
    issued_at: row.issued_at,
    revoked_by: row.revoked_by,
    revoked_by_name: row.revoked_by_name,
    revoked_at: row.revoked_at,
    revocation_reason: row.revocation_reason,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextReference(pool) {
  const result = await pool.query(
    "SELECT 'CERT-' || LPAD(nextval('certificate_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function joinedCertificate(pool, id) {
  const result = await pool.query(
    `
    SELECT
      cert.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      cs.service_reference,
      cs.service_name,
      r.report_reference,
      r.report_title,
      issuer.name AS issued_by_name,
      revoker.name AS revoked_by_name
    FROM certificates cert
    LEFT JOIN customers c ON c.id = cert.customer_id
    LEFT JOIN buildings b ON b.id = cert.building_id
    LEFT JOIN assets a ON a.id = cert.asset_id
    LEFT JOIN compliance_services cs ON cs.id = cert.compliance_service_id
    LEFT JOIN reports r ON r.id = cert.report_id
    LEFT JOIN users issuer ON issuer.id = cert.issued_by
    LEFT JOIN users revoker ON revoker.id = cert.revoked_by
    WHERE cert.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.CERTIFICATES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const certificateType = cleanText(req.query.certificate_type);
    const customerId = cleanInteger(req.query.customer_id);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        cert.certificate_reference ILIKE $${values.length}
        OR cert.certificate_title ILIKE $${values.length}
        OR cert.certificate_body ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`cert.status = $${values.length}`);
    }

    if (certificateType) {
      values.push(certificateType);
      where.push(`cert.certificate_type = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`cert.customer_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        cert.*,
        c.company_name AS customer_name,
        b.name AS building_name,
        a.asset_reference,
        a.asset_name,
        cs.service_reference,
        cs.service_name,
        r.report_reference,
        r.report_title,
        issuer.name AS issued_by_name,
        revoker.name AS revoked_by_name
      FROM certificates cert
      LEFT JOIN customers c ON c.id = cert.customer_id
      LEFT JOIN buildings b ON b.id = cert.building_id
      LEFT JOIN assets a ON a.id = cert.asset_id
      LEFT JOIN compliance_services cs ON cs.id = cert.compliance_service_id
      LEFT JOIN reports r ON r.id = cert.report_id
      LEFT JOIN users issuer ON issuer.id = cert.issued_by
      LEFT JOIN users revoker ON revoker.id = cert.revoked_by
      ${whereSql}
      ORDER BY cert.updated_at DESC, cert.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({ ok: true, certificates: result.rows.map(publicCertificate) });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.CERTIFICATES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Draft')::INT AS draft,
        COUNT(*) FILTER (WHERE status = 'Issued')::INT AS issued,
        COUNT(*) FILTER (WHERE status = 'Revoked')::INT AS revoked,
        COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE AND status = 'Issued')::INT AS expired,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND status = 'Issued')::INT AS expiring_soon
      FROM certificates
      `
    );

    return res.json({ ok: true, summary: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", requirePermission(PERMISSIONS.CERTIFICATES_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid certificate ID" });
    }

    const certificate = await joinedCertificate(pool, id);

    if (!certificate) {
      return res.status(404).json({ ok: false, error: "Certificate not found" });
    }

    return res.json({ ok: true, certificate: publicCertificate(certificate) });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id/export", requirePermission(PERMISSIONS.CERTIFICATES_EXPORT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid certificate ID" });
    }

    const certificate = await joinedCertificate(pool, id);

    if (!certificate) {
      return res.status(404).json({ ok: false, error: "Certificate not found" });
    }

    const format = req.query.format === "json" ? "json" : "pdf";

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "certificate.exported",
      entityType: "certificate",
      entityId: id,
      metadata: {
        certificate_reference: certificate.certificate_reference,
        status: certificate.status,
        format
      }
    });

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificate_reference}.json"`);
      return res.send(JSON.stringify({ exported_at: new Date().toISOString(), certificate: publicCertificate(certificate) }, null, 2));
    }

    const pdf = await createCertificatePdf(pool, certificate);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificate_reference}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    return next(err);
  }
});

function statusAction(status, previousStatus) {
  if (status === "Issued" && previousStatus !== "Issued") {
    return "certificate.issued";
  }

  if (status === "Revoked" && previousStatus !== "Revoked") {
    return "certificate.revoked";
  }

  return "certificate.updated";
}

router.post("/", requirePermission(PERMISSIONS.CERTIFICATES_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const title = cleanText(req.body.certificate_title);

    if (!title) {
      return res.status(400).json({ ok: false, error: "Certificate title is required" });
    }

    const status = cleanText(req.body.status) || "Draft";

    if (status === "Issued" && !hasPermission(req.user, PERMISSIONS.CERTIFICATES_ISSUE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to issue certificates" });
    }

    if (status === "Revoked" && !hasPermission(req.user, PERMISSIONS.CERTIFICATES_REVOKE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to revoke certificates" });
    }

    const reference = cleanText(req.body.certificate_reference) || await nextReference(pool);
    const result = await pool.query(
      `
      INSERT INTO certificates (
        certificate_reference,
        certificate_title,
        certificate_type,
        status,
        customer_id,
        building_id,
        asset_id,
        compliance_service_id,
        report_id,
        issue_date,
        expiry_date,
        certificate_body,
        issued_by,
        issued_at,
        revoked_by,
        revoked_at,
        revocation_reason,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18)
      RETURNING *
      `,
      [
        reference,
        title,
        cleanText(req.body.certificate_type) || "Compliance Certificate",
        status,
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.compliance_service_id),
        cleanInteger(req.body.report_id),
        cleanDate(req.body.issue_date),
        cleanDate(req.body.expiry_date),
        cleanText(req.body.certificate_body),
        status === "Issued" ? req.user.id : null,
        status === "Issued" ? new Date() : null,
        status === "Revoked" ? req.user.id : null,
        status === "Revoked" ? new Date() : null,
        cleanText(req.body.revocation_reason),
        req.user.id
      ]
    );

    const certificate = await joinedCertificate(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: status === "Issued" ? "certificate.issued" : status === "Revoked" ? "certificate.revoked" : "certificate.created",
      entityType: "certificate",
      entityId: result.rows[0].id,
      metadata: {
        certificate_reference: result.rows[0].certificate_reference,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({ ok: true, certificate: publicCertificate(certificate) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Certificate reference already exists" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.CERTIFICATES_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const title = cleanText(req.body.certificate_title);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid certificate ID" });
    }

    if (!title) {
      return res.status(400).json({ ok: false, error: "Certificate title is required" });
    }

    const existing = await pool.query("SELECT * FROM certificates WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Certificate not found" });
    }

    const status = cleanText(req.body.status) || "Draft";
    const isIssue = status === "Issued" && existing.rows[0].status !== "Issued";
    const isRevoke = status === "Revoked" && existing.rows[0].status !== "Revoked";

    if (isIssue && !hasPermission(req.user, PERMISSIONS.CERTIFICATES_ISSUE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to issue certificates" });
    }

    if (isRevoke && !hasPermission(req.user, PERMISSIONS.CERTIFICATES_REVOKE)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to revoke certificates" });
    }

    await pool.query(
      `
      UPDATE certificates
      SET
        certificate_reference = $1,
        certificate_title = $2,
        certificate_type = $3,
        status = $4,
        customer_id = $5,
        building_id = $6,
        asset_id = $7,
        compliance_service_id = $8,
        report_id = $9,
        issue_date = $10,
        expiry_date = $11,
        certificate_body = $12,
        issued_by = $13,
        issued_at = $14,
        revoked_by = $15,
        revoked_at = $16,
        revocation_reason = $17,
        updated_by = $18,
        updated_at = NOW()
      WHERE id = $19
      `,
      [
        cleanText(req.body.certificate_reference) || existing.rows[0].certificate_reference,
        title,
        cleanText(req.body.certificate_type) || "Compliance Certificate",
        status,
        cleanInteger(req.body.customer_id),
        cleanInteger(req.body.building_id),
        cleanInteger(req.body.asset_id),
        cleanInteger(req.body.compliance_service_id),
        cleanInteger(req.body.report_id),
        cleanDate(req.body.issue_date),
        cleanDate(req.body.expiry_date),
        cleanText(req.body.certificate_body),
        isIssue ? req.user.id : existing.rows[0].issued_by,
        isIssue ? new Date() : existing.rows[0].issued_at,
        isRevoke ? req.user.id : existing.rows[0].revoked_by,
        isRevoke ? new Date() : existing.rows[0].revoked_at,
        cleanText(req.body.revocation_reason),
        req.user.id,
        id
      ]
    );

    const certificate = await joinedCertificate(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: statusAction(status, existing.rows[0].status),
      entityType: "certificate",
      entityId: id,
      metadata: {
        certificate_reference: certificate.certificate_reference,
        previous_status: existing.rows[0].status,
        status: certificate.status
      }
    });

    return res.json({ ok: true, certificate: publicCertificate(certificate) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Certificate reference already exists" });
    }

    return next(err);
  }
});

module.exports = router;
