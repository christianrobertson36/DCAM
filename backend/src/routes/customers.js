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

function publicCustomer(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    company_name: row.company_name,
    trading_name: row.trading_name,
    customer_type: row.customer_type,
    status: row.status,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address_line_1: row.address_line_1,
    address_line_2: row.address_line_2,
    city: row.city,
    county: row.county,
    postcode: row.postcode,
    country: row.country,
    primary_contact_name: row.primary_contact_name,
    primary_contact_email: row.primary_contact_email,
    primary_contact_phone: row.primary_contact_phone,
    notes: row.notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

router.get("/", requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);

    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        company_name ILIKE $${values.length}
        OR trading_name ILIKE $${values.length}
        OR email ILIKE $${values.length}
        OR primary_contact_name ILIKE $${values.length}
        OR postcode ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      customers: result.rows.map(publicCustomer)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Prospect')::INT AS prospects,
        COUNT(*) FILTER (WHERE status = 'Active')::INT AS active,
        COUNT(*) FILTER (WHERE status = 'On Hold')::INT AS on_hold,
        COUNT(*) FILTER (WHERE status = 'Inactive')::INT AS inactive
      FROM customers
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

router.get("/:id", requirePermission(PERMISSIONS.CUSTOMERS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        ok: false,
        error: "Invalid customer ID"
      });
    }

    const result = await pool.query(
      "SELECT * FROM customers WHERE id = $1 LIMIT 1",
      [id]
    );

    const customer = result.rows[0];

    if (!customer) {
      return res.status(404).json({
        ok: false,
        error: "Customer not found"
      });
    }

    return res.json({
      ok: true,
      customer: publicCustomer(customer)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.CUSTOMERS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();

    const companyName = cleanText(req.body.company_name);

    if (!companyName) {
      return res.status(400).json({
        ok: false,
        error: "Company name is required"
      });
    }

    const values = [
      companyName,
      cleanText(req.body.trading_name),
      cleanText(req.body.customer_type) || "Commercial",
      cleanText(req.body.status) || "Prospect",
      cleanText(req.body.email),
      cleanText(req.body.phone),
      cleanText(req.body.website),
      cleanText(req.body.address_line_1),
      cleanText(req.body.address_line_2),
      cleanText(req.body.city),
      cleanText(req.body.county),
      cleanText(req.body.postcode),
      cleanText(req.body.country) || "Romania",
      cleanText(req.body.primary_contact_name),
      cleanText(req.body.primary_contact_email),
      cleanText(req.body.primary_contact_phone),
      cleanText(req.body.notes),
      req.user.id
    ];

    const result = await pool.query(
      `
      INSERT INTO customers (
        company_name,
        trading_name,
        customer_type,
        status,
        email,
        phone,
        website,
        address_line_1,
        address_line_2,
        city,
        county,
        postcode,
        country,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        notes,
        created_by,
        updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $18
      )
      RETURNING *
      `,
      values
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "customer.created",
      entityType: "customer",
      entityId: result.rows[0].id,
      metadata: {
        company_name: result.rows[0].company_name,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({
      ok: true,
      customer: publicCustomer(result.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.CUSTOMERS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        ok: false,
        error: "Invalid customer ID"
      });
    }

    const existing = await pool.query(
      "SELECT * FROM customers WHERE id = $1 LIMIT 1",
      [id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({
        ok: false,
        error: "Customer not found"
      });
    }

    const companyName = cleanText(req.body.company_name);

    if (!companyName) {
      return res.status(400).json({
        ok: false,
        error: "Company name is required"
      });
    }

    const values = [
      companyName,
      cleanText(req.body.trading_name),
      cleanText(req.body.customer_type) || "Commercial",
      cleanText(req.body.status) || "Prospect",
      cleanText(req.body.email),
      cleanText(req.body.phone),
      cleanText(req.body.website),
      cleanText(req.body.address_line_1),
      cleanText(req.body.address_line_2),
      cleanText(req.body.city),
      cleanText(req.body.county),
      cleanText(req.body.postcode),
      cleanText(req.body.country) || "Romania",
      cleanText(req.body.primary_contact_name),
      cleanText(req.body.primary_contact_email),
      cleanText(req.body.primary_contact_phone),
      cleanText(req.body.notes),
      req.user.id,
      id
    ];

    const result = await pool.query(
      `
      UPDATE customers
      SET
        company_name = $1,
        trading_name = $2,
        customer_type = $3,
        status = $4,
        email = $5,
        phone = $6,
        website = $7,
        address_line_1 = $8,
        address_line_2 = $9,
        city = $10,
        county = $11,
        postcode = $12,
        country = $13,
        primary_contact_name = $14,
        primary_contact_email = $15,
        primary_contact_phone = $16,
        notes = $17,
        updated_by = $18,
        updated_at = NOW()
      WHERE id = $19
      RETURNING *
      `,
      values
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "customer.updated",
      entityType: "customer",
      entityId: result.rows[0].id,
      metadata: {
        company_name: result.rows[0].company_name,
        previous_status: existing.rows[0].status,
        status: result.rows[0].status
      }
    });

    return res.json({
      ok: true,
      customer: publicCustomer(result.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
