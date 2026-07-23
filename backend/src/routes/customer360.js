const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const uploadRoot = process.env.UPLOADS_PATH || "/app/uploads";
const maximumFileBytes = 5 * 1024 * 1024;
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

router.use(authRequired);

const cleanText = (value) => String(value || "").trim() || null;
const cleanId = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

async function customerExists(pool, customerId) {
  const result = await pool.query("SELECT id FROM customers WHERE id = $1", [customerId]);
  return Boolean(result.rows[0]);
}

router.get("/:id/overview", requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerId = cleanId(req.params.id);
    if (!customerId || !(await customerExists(pool, customerId))) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }
    const [account, summary, contacts, activities, documents] = await Promise.all([
      pool.query(
        `
        SELECT c.account_owner_id, owner.name AS account_owner_name,
               c.billing_contact_name, c.billing_contact_email,
               c.billing_contact_phone, c.account_risk
        FROM customers c
        LEFT JOIN users owner ON owner.id = c.account_owner_id
        WHERE c.id = $1
        `,
        [customerId]
      ),
      pool.query(
        `
        SELECT
          (SELECT COUNT(*)::int FROM contacts WHERE customer_id = $1) AS contacts,
          (SELECT COUNT(*)::int FROM buildings WHERE customer_id = $1) AS buildings,
          (SELECT COUNT(*)::int FROM assets a JOIN buildings b ON b.id = a.building_id WHERE b.customer_id = $1) AS assets,
          (SELECT COUNT(*)::int FROM work_orders WHERE customer_id = $1 AND status NOT IN ('Completed', 'Cancelled')) AS open_work_orders,
          (SELECT COUNT(*)::int FROM service_requests WHERE customer_id = $1 AND status NOT IN ('Closed', 'Rejected')) AS open_requests,
          (SELECT COUNT(*)::int FROM defects WHERE customer_id = $1 AND status NOT IN ('Verified', 'Closed')) AS open_defects,
          (SELECT COUNT(*)::int FROM reports WHERE customer_id = $1) AS reports,
          (SELECT COUNT(*)::int FROM certificates WHERE customer_id = $1) AS certificates,
          (SELECT COUNT(*)::int FROM pipeline_opportunities WHERE customer_id = $1 AND status = 'Open') AS open_opportunities
        `,
        [customerId]
      ),
      pool.query(
        `
        SELECT id, contact_reference, first_name, last_name, job_title, email,
               phone, mobile, contact_type, status, is_primary
        FROM contacts
        WHERE customer_id = $1
        ORDER BY is_primary DESC, first_name ASC, last_name ASC
        LIMIT 50
        `,
        [customerId]
      ),
      pool.query(
        `
        SELECT ca.*, u.name AS created_by_name
        FROM customer_activities ca
        LEFT JOIN users u ON u.id = ca.created_by
        WHERE ca.customer_id = $1
        ORDER BY ca.occurred_at DESC, ca.id DESC
        LIMIT 100
        `,
        [customerId]
      ),
      pool.query(
        `
        SELECT cd.id, cd.document_type, cd.original_filename, cd.content_type,
               cd.file_size, cd.created_at, u.name AS uploaded_by_name
        FROM customer_documents cd
        LEFT JOIN users u ON u.id = cd.uploaded_by
        WHERE cd.customer_id = $1
        ORDER BY cd.created_at DESC, cd.id DESC
        LIMIT 100
        `,
        [customerId]
      )
    ]);
    return res.json({
      ok: true,
      account: account.rows[0],
      summary: summary.rows[0],
      contacts: contacts.rows,
      activities: activities.rows,
      documents: documents.rows
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/account", requirePermission(PERMISSIONS.CUSTOMERS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerId = cleanId(req.params.id);
    if (!customerId || !(await customerExists(pool, customerId))) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }
    await pool.query(
      `
      UPDATE customers SET
        account_owner_id = $2,
        billing_contact_name = $3,
        billing_contact_email = $4,
        billing_contact_phone = $5,
        account_risk = $6,
        updated_by = $7,
        updated_at = NOW()
      WHERE id = $1
      `,
      [
        customerId,
        cleanId(req.body.account_owner_id),
        cleanText(req.body.billing_contact_name),
        cleanText(req.body.billing_contact_email),
        cleanText(req.body.billing_contact_phone),
        cleanText(req.body.account_risk) || "Normal",
        req.user.id
      ]
    );
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "customer.account_updated",
      entityType: "customer",
      entityId: customerId,
      metadata: { account_risk: cleanText(req.body.account_risk) || "Normal" }
    });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/activities", requirePermission(PERMISSIONS.CUSTOMERS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerId = cleanId(req.params.id);
    const subject = cleanText(req.body.subject);
    if (!customerId || !(await customerExists(pool, customerId))) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }
    if (!subject) return res.status(400).json({ ok: false, error: "Activity subject is required" });
    const result = await pool.query(
      `
      INSERT INTO customer_activities (
        customer_id, activity_type, subject, details, occurred_at, created_by
      )
      VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()), $6)
      RETURNING id
      `,
      [
        customerId,
        cleanText(req.body.activity_type) || "Note",
        subject,
        cleanText(req.body.details),
        cleanText(req.body.occurred_at),
        req.user.id
      ]
    );
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "customer.activity_created",
      entityType: "customer",
      entityId: customerId,
      metadata: { activity_id: result.rows[0].id, activity_type: cleanText(req.body.activity_type) || "Note" }
    });
    return res.status(201).json({ ok: true, activity_id: result.rows[0].id });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/documents", requirePermission(PERMISSIONS.CUSTOMERS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerId = cleanId(req.params.id);
    if (!customerId || !(await customerExists(pool, customerId))) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }
    const filename = cleanText(req.body.filename);
    const contentType = String(req.body.content_type || "").trim().toLowerCase();
    if (!filename || !allowedContentTypes.has(contentType)) {
      return res.status(400).json({ ok: false, error: "A supported PNG, JPEG, WebP or PDF file is required" });
    }
    const buffer = Buffer.from(String(req.body.data || "").replace(/^data:[^;]+;base64,/, ""), "base64");
    if (!buffer.length || buffer.length > maximumFileBytes) {
      return res.status(400).json({ ok: false, error: "File must be between 1 byte and 5 MB" });
    }
    const extension = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf" }[contentType];
    const storedFilename = `${crypto.randomUUID()}${extension}`;
    const folder = path.join(uploadRoot, "customers", String(customerId));
    await fs.promises.mkdir(folder, { recursive: true });
    await fs.promises.writeFile(path.join(folder, storedFilename), buffer);
    const result = await pool.query(
      `
      INSERT INTO customer_documents (
        customer_id, document_type, original_filename, stored_filename,
        content_type, file_size, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        customerId,
        cleanText(req.body.document_type) || "General",
        path.basename(filename),
        storedFilename,
        contentType,
        buffer.length,
        req.user.id
      ]
    );
    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "customer.document_uploaded",
      entityType: "customer",
      entityId: customerId,
      metadata: { document_id: result.rows[0].id, document_type: cleanText(req.body.document_type) || "General" }
    });
    return res.status(201).json({ ok: true, document_id: result.rows[0].id });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/documents/:documentId/download", requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerId = cleanId(req.params.id);
    const documentId = cleanId(req.params.documentId);
    const result = await pool.query(
      "SELECT * FROM customer_documents WHERE id = $1 AND customer_id = $2 LIMIT 1",
      [documentId, customerId]
    );
    const document = result.rows[0];
    if (!document) return res.status(404).json({ ok: false, error: "Document not found" });
    const filePath = path.join(uploadRoot, "customers", String(customerId), document.stored_filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: "Stored file not found" });
    res.setHeader("Content-Type", document.content_type);
    return res.download(filePath, document.original_filename);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
