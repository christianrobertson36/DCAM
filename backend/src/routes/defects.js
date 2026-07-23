const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

const { ROLES } = require("../config/roles");
const { PERMISSIONS, hasPermission } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const uploadRoot = process.env.UPLOADS_PATH || "/app/uploads";
const maximumFileBytes = 5 * 1024 * 1024;
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

router.use(authRequired);

const text = (value) => String(value || "").trim();
const optionalText = (value) => text(value) || null;
const id = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : null;

async function customerIdsForUser(pool, user) {
  if (user.role !== ROLES.CUSTOMER) return null;
  const result = await pool.query(
    `
    SELECT DISTINCT c.id
    FROM customers c
    LEFT JOIN customer_portal_access cpa
      ON cpa.customer_id = c.id
      AND cpa.user_id = $1
      AND cpa.status = 'Active'
    WHERE cpa.id IS NOT NULL
       OR LOWER(COALESCE(c.email, '')) = LOWER($2)
       OR LOWER(COALESCE(c.primary_contact_email, '')) = LOWER($2)
    `,
    [user.id, user.email]
  );
  return result.rows.map((row) => Number(row.id));
}

function joinedDefectSql() {
  return `
    SELECT
      d.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      cs.service_reference AS compliance_service_reference,
      sr.request_reference AS service_request_reference,
      wo.work_order_reference,
      assigned.name AS assigned_user_name,
      verifier.name AS verified_by_name,
      (d.target_date < CURRENT_DATE AND d.status NOT IN ('Verified', 'Closed')) AS overdue
    FROM defects d
    JOIN customers c ON c.id = d.customer_id
    LEFT JOIN buildings b ON b.id = d.building_id
    LEFT JOIN assets a ON a.id = d.asset_id
    LEFT JOIN compliance_services cs ON cs.id = d.compliance_service_id
    LEFT JOIN service_requests sr ON sr.id = d.service_request_id
    LEFT JOIN work_orders wo ON wo.id = d.work_order_id
    LEFT JOIN users assigned ON assigned.id = d.assigned_user_id
    LEFT JOIN users verifier ON verifier.id = d.verified_by
  `;
}

async function getDefect(pool, defectId, customerIds) {
  const values = [defectId];
  let scope = "";
  if (customerIds !== null) {
    if (!customerIds.length) scope = " AND FALSE";
    else {
      values.push(customerIds);
      scope = ` AND d.customer_id = ANY($${values.length}::int[])`;
    }
  }
  const result = await pool.query(
    `${joinedDefectSql()} WHERE d.id = $1 ${scope} LIMIT 1`,
    values
  );
  return result.rows[0] || null;
}

async function validateLinks(pool, customerId, buildingId, assetId, serviceId) {
  const customer = await pool.query("SELECT id FROM customers WHERE id = $1", [customerId]);
  if (!customer.rows[0]) return "Customer not found";
  if (buildingId) {
    const building = await pool.query(
      "SELECT id FROM buildings WHERE id = $1 AND customer_id = $2",
      [buildingId, customerId]
    );
    if (!building.rows[0]) return "Building does not belong to the selected customer";
  }
  if (assetId) {
    const asset = await pool.query(
      `
      SELECT a.id
      FROM assets a
      JOIN buildings b ON b.id = a.building_id
      WHERE a.id = $1
        AND b.customer_id = $2
        AND ($3::int IS NULL OR a.building_id = $3)
      `,
      [assetId, customerId, buildingId]
    );
    if (!asset.rows[0]) return "Asset does not belong to the selected customer and building";
  }
  if (serviceId) {
    const service = await pool.query(
      "SELECT id FROM compliance_services WHERE id = $1 AND customer_id = $2",
      [serviceId, customerId]
    );
    if (!service.rows[0]) return "Compliance service does not belong to the selected customer";
  }
  return null;
}

