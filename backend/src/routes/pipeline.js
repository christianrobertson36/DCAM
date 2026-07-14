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

function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function cleanDate(value) {
  const text = cleanText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function publicOpportunity(row) {
  return {
    id: row.id,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    contact_id: row.contact_id,
    contact_name: row.contact_name,
    opportunity_reference: row.opportunity_reference,
    opportunity_name: row.opportunity_name,
    stage: row.stage,
    status: row.status,
    estimated_value: row.estimated_value,
    probability: row.probability,
    expected_close_date: row.expected_close_date,
    owner_user_id: row.owner_user_id,
    owner_name: row.owner_name,
    source: row.source,
    next_action: row.next_action,
    notes: row.notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextReference(pool) {
  const result = await pool.query(
    "SELECT 'OPP-' || LPAD(nextval('opportunity_reference_seq')::TEXT, 6, '0') AS reference"
  );
  return result.rows[0].reference;
}

async function validateCustomer(pool, customerId) {
  const result = await pool.query("SELECT id FROM customers WHERE id = $1 LIMIT 1", [customerId]);
  return Boolean(result.rows[0]);
}

async function validateContact(pool, contactId, customerId) {
  if (!contactId) {
    return true;
  }

  const result = await pool.query(
    "SELECT id FROM contacts WHERE id = $1 AND customer_id = $2 LIMIT 1",
    [contactId, customerId]
  );
  return Boolean(result.rows[0]);
}

async function joinedOpportunity(pool, id) {
  const result = await pool.query(
    `
    SELECT
      po.*,
      c.company_name AS customer_name,
      TRIM(CONCAT(ct.first_name, ' ', COALESCE(ct.last_name, ''))) AS contact_name,
      u.name AS owner_name
    FROM pipeline_opportunities po
    JOIN customers c ON c.id = po.customer_id
    LEFT JOIN contacts ct ON ct.id = po.contact_id
    LEFT JOIN users u ON u.id = po.owner_user_id
    WHERE po.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.PIPELINE_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const stage = cleanText(req.query.stage);
    const customerId = cleanInteger(req.query.customer_id);
    const ownerUserId = cleanInteger(req.query.owner_user_id);
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        po.opportunity_reference ILIKE $${values.length}
        OR po.opportunity_name ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`po.status = $${values.length}`);
    }

    if (stage) {
      values.push(stage);
      where.push(`po.stage = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`po.customer_id = $${values.length}`);
    }

    if (ownerUserId) {
      values.push(ownerUserId);
      where.push(`po.owner_user_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query(
      `
      SELECT
        po.*,
        c.company_name AS customer_name,
        TRIM(CONCAT(ct.first_name, ' ', COALESCE(ct.last_name, ''))) AS contact_name,
        u.name AS owner_name
      FROM pipeline_opportunities po
      JOIN customers c ON c.id = po.customer_id
      LEFT JOIN contacts ct ON ct.id = po.contact_id
      LEFT JOIN users u ON u.id = po.owner_user_id
      ${whereSql}
      ORDER BY po.updated_at DESC, po.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({ ok: true, opportunities: result.rows.map(publicOpportunity) });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.PIPELINE_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Open')::INT AS open,
        COUNT(*) FILTER (WHERE status = 'Won')::INT AS won,
        COUNT(*) FILTER (WHERE status = 'Lost')::INT AS lost,
        COALESCE(SUM(estimated_value) FILTER (WHERE status = 'Open'), 0)::NUMERIC(12, 2) AS open_value
      FROM pipeline_opportunities
      `
    );

    return res.json({ ok: true, summary: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.PIPELINE_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const customerId = cleanInteger(req.body.customer_id);
    const contactId = cleanInteger(req.body.contact_id);
    const name = cleanText(req.body.opportunity_name);

    if (!customerId) {
      return res.status(400).json({ ok: false, error: "Customer is required" });
    }

    if (!name) {
      return res.status(400).json({ ok: false, error: "Opportunity name is required" });
    }

    if (!await validateCustomer(pool, customerId)) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }

    if (!await validateContact(pool, contactId, customerId)) {
      return res.status(400).json({ ok: false, error: "Contact must belong to selected customer" });
    }

    const reference = cleanText(req.body.opportunity_reference) || await nextReference(pool);
    const result = await pool.query(
      `
      INSERT INTO pipeline_opportunities (
        customer_id,
        contact_id,
        opportunity_reference,
        opportunity_name,
        stage,
        status,
        estimated_value,
        probability,
        expected_close_date,
        owner_user_id,
        source,
        next_action,
        notes,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      RETURNING *
      `,
      [
        customerId,
        contactId,
        reference,
        name,
        cleanText(req.body.stage) || "Lead",
        cleanText(req.body.status) || "Open",
        cleanNumber(req.body.estimated_value),
        Math.min(cleanInteger(req.body.probability) || 0, 100),
        cleanDate(req.body.expected_close_date),
        cleanInteger(req.body.owner_user_id),
        cleanText(req.body.source),
        cleanText(req.body.next_action),
        cleanText(req.body.notes),
        req.user.id
      ]
    );

    const opportunity = await joinedOpportunity(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "pipeline_opportunity.created",
      entityType: "pipeline_opportunity",
      entityId: result.rows[0].id,
      metadata: {
        opportunity_reference: result.rows[0].opportunity_reference,
        customer_id: result.rows[0].customer_id,
        stage: result.rows[0].stage,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({ ok: true, opportunity: publicOpportunity(opportunity) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Opportunity reference already exists" });
    }

    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.PIPELINE_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const customerId = cleanInteger(req.body.customer_id);
    const contactId = cleanInteger(req.body.contact_id);
    const name = cleanText(req.body.opportunity_name);

    if (!id) {
      return res.status(400).json({ ok: false, error: "Invalid opportunity ID" });
    }

    if (!customerId) {
      return res.status(400).json({ ok: false, error: "Customer is required" });
    }

    if (!name) {
      return res.status(400).json({ ok: false, error: "Opportunity name is required" });
    }

    const existing = await pool.query("SELECT * FROM pipeline_opportunities WHERE id = $1 LIMIT 1", [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ ok: false, error: "Opportunity not found" });
    }

    if (!await validateCustomer(pool, customerId)) {
      return res.status(404).json({ ok: false, error: "Customer not found" });
    }

    if (!await validateContact(pool, contactId, customerId)) {
      return res.status(400).json({ ok: false, error: "Contact must belong to selected customer" });
    }

    await pool.query(
      `
      UPDATE pipeline_opportunities
      SET
        customer_id = $1,
        contact_id = $2,
        opportunity_reference = $3,
        opportunity_name = $4,
        stage = $5,
        status = $6,
        estimated_value = $7,
        probability = $8,
        expected_close_date = $9,
        owner_user_id = $10,
        source = $11,
        next_action = $12,
        notes = $13,
        updated_by = $14,
        updated_at = NOW()
      WHERE id = $15
      `,
      [
        customerId,
        contactId,
        cleanText(req.body.opportunity_reference) || existing.rows[0].opportunity_reference,
        name,
        cleanText(req.body.stage) || "Lead",
        cleanText(req.body.status) || "Open",
        cleanNumber(req.body.estimated_value),
        Math.min(cleanInteger(req.body.probability) || 0, 100),
        cleanDate(req.body.expected_close_date),
        cleanInteger(req.body.owner_user_id),
        cleanText(req.body.source),
        cleanText(req.body.next_action),
        cleanText(req.body.notes),
        req.user.id,
        id
      ]
    );

    const opportunity = await joinedOpportunity(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "pipeline_opportunity.updated",
      entityType: "pipeline_opportunity",
      entityId: id,
      metadata: {
        opportunity_reference: opportunity.opportunity_reference,
        previous_stage: existing.rows[0].stage,
        stage: opportunity.stage,
        previous_status: existing.rows[0].status,
        status: opportunity.status
      }
    });

    return res.json({ ok: true, opportunity: publicOpportunity(opportunity) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "Opportunity reference already exists" });
    }

    return next(err);
  }
});

module.exports = router;
