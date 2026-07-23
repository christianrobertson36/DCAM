const express = require("express");
const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
router.use(authRequired);

const text = (value) => String(value || "").trim() || null;
const id = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const amount = (value) => Math.max(0, Number(value) || 0);
const date = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : null;

async function quoteReference(pool) {
  const result = await pool.query("SELECT 'QUO-' || LPAD(nextval('quotation_reference_seq')::TEXT, 6, '0') AS reference");
  return result.rows[0].reference;
}

async function contractReference(pool) {
  const result = await pool.query("SELECT 'CON-' || LPAD(nextval('contract_reference_seq')::TEXT, 6, '0') AS reference");
  return result.rows[0].reference;
}

async function quoteWithItems(pool, quoteId) {
  const quote = await pool.query(`
    SELECT q.*, c.company_name AS customer_name, b.name AS building_name
    FROM quotations q
    JOIN customers c ON c.id = q.customer_id
    LEFT JOIN buildings b ON b.id = q.building_id
    WHERE q.id = $1
  `, [quoteId]);
  if (!quote.rows[0]) return null;
  const items = await pool.query("SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order, id", [quoteId]);
  return { ...quote.rows[0], items: items.rows };
}

router.get("/summary", requirePermission(PERMISSIONS.PIPELINE_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM quotations) AS quotations,
        (SELECT COUNT(*)::int FROM quotations WHERE status IN ('Draft', 'Sent')) AS open_quotations,
        (SELECT COALESCE(SUM(total), 0) FROM quotations WHERE status IN ('Draft', 'Sent')) AS quoted_value,
        (SELECT COUNT(*)::int FROM contracts WHERE status = 'Active') AS active_contracts,
        (SELECT COALESCE(SUM(value), 0) FROM contracts WHERE status = 'Active') AS contract_value
    `);
    return res.json({ ok: true, summary: result.rows[0] });
  } catch (error) { return next(error); }
});

router.get("/quotations", requirePermission(PERMISSIONS.PIPELINE_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT q.*, c.company_name AS customer_name, b.name AS building_name
      FROM quotations q
      JOIN customers c ON c.id = q.customer_id
      LEFT JOIN buildings b ON b.id = q.building_id
      ORDER BY q.updated_at DESC, q.id DESC LIMIT 250
    `);
    return res.json({ ok: true, quotations: result.rows });
  } catch (error) { return next(error); }
});

router.get("/quotations/:id", requirePermission(PERMISSIONS.PIPELINE_VIEW), async (req, res, next) => {
  try {
    const quotation = await quoteWithItems(getPool(), id(req.params.id));
    if (!quotation) return res.status(404).json({ ok: false, error: "Quotation not found" });
    return res.json({ ok: true, quotation });
  } catch (error) { return next(error); }
});