router.get("/summary", requirePermission(PERMISSIONS.DEFECTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const values = [];
    let scope = "";
    if (customerIds !== null) {
      if (!customerIds.length) scope = " AND FALSE";
      else {
        values.push(customerIds);
        scope = " AND customer_id = ANY($1::int[])";
      }
    }
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Open')::int AS open,
        COUNT(*) FILTER (WHERE status = 'In Progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Awaiting Verification')::int AS awaiting_verification,
        COUNT(*) FILTER (WHERE status = 'Verified')::int AS verified,
        COUNT(*) FILTER (WHERE status = 'Closed')::int AS closed,
        COUNT(*) FILTER (WHERE severity = 'Critical' AND status NOT IN ('Verified', 'Closed'))::int AS critical,
        COUNT(*) FILTER (WHERE target_date < CURRENT_DATE AND status NOT IN ('Verified', 'Closed'))::int AS overdue
      FROM defects
      WHERE TRUE ${scope}
      `,
      values
    );
    return res.json({ ok: true, summary: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get("/", requirePermission(PERMISSIONS.DEFECTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const values = [];
    const where = ["TRUE"];
    const search = text(req.query.search);
    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        d.defect_reference ILIKE $${values.length}
        OR d.title ILIKE $${values.length}
        OR d.description ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
        OR COALESCE(b.name, '') ILIKE $${values.length}
      )`);
    }
    for (const [key, column] of [["status", "d.status"], ["severity", "d.severity"], ["risk_rating", "d.risk_rating"]]) {
      const value = text(req.query[key]);
      if (value) {
        values.push(value);
        where.push(`${column} = $${values.length}`);
      }
    }
    if (customerIds !== null) {
      if (!customerIds.length) where.push("FALSE");
      else {
        values.push(customerIds);
        where.push(`d.customer_id = ANY($${values.length}::int[])`);
      }
    }
    const result = await pool.query(
      `
      ${joinedDefectSql()}
      WHERE ${where.join(" AND ")}
      ORDER BY
        CASE d.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
        d.created_at DESC
      `,
      values
    );
    return res.json({ ok: true, defects: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", requirePermission(PERMISSIONS.DEFECTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const defect = await getDefect(pool, id(req.params.id), customerIds);
    if (!defect) return res.status(404).json({ ok: false, error: "Defect not found" });
    return res.json({ ok: true, defect });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requirePermission(PERMISSIONS.DEFECTS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const customerId = id(req.body.customer_id);
    const buildingId = id(req.body.building_id);
    const assetId = id(req.body.asset_id);
    const serviceId = id(req.body.compliance_service_id);
    if (!customerId || !text(req.body.title) || !text(req.body.description)) {
      return res.status(400).json({ ok: false, error: "Customer, title and description are required" });
    }
    if (customerIds !== null && !customerIds.includes(customerId)) {
      return res.status(403).json({ ok: false, error: "You cannot create a defect for this customer" });
    }
    const linkError = await validateLinks(pool, customerId, buildingId, assetId, serviceId);
    if (linkError) return res.status(400).json({ ok: false, error: linkError });

    const result = await pool.query(
      `
      INSERT INTO defects (
        defect_reference, title, description, category, severity, risk_rating,
        status, customer_id, building_id, asset_id, compliance_service_id,
        assigned_user_id, identified_date, target_date, corrective_action,
        created_by, updated_by
      )
      VALUES (
        'DF-' || LPAD(nextval('defect_reference_seq')::text, 6, '0'),
        $1, $2, $3, $4, $5, 'Open', $6, $7, $8, $9, $10, COALESCE($11, CURRENT_DATE),
        $12, $13, $14, $14
      )
      RETURNING id
      `,
      [
        text(req.body.title),
        text(req.body.description),
        text(req.body.category) || "General",
        text(req.body.severity) || "Medium",
        text(req.body.risk_rating) || "Medium",
        customerId,
        buildingId,
        assetId,
        serviceId,
        id(req.body.assigned_user_id),
        date(req.body.identified_date),
        date(req.body.target_date),
        optionalText(req.body.corrective_action),
        req.user.id
      ]
    );
    const defectId = result.rows[0].id;
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "defect.created",
      entityType: "defect",
      entityId: defectId,
      metadata: { customer_id: customerId, severity: text(req.body.severity) || "Medium" }
    });
    return res.status(201).json({
      ok: true,
      defect: await getDefect(pool, defectId, customerIds)
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.DEFECTS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const defectId = id(req.params.id);
    const existing = await getDefect(pool, defectId, customerIds);
    if (!existing) return res.status(404).json({ ok: false, error: "Defect not found" });
    const customerId = id(req.body.customer_id) || Number(existing.customer_id);
    const buildingId = req.body.building_id === undefined ? id(existing.building_id) : id(req.body.building_id);
    const assetId = req.body.asset_id === undefined ? id(existing.asset_id) : id(req.body.asset_id);
    const serviceId = req.body.compliance_service_id === undefined ? id(existing.compliance_service_id) : id(req.body.compliance_service_id);
    const linkError = await validateLinks(pool, customerId, buildingId, assetId, serviceId);
    if (linkError) return res.status(400).json({ ok: false, error: linkError });
    let assignedUserId = id(existing.assigned_user_id);
    if (req.body.assigned_user_id !== undefined) {
      if (!hasPermission(req.user, PERMISSIONS.DEFECTS_ASSIGN)) {
        return res.status(403).json({ ok: false, error: "You cannot assign defects" });
      }
      assignedUserId = id(req.body.assigned_user_id);
    }
    const status = text(req.body.status || existing.status);
    if (["Verified", "Closed"].includes(status) && status !== existing.status) {
      return res.status(400).json({ ok: false, error: "Use the dedicated verify or close action" });
    }
    await pool.query(
      `
      UPDATE defects SET
        title = $2, description = $3, category = $4, severity = $5,
        risk_rating = $6, status = $7, customer_id = $8, building_id = $9,
        asset_id = $10, compliance_service_id = $11, assigned_user_id = $12,
        identified_date = $13, target_date = $14, corrective_action = $15,
        updated_by = $16, updated_at = NOW()
      WHERE id = $1
      `,
      [
        defectId,
        text(req.body.title || existing.title),
        text(req.body.description || existing.description),
        text(req.body.category || existing.category),
        text(req.body.severity || existing.severity),
        text(req.body.risk_rating || existing.risk_rating),
        status,
        customerId,
        buildingId,
        assetId,
        serviceId,
        assignedUserId,
        date(req.body.identified_date) || existing.identified_date,
        req.body.target_date === undefined ? existing.target_date : date(req.body.target_date),
        req.body.corrective_action === undefined ? existing.corrective_action : optionalText(req.body.corrective_action),
        req.user.id
      ]
    );
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "defect.updated",
      entityType: "defect",
      entityId: defectId,
      metadata: { status, severity: text(req.body.severity || existing.severity) }
    });
    return res.json({ ok: true, defect: await getDefect(pool, defectId, customerIds) });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/work-order", requirePermission(PERMISSIONS.DEFECTS_EDIT), async (req, res, next) => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    if (!hasPermission(req.user, PERMISSIONS.WORK_ORDERS_CREATE)) {
      return res.status(403).json({ ok: false, error: "Work order creation permission is required" });
    }
    const customerIds = await customerIdsForUser(client, req.user);
    const defect = await getDefect(client, id(req.params.id), customerIds);
    if (!defect) return res.status(404).json({ ok: false, error: "Defect not found" });
    if (defect.work_order_id) return res.status(409).json({ ok: false, error: "A work order is already linked" });
    await client.query("BEGIN");
    const result = await client.query(
      `
      INSERT INTO work_orders (
        work_order_reference, work_order_type, title, description, priority,
        status, customer_id, building_id, asset_id, assigned_user_id, due_date,
        created_by, updated_by
      )
      VALUES (
        'WO-' || LPAD(nextval('work_order_reference_seq')::text, 6, '0'),
        'Repair', $1, $2, $3, 'Open', $4, $5, $6, $7, $8, $9, $9
      )
      RETURNING id, work_order_reference
      `,
      [
        `Corrective action: ${defect.title}`,
        defect.corrective_action || defect.description,
        {
          Critical: "Urgent",
          High: "High",
          Medium: "Normal",
          Low: "Low"
        }[defect.severity] || "Normal",
        defect.customer_id,
        defect.building_id,
        defect.asset_id,
        defect.assigned_user_id,
        defect.target_date,
        req.user.id
      ]
    );
    await client.query(
      "UPDATE defects SET work_order_id = $2, status = 'In Progress', updated_by = $3, updated_at = NOW() WHERE id = $1",
      [defect.id, result.rows[0].id, req.user.id]
    );
    await writeAuditEvent(client, {
      actorUserId: req.user.id,
      action: "defect.work_order_created",
      entityType: "defect",
      entityId: defect.id,
      metadata: result.rows[0]
    });
    await client.query("COMMIT");
    return res.json({ ok: true, work_order: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
});

