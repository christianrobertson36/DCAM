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

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
}

function publicBuilding(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    name: row.name,
    building_type: row.building_type,
    status: row.status,
    address_line_1: row.address_line_1,
    address_line_2: row.address_line_2,
    city: row.city,
    county: row.county,
    postcode: row.postcode,
    country: row.country,
    access_notes: row.access_notes,
    compliance_notes: row.compliance_notes,
    site_contact_name: row.site_contact_name,
    site_contact_email: row.site_contact_email,
    site_contact_phone: row.site_contact_phone,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function customerExists(pool, customerId) {
  const result = await pool.query(
    "SELECT id FROM customers WHERE id = $1 LIMIT 1",
    [customerId]
  );

  return Boolean(result.rows[0]);
}

router.get("/", requirePermission(PERMISSIONS.BUILDINGS_VIEW), async (req, res, next) => {
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
        b.name ILIKE $${values.length}
        OR b.city ILIKE $${values.length}
        OR b.postcode ILIKE $${values.length}
        OR b.site_contact_name ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`b.status = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`b.customer_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT
        b.*,
        c.company_name AS customer_name
      FROM buildings b
      JOIN customers c ON c.id = b.customer_id
      ${whereSql}
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      buildings: result.rows.map(publicBuilding)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.BUILDINGS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Active')::INT AS active,
        COUNT(*) FILTER (WHERE status = 'Survey Required')::INT AS survey_required,
        COUNT(*) FILTER (WHERE status = 'On Hold')::INT AS on_hold,
        COUNT(*) FILTER (WHERE status = 'Inactive')::INT AS inactive
      FROM buildings
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

router.get("/:id", requirePermission(PERMISSIONS.BUILDINGS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Invalid building ID"
      });
    }

    const result = await pool.query(
      `
      SELECT
        b.*,
        c.company_name AS customer_name
      FROM buildings b
      JOIN customers c ON c.id = b.customer_id
      WHERE b.id = $1
      LIMIT 1
      `,
      [id]
    );

    const building = result.rows[0];

    if (!building) {
      return res.status(404).json({
        ok: false,
        error: "Building not found"
      });
    }

    return res.json({
      ok: true,
      building: publicBuilding(building)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.BUILDINGS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();

    const customerId = cleanInteger(req.body.customer_id);
    const name = cleanText(req.body.name);

    if (!customerId) {
      return res.status(400).json({
        ok: false,
        error: "Customer is required"
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Building name is required"
      });
    }

    const exists = await customerExists(pool, customerId);

    if (!exists) {
      return res.status(400).json({
        ok: false,
        error: "Customer not found"
      });
    }

    const values = [
      customerId,
      name,
      cleanText(req.body.building_type) || "Commercial",
      cleanText(req.body.status) || "Active",
      cleanText(req.body.address_line_1),
      cleanText(req.body.address_line_2),
      cleanText(req.body.city),
      cleanText(req.body.county),
      cleanText(req.body.postcode),
      cleanText(req.body.country) || "Romania",
      cleanText(req.body.access_notes),
      cleanText(req.body.compliance_notes),
      cleanText(req.body.site_contact_name),
      cleanText(req.body.site_contact_email),
      cleanText(req.body.site_contact_phone),
      req.user.id
    ];

    const result = await pool.query(
      `
      INSERT INTO buildings (
        customer_id,
        name,
        building_type,
        status,
        address_line_1,
        address_line_2,
        city,
        county,
        postcode,
        country,
        access_notes,
        compliance_notes,
        site_contact_name,
        site_contact_email,
        site_contact_phone,
        created_by,
        updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16,
        $16
      )
      RETURNING *
      `,
      values
    );

    const joined = await pool.query(
      `
      SELECT
        b.*,
        c.company_name AS customer_name
      FROM buildings b
      JOIN customers c ON c.id = b.customer_id
      WHERE b.id = $1
      LIMIT 1
      `,
      [result.rows[0].id]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "building.created",
      entityType: "building",
      entityId: result.rows[0].id,
      metadata: {
        customer_id: result.rows[0].customer_id,
        name: result.rows[0].name,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({
      ok: true,
      building: publicBuilding(joined.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.BUILDINGS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const customerId = cleanInteger(req.body.customer_id);
    const name = cleanText(req.body.name);

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Invalid building ID"
      });
    }

    if (!customerId) {
      return res.status(400).json({
        ok: false,
        error: "Customer is required"
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Building name is required"
      });
    }

    const existing = await pool.query(
      "SELECT * FROM buildings WHERE id = $1 LIMIT 1",
      [id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({
        ok: false,
        error: "Building not found"
      });
    }

    const exists = await customerExists(pool, customerId);

    if (!exists) {
      return res.status(400).json({
        ok: false,
        error: "Customer not found"
      });
    }

    const values = [
      customerId,
      name,
      cleanText(req.body.building_type) || "Commercial",
      cleanText(req.body.status) || "Active",
      cleanText(req.body.address_line_1),
      cleanText(req.body.address_line_2),
      cleanText(req.body.city),
      cleanText(req.body.county),
      cleanText(req.body.postcode),
      cleanText(req.body.country) || "Romania",
      cleanText(req.body.access_notes),
      cleanText(req.body.compliance_notes),
      cleanText(req.body.site_contact_name),
      cleanText(req.body.site_contact_email),
      cleanText(req.body.site_contact_phone),
      req.user.id,
      id
    ];

    await pool.query(
      `
      UPDATE buildings
      SET
        customer_id = $1,
        name = $2,
        building_type = $3,
        status = $4,
        address_line_1 = $5,
        address_line_2 = $6,
        city = $7,
        county = $8,
        postcode = $9,
        country = $10,
        access_notes = $11,
        compliance_notes = $12,
        site_contact_name = $13,
        site_contact_email = $14,
        site_contact_phone = $15,
        updated_by = $16,
        updated_at = NOW()
      WHERE id = $17
      `,
      values
    );

    const joined = await pool.query(
      `
      SELECT
        b.*,
        c.company_name AS customer_name
      FROM buildings b
      JOIN customers c ON c.id = b.customer_id
      WHERE b.id = $1
      LIMIT 1
      `,
      [id]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "building.updated",
      entityType: "building",
      entityId: id,
      metadata: {
        previous_customer_id: existing.rows[0].customer_id,
        customer_id: joined.rows[0].customer_id,
        name: joined.rows[0].name,
        previous_status: existing.rows[0].status,
        status: joined.rows[0].status
      }
    });

    return res.json({
      ok: true,
      building: publicBuilding(joined.rows[0])
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
