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

function cleanBoolean(value) {
  return value === true || value === "true";
}

function publicContact(row) {
  return {
    id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    contact_reference: row.contact_reference,
    first_name: row.first_name,
    last_name: row.last_name,
    job_title: row.job_title,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    contact_type: row.contact_type,
    status: row.status,
    is_primary: row.is_primary,
    notes: row.notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextReference(pool) {
  const result = await pool.query(
    "SELECT 'CON-' || LPAD(nextval('contact_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function customerExists(pool, customerId) {
  const result = await pool.query("SELECT id FROM customers WHERE id = $1 LIMIT 1", [customerId]);
  return Boolean(result.rows[0]);
}

async function joinedContact(pool, id) {
  const result = await pool.query(
    `
    SELECT ct.*, c.company_name AS customer_name
    FROM contacts ct
    JOIN customers c ON c.id = ct.customer_id
    WHERE ct.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.CONTACTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const customerId = cleanInteger(req.query.customer_id);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        ct.contact_reference ILIKE $${values.length}
        OR ct.first_name ILIKE $${values.length}
        OR ct.last_name ILIKE $${values.length}
        OR ct.email ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`ct.status = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`ct.customer_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT ct.*, c.company_name AS customer_name
      FROM contacts ct
      JOIN customers c ON c.id = ct.customer_id
      ${whereSql}
      ORDER BY ct.updated_at DESC, ct.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({ ok: true, contacts: result.rows.map(publicContact) });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.CONTACTS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Active')::INT AS active,
        COUNT(*) FILTER (WHERE status = 'Inactive')::INT AS inactive,
        COUNT(*) FILTER (WHERE is_primary = TRUE)::INT AS primary_contacts
      FROM contacts
      `
    );

    return res.json({ ok: true, summary: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.CONTACTS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerId = cleanInteger(req.body.customer_id);
    const firstName = cleanText(req.body.first_name);

    if (!customerId) {
      return res.status(400).json({ ok: false, error: "Customer is required" });
    }

    if (!firstName) {
      return res.status(400).json({ ok: false, error: "First name is required" });
    }

    if (!await customerExists(pool, customerId)) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }

    const reference = cleanText(req.body.contact_reference) || await nextReference(pool);
    const result = await pool.query(
      `
      INSERT INTO contacts (
        customer_id,
        contact_reference,
        first_name,
        last_name,
        job_title,
        email,
        phone,
        mobile,
        contact_type,
        status,
        is_primary,
        notes,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
      RETURNING *
      `,
      [
        customerId,
        reference,
        firstName,
        cleanText(req.body.last_name),
        cleanText(req.body.job_title),
        cleanText(req.body.email),
        cleanText(req.body.phone),
        cleanText(req.body.mobile),
        cleanText(req.body.contact_type) || "Primary",
        cleanText(req.body.status) || "Active",
        cleanBoolean(req.body.is_primary),
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    const contact = await joinedContact(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "contact.created",
      entityType: "contact",
      entityId: result.rows[0].id,
      metadata: {
        contact_reference: result.rows[0].contact_reference,
        customer_id: result.rows[0].customer_id
      }
    });

    return res.status(201).json({ ok: true, contact: publicContact(contact) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Contact reference already exists" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.CONTACTS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const customerId = cleanInteger(req.body.customer_id);
    const firstName = cleanText(req.body.first_name);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid contact ID" });
    }

    if (!customerId) {
      return res.status(400).json({ ok: false, error: "Customer is required" });
    }

    if (!firstName) {
      return res.status(400).json({ ok: false, error: "First name is required" });
    }

    const existing = await pool.query("SELECT * FROM contacts WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Contact not found" });
    }

    if (!await customerExists(pool, customerId)) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }

    await pool.query(
      `
      UPDATE contacts
      SET
        customer_id = $1,
        contact_reference = $2,
        first_name = $3,
        last_name = $4,
        job_title = $5,
        email = $6,
        phone = $7,
        mobile = $8,
        contact_type = $9,
        status = $10,
        is_primary = $11,
        notes = $12,
        updated_by = $13,
        updated_at = NOW()
      WHERE id = $14
      `,
      [
        customerId,
        cleanText(req.body.contact_reference) || existing.rows[0].contact_reference,
        firstName,
        cleanText(req.body.last_name),
        cleanText(req.body.job_title),
        cleanText(req.body.email),
        cleanText(req.body.phone),
        cleanText(req.body.mobile),
        cleanText(req.body.contact_type) || "Primary",
        cleanText(req.body.status) || "Active",
        cleanBoolean(req.body.is_primary),
        cleanText(req.body.notes),
        req.user.id,
        id
      ]
    );

    const contact = await joinedContact(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "contact.updated",
      entityType: "contact",
      entityId: id,
      metadata: {
        contact_reference: contact.contact_reference,
        previous_customer_id: existing.rows[0].customer_id,
        customer_id: contact.customer_id,
        status: contact.status
      }
    });

    return res.json({ ok: true, contact: publicContact(contact) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Contact reference already exists" });
    }

    return next(err);
  }
});

module.exports = router;