router.post("/:id/verify", requirePermission(PERMISSIONS.DEFECTS_VERIFY), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const defect = await getDefect(pool, id(req.params.id), customerIds);
    if (!defect) return res.status(404).json({ ok: false, error: "Defect not found" });
    if (defect.status !== "Awaiting Verification") {
      return res.status(409).json({
        ok: false,
        error: "Defect must be awaiting verification before it can be verified"
      });
    }
    if (!text(req.body.verification_notes)) {
      return res.status(400).json({ ok: false, error: "Verification notes are required" });
    }
    await pool.query(
      `
      UPDATE defects SET
        status = 'Verified', verification_notes = $2, verified_at = NOW(),
        verified_by = $3, updated_by = $3, updated_at = NOW()
      WHERE id = $1
      `,
      [defect.id, text(req.body.verification_notes), req.user.id]
    );
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "defect.verified",
      entityType: "defect",
      entityId: defect.id
    });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/close", requirePermission(PERMISSIONS.DEFECTS_CLOSE), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const defect = await getDefect(pool, id(req.params.id), customerIds);
    if (!defect) return res.status(404).json({ ok: false, error: "Defect not found" });
    if (defect.status !== "Verified") {
      return res.status(409).json({ ok: false, error: "A defect must be verified before closure" });
    }
    await pool.query(
      "UPDATE defects SET status = 'Closed', closed_at = NOW(), closed_by = $2, updated_by = $2, updated_at = NOW() WHERE id = $1",
      [defect.id, req.user.id]
    );
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "defect.closed",
      entityType: "defect",
      entityId: defect.id
    });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/files", requirePermission(PERMISSIONS.DEFECTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const defect = await getDefect(pool, id(req.params.id), customerIds);
    if (!defect) return res.status(404).json({ ok: false, error: "Defect not found" });
    const visibility = req.user.role === ROLES.CUSTOMER ? " AND df.visibility = 'Customer Visible'" : "";
    const result = await pool.query(
      `
      SELECT df.id, df.original_filename, df.content_type, df.file_size,
             df.visibility, df.evidence_stage, df.created_at, u.name AS uploaded_by_name
      FROM defect_files df
      LEFT JOIN users u ON u.id = df.uploaded_by
      WHERE df.defect_id = $1 ${visibility}
      ORDER BY df.created_at DESC
      `,
      [defect.id]
    );
    return res.json({ ok: true, files: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/files", requirePermission(PERMISSIONS.DEFECTS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const defect = await getDefect(pool, id(req.params.id), customerIds);
    if (!defect) return res.status(404).json({ ok: false, error: "Defect not found" });
    const contentType = text(req.body.content_type).toLowerCase();
    if (!text(req.body.filename)) {
      return res.status(400).json({ ok: false, error: "Filename is required" });
    }
    if (!allowedContentTypes.has(contentType)) {
      return res.status(400).json({ ok: false, error: "Only PNG, JPEG, WebP and PDF files are supported" });
    }
    const buffer = Buffer.from(text(req.body.data).replace(/^data:[^;]+;base64,/, ""), "base64");
    if (!buffer.length || buffer.length > maximumFileBytes) {
      return res.status(400).json({ ok: false, error: "File must be between 1 byte and 5 MB" });
    }
    const extension = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf" }[contentType];
    const storedFilename = `${crypto.randomUUID()}${extension}`;
    const folder = path.join(uploadRoot, "defects", String(defect.id));
    await fs.promises.mkdir(folder, { recursive: true });
    await fs.promises.writeFile(path.join(folder, storedFilename), buffer);
    const visibility = req.user.role === ROLES.CUSTOMER ? "Customer Visible" : text(req.body.visibility) === "Internal" ? "Internal" : "Customer Visible";
    const fileResult = await pool.query(
      `
      INSERT INTO defect_files (
        defect_id, original_filename, stored_filename, content_type,
        file_size, visibility, evidence_stage, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
      `,
      [
        defect.id,
        path.basename(text(req.body.filename)),
        storedFilename,
        contentType,
        buffer.length,
        visibility,
        text(req.body.evidence_stage) || "Identification",
        req.user.id
      ]
    );
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "defect.evidence_uploaded",
      entityType: "defect",
      entityId: defect.id,
      metadata: {
        file_id: fileResult.rows[0].id,
        evidence_stage: text(req.body.evidence_stage) || "Identification",
        visibility
      }
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/files/:fileId/download", requirePermission(PERMISSIONS.DEFECTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerIds = await customerIdsForUser(pool, req.user);
    const defect = await getDefect(pool, id(req.params.id), customerIds);
    if (!defect) return res.status(404).json({ ok: false, error: "File not found" });
    const result = await pool.query(
      `
      SELECT * FROM defect_files
      WHERE id = $1 AND defect_id = $2
        AND ($3::boolean = FALSE OR visibility = 'Customer Visible')
      LIMIT 1
      `,
      [id(req.params.fileId), defect.id, req.user.role === ROLES.CUSTOMER]
    );
    const file = result.rows[0];
    if (!file) return res.status(404).json({ ok: false, error: "File not found" });
    const filePath = path.join(uploadRoot, "defects", String(defect.id), file.stored_filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: "Stored file not found" });
    res.setHeader("Content-Type", file.content_type);
    return res.download(filePath, file.original_filename);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