router.post("/quotations", requirePermission(PERMISSIONS.PIPELINE_CREATE), async (req, res, next) => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const customerId = id(req.body.customer_id);
    const title = text(req.body.title);
    if (!customerId || !title) return res.status(400).json({ ok: false, error: "Customer and title are required" });
    const items = Array.isArray(req.body.items) ? req.body.items.filter((item) => text(item.description)) : [];
    if (!items.length) return res.status(400).json({ ok: false, error: "At least one quotation item is required" });
    const subtotal = items.reduce((sum, item) => sum + amount(item.quantity || 1) * amount(item.unit_price), 0);
    const taxRate = Math.min(100, amount(req.body.tax_rate ?? 19));
    const taxTotal = subtotal * taxRate / 100;
    await client.query("BEGIN");
    const result = await client.query(`
      INSERT INTO quotations (
        quotation_reference, customer_id, building_id, opportunity_id, title, status,
        currency, valid_until, notes, subtotal, tax_rate, tax_total, total, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14) RETURNING id
    `, [
      await quoteReference(client), customerId, id(req.body.building_id), id(req.body.opportunity_id),
      title, text(req.body.status) || "Draft", text(req.body.currency) || "RON", date(req.body.valid_until),
      text(req.body.notes), subtotal, taxRate, taxTotal, subtotal + taxTotal, req.user.id
    ]);
    for (const [index, item] of items.entries()) {
      const quantity = amount(item.quantity || 1);
      const unitPrice = amount(item.unit_price);
      await client.query(`
        INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, line_total, sort_order)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [result.rows[0].id, text(item.description), quantity, unitPrice, quantity * unitPrice, index]);
    }
    await writeAuditEvent(client, { actorUserId: req.user.id, action: "quotation.created", entityType: "quotation", entityId: result.rows[0].id });
    await client.query("COMMIT");
    return res.status(201).json({ ok: true, quotation: await quoteWithItems(pool, result.rows[0].id) });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally { client.release(); }
});

router.patch("/quotations/:id/status", requirePermission(PERMISSIONS.PIPELINE_EDIT), async (req, res, next) => {
  try {
    const quoteId = id(req.params.id);
    const status = text(req.body.status);
    const allowed = new Set(["Draft", "Sent", "Accepted", "Rejected", "Expired"]);
    if (!quoteId || !allowed.has(status)) return res.status(400).json({ ok: false, error: "Invalid quotation status" });
    const pool = getPool();
    const result = await pool.query(`
      UPDATE quotations SET status = $2, accepted_at = CASE WHEN $2 = 'Accepted' THEN NOW() ELSE accepted_at END,
      updated_by = $3, updated_at = NOW() WHERE id = $1 RETURNING id
    `, [quoteId, status, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ ok: false, error: "Quotation not found" });
    await writeAuditEvent(pool, { actorUserId: req.user.id, action: "quotation.status_updated", entityType: "quotation", entityId: quoteId, metadata: { status } });
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.post("/quotations/:id/contract", requirePermission(PERMISSIONS.PIPELINE_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const quoteId = id(req.params.id);
    const quote = await quoteWithItems(pool, quoteId);
    if (!quote) return res.status(404).json({ ok: false, error: "Quotation not found" });
    if (quote.status !== "Accepted") return res.status(400).json({ ok: false, error: "Only accepted quotations can become contracts" });
    const result = await pool.query(`
      INSERT INTO contracts (
        contract_reference, quotation_id, customer_id, building_id, title, status,
        start_date, end_date, renewal_date, value, currency, notes, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,'Active',$6,$7,$8,$9,$10,$11,$12,$12)
      ON CONFLICT (quotation_id) DO NOTHING RETURNING id
    `, [
      await contractReference(pool), quoteId, quote.customer_id, quote.building_id, quote.title,
      date(req.body.start_date), date(req.body.end_date), date(req.body.renewal_date),
      quote.total, quote.currency, text(req.body.notes), req.user.id
    ]);
    if (!result.rows[0]) return res.status(409).json({ ok: false, error: "A contract already exists for this quotation" });
    await writeAuditEvent(pool, { actorUserId: req.user.id, action: "contract.created_from_quotation", entityType: "contract", entityId: result.rows[0].id, metadata: { quotation_id: quoteId } });
    return res.status(201).json({ ok: true, contract_id: result.rows[0].id });
  } catch (error) { return next(error); }
});

router.get("/contracts", requirePermission(PERMISSIONS.PIPELINE_VIEW), async (req, res, next) => {
  try {
    const result = await getPool().query(`
      SELECT co.*, c.company_name AS customer_name, b.name AS building_name
      FROM contracts co
      JOIN customers c ON c.id = co.customer_id
      LEFT JOIN buildings b ON b.id = co.building_id
      ORDER BY co.updated_at DESC, co.id DESC LIMIT 250
    `);
    return res.json({ ok: true, contracts: result.rows });
  } catch (error) { return next(error); }
});

module.exports = router;
