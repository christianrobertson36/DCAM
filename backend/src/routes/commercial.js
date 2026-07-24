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

function advanceDate(value, frequency) {
  const next = new Date(`${value}T12:00:00Z`);
  const months = { Monthly: 1, Quarterly: 3, "Six Monthly": 6, Annual: 12 }[frequency] || 12;
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}

async function workOrderReference(pool) {
  const result = await pool.query("SELECT 'WO-' || LPAD(nextval('work_order_reference_seq')::TEXT, 6, '0') AS reference");
  return result.rows[0].reference;
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
        (SELECT COALESCE(SUM(value), 0) FROM contracts WHERE status = 'Active') AS contract_value,
        (SELECT COUNT(*)::int FROM contracts WHERE status = 'Active' AND renewal_date < CURRENT_DATE) AS overdue_renewals,
        (SELECT COUNT(*)::int FROM contracts WHERE status = 'Active' AND renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 90) AS renewals_due_90,
        (SELECT COUNT(*)::int FROM contract_services WHERE status = 'Active' AND next_due_date <= CURRENT_DATE) AS services_due
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
      SELECT co.*, c.company_name AS customer_name, b.name AS building_name,
             u.name AS renewal_owner_name,
             (SELECT COUNT(*)::int FROM contract_services cs WHERE cs.contract_id = co.id AND cs.status = 'Active') AS service_count
      FROM contracts co
      JOIN customers c ON c.id = co.customer_id
      LEFT JOIN buildings b ON b.id = co.building_id
      LEFT JOIN users u ON u.id = co.renewal_owner_id
      ORDER BY co.updated_at DESC, co.id DESC LIMIT 250
    `);
    return res.json({ ok: true, contracts: result.rows });
  } catch (error) { return next(error); }
});

router.get("/contracts/:id", requirePermission(PERMISSIONS.PIPELINE_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const contractId = id(req.params.id);
    const contract = await pool.query(`
      SELECT co.*, c.company_name AS customer_name, b.name AS building_name, u.name AS renewal_owner_name
      FROM contracts co
      JOIN customers c ON c.id = co.customer_id
      LEFT JOIN buildings b ON b.id = co.building_id
      LEFT JOIN users u ON u.id = co.renewal_owner_id
      WHERE co.id = $1
    `, [contractId]);
    if (!contract.rows[0]) return res.status(404).json({ ok: false, error: "Contract not found" });
    const services = await pool.query(`
      SELECT cs.*, b.name AS building_name, a.asset_name, u.name AS assigned_user_name
      FROM contract_services cs
      LEFT JOIN buildings b ON b.id = cs.building_id
      LEFT JOIN assets a ON a.id = cs.asset_id
      LEFT JOIN users u ON u.id = cs.assigned_user_id
      WHERE cs.contract_id = $1 ORDER BY cs.next_due_date, cs.id
    `, [contractId]);
    return res.json({ ok: true, contract: { ...contract.rows[0], services: services.rows } });
  } catch (error) { return next(error); }
});

router.patch("/contracts/:id/renewal", requirePermission(PERMISSIONS.PIPELINE_EDIT), async (req, res, next) => {
  try {
    const contractId = id(req.params.id);
    const pool = getPool();
    const result = await pool.query(`
      UPDATE contracts SET renewal_date = COALESCE($2, renewal_date), renewal_status = COALESCE($3, renewal_status),
        renewal_owner_id = $4, renewal_notice_days = COALESCE($5, renewal_notice_days),
        updated_by = $6, updated_at = NOW() WHERE id = $1 RETURNING id
    `, [contractId, date(req.body.renewal_date), text(req.body.renewal_status), id(req.body.renewal_owner_id), Number(req.body.renewal_notice_days) || 90, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ ok: false, error: "Contract not found" });
    await writeAuditEvent(pool, { actorUserId: req.user.id, action: "contract.renewal_updated", entityType: "contract", entityId: contractId });
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});

router.post("/contracts/:id/renewal-opportunity", requirePermission(PERMISSIONS.PIPELINE_CREATE), async (req, res, next) => {
  try {
    const contractId = id(req.params.id);
    const pool = getPool();
    const contractResult = await pool.query("SELECT * FROM contracts WHERE id = $1", [contractId]);
    const contract = contractResult.rows[0];
    if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
    if (contract.renewal_opportunity_id) return res.status(409).json({ ok: false, error: "Renewal opportunity already exists" });
    const reference = await pool.query("SELECT 'OPP-' || LPAD(nextval('opportunity_reference_seq')::TEXT, 6, '0') AS reference");
    const opportunity = await pool.query(`
      INSERT INTO pipeline_opportunities (
        customer_id, opportunity_reference, opportunity_name, stage, status, estimated_value,
        probability, expected_close_date, owner_user_id, source, next_action, notes, created_by, updated_by
      ) VALUES ($1,$2,$3,'Qualified','Open',$4,75,$5,$6,'Contract Renewal',$7,$8,$9,$9) RETURNING id
    `, [
      contract.customer_id, reference.rows[0].reference, `${contract.title} Renewal`, contract.value,
      contract.renewal_date, contract.renewal_owner_id, "Contact customer and prepare renewal quotation",
      `Renewal for ${contract.contract_reference}`, req.user.id
    ]);
    await pool.query("UPDATE contracts SET renewal_opportunity_id = $2, renewal_status = 'In Progress', updated_by = $3, updated_at = NOW() WHERE id = $1", [contractId, opportunity.rows[0].id, req.user.id]);
    await writeAuditEvent(pool, { actorUserId: req.user.id, action: "contract.renewal_opportunity_created", entityType: "contract", entityId: contractId, metadata: { opportunity_id: opportunity.rows[0].id } });
    return res.status(201).json({ ok: true, opportunity_id: opportunity.rows[0].id });
  } catch (error) { return next(error); }
});

router.post("/contracts/:id/services", requirePermission(PERMISSIONS.MAINTENANCE_PLANS_CREATE), async (req, res, next) => {
  try {
    const contractId = id(req.params.id);
    const serviceName = text(req.body.service_name);
    const nextDueDate = date(req.body.next_due_date);
    if (!contractId || !serviceName || !nextDueDate) return res.status(400).json({ ok: false, error: "Service name and next due date are required" });
    const pool = getPool();
    const contract = await pool.query("SELECT id FROM contracts WHERE id = $1", [contractId]);
    if (!contract.rows[0]) return res.status(404).json({ ok: false, error: "Contract not found" });
    const result = await pool.query(`
      INSERT INTO contract_services (
        contract_id, service_name, frequency, priority, building_id, asset_id, assigned_user_id,
        next_due_date, estimated_duration_minutes, instructions, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11) RETURNING id
    `, [
      contractId, serviceName, text(req.body.frequency) || "Annual", text(req.body.priority) || "Normal",
      id(req.body.building_id), id(req.body.asset_id), id(req.body.assigned_user_id), nextDueDate,
      id(req.body.estimated_duration_minutes), text(req.body.instructions), req.user.id
    ]);
    await writeAuditEvent(pool, { actorUserId: req.user.id, action: "contract.service_created", entityType: "contract_service", entityId: result.rows[0].id, metadata: { contract_id: contractId } });
    return res.status(201).json({ ok: true, service_id: result.rows[0].id });
  } catch (error) { return next(error); }
});

router.post("/automation/generate-due-work", requirePermission(PERMISSIONS.WORK_ORDERS_CREATE), async (req, res, next) => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const due = await client.query(`
      SELECT cs.*, co.customer_id, COALESCE(cs.building_id, co.building_id) AS effective_building_id,
             co.contract_reference
      FROM contract_services cs
      JOIN contracts co ON co.id = cs.contract_id
      WHERE cs.status = 'Active' AND co.status = 'Active' AND cs.next_due_date <= CURRENT_DATE
      ORDER BY cs.next_due_date FOR UPDATE
    `);
    let generated = 0;
    for (const service of due.rows) {
      const workOrder = await client.query(`
        INSERT INTO work_orders (
          work_order_reference, work_order_type, title, description, priority, status,
          customer_id, building_id, asset_id, assigned_user_id, due_date, created_by, updated_by,
          contract_id, contract_service_id, generated_for_date
        ) VALUES ($1,'Planned',$2,$3,$4,'Open',$5,$6,$7,$8,$9,$10,$10,$11,$12,$9)
        ON CONFLICT (contract_service_id, generated_for_date) WHERE contract_service_id IS NOT NULL AND generated_for_date IS NOT NULL
        DO NOTHING RETURNING id
      `, [
        await workOrderReference(client), service.service_name,
        `${service.instructions || "Complete contracted recurring service"}\nContract: ${service.contract_reference}`,
        service.priority, service.customer_id, service.effective_building_id, service.asset_id,
        service.assigned_user_id, service.next_due_date, req.user.id, service.contract_id, service.id
      ]);
      if (workOrder.rows[0]) generated += 1;
      await client.query("UPDATE contract_services SET last_generated_date = next_due_date, next_due_date = $2, updated_by = $3, updated_at = NOW() WHERE id = $1", [service.id, advanceDate(service.next_due_date, service.frequency), req.user.id]);
    }
    await writeAuditEvent(client, { actorUserId: req.user.id, action: "contract_services.due_work_generated", entityType: "contract_service", entityId: null, metadata: { generated } });
    await client.query("COMMIT");
    return res.json({ ok: true, generated });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally { client.release(); }
});

module.exports = router;
