const express = require("express");

const { ROLES } = require("../config/roles");
const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();

router.use(authRequired);

function cleanInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function publicCustomer(row) {
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
    primary_contact_phone: row.primary_contact_phone
  };
}

function customerIdsFrom(rows) {
  return rows.map((row) => row.id).filter(Boolean);
}

async function resolvePortalCustomers(pool, user, requestedCustomerId) {
  if (user.role === ROLES.CUSTOMER) {
    const result = await pool.query(
      `
      SELECT DISTINCT c.*
      FROM customers c
      LEFT JOIN customer_portal_access cpa
        ON cpa.customer_id = c.id
        AND cpa.user_id = $1
        AND cpa.status = 'Active'
      WHERE
        cpa.id IS NOT NULL
        OR LOWER(c.email) = LOWER($2)
        OR LOWER(c.primary_contact_email) = LOWER($2)
      ORDER BY c.company_name ASC
      `,
      [user.id, user.email]
    );

    return result.rows;
  }

  const values = [];
  const where = [];

  if (requestedCustomerId) {
    values.push(requestedCustomerId);
    where.push(`id = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const result = await pool.query(
    `
    SELECT *
    FROM customers
    ${whereSql}
    ORDER BY company_name ASC
    LIMIT 250
    `,
    values
  );

  return result.rows;
}

router.get("/dashboard", requirePermission(PERMISSIONS.CUSTOMER_PORTAL_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const requestedCustomerId = cleanInteger(req.query.customer_id);
    const customers = await resolvePortalCustomers(pool, req.user, requestedCustomerId);
    const customerIds = customerIdsFrom(customers);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "customer_portal.viewed",
      entityType: "customer_portal",
      entityId: req.user.id,
      metadata: {
        customer_ids: customerIds,
        requested_customer_id: requestedCustomerId
      }
    });

    if (!customerIds.length) {
      return res.json({
        ok: true,
        customers: [],
        summary: {
          customers: 0,
          buildings: 0,
          assets: 0,
          open_work_orders: 0,
          reports: 0,
          certificates: 0
        },
        buildings: [],
        assets: [],
        work_orders: [],
        reports: [],
        certificates: []
      });
    }

    const [
      buildingSummary,
      assetSummary,
      workOrderSummary,
      reportSummary,
      certificateSummary,
      buildings,
      assets,
      workOrders,
      reports,
      certificates
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::INT AS count FROM buildings WHERE customer_id = ANY($1::INT[])", [customerIds]),
      pool.query(
        `
        SELECT COUNT(*)::INT AS count
        FROM assets a
        JOIN buildings b ON b.id = a.building_id
        WHERE b.customer_id = ANY($1::INT[])
        `,
        [customerIds]
      ),
      pool.query(
        `
        SELECT COUNT(*)::INT AS count
        FROM work_orders
        WHERE customer_id = ANY($1::INT[])
          AND status IN ('Open', 'In Progress', 'On Hold')
        `,
        [customerIds]
      ),
      pool.query("SELECT COUNT(*)::INT AS count FROM reports WHERE customer_id = ANY($1::INT[])", [customerIds]),
      pool.query("SELECT COUNT(*)::INT AS count FROM certificates WHERE customer_id = ANY($1::INT[])", [customerIds]),
      pool.query(
        `
        SELECT id, customer_id, name, building_type, status, city, postcode, site_contact_name
        FROM buildings
        WHERE customer_id = ANY($1::INT[])
        ORDER BY name ASC
        LIMIT 50
        `,
        [customerIds]
      ),
      pool.query(
        `
        SELECT
          a.id,
          a.building_id,
          a.asset_reference,
          a.asset_name,
          a.asset_category,
          a.asset_type,
          a.status,
          a.condition,
          a.next_service_date,
          b.customer_id,
          b.name AS building_name
        FROM assets a
        JOIN buildings b ON b.id = a.building_id
        WHERE b.customer_id = ANY($1::INT[])
        ORDER BY a.updated_at DESC, a.id DESC
        LIMIT 50
        `,
        [customerIds]
      ),
      pool.query(
        `
        SELECT
          wo.id,
          wo.work_order_reference,
          wo.title,
          wo.status,
          wo.priority,
          wo.due_date,
          wo.customer_id,
          b.name AS building_name
        FROM work_orders wo
        LEFT JOIN buildings b ON b.id = wo.building_id
        WHERE wo.customer_id = ANY($1::INT[])
        ORDER BY wo.updated_at DESC, wo.id DESC
        LIMIT 50
        `,
        [customerIds]
      ),
      pool.query(
        `
        SELECT id, report_reference, report_title, report_type, status, customer_id, updated_at
        FROM reports
        WHERE customer_id = ANY($1::INT[])
        ORDER BY updated_at DESC, id DESC
        LIMIT 50
        `,
        [customerIds]
      ),
      pool.query(
        `
        SELECT id, certificate_reference, certificate_title, certificate_type, status, customer_id, issue_date, expiry_date
        FROM certificates
        WHERE customer_id = ANY($1::INT[])
        ORDER BY updated_at DESC, id DESC
        LIMIT 50
        `,
        [customerIds]
      )
    ]);

    return res.json({
      ok: true,
      customers: customers.map(publicCustomer),
      summary: {
        customers: customerIds.length,
        buildings: buildingSummary.rows[0].count,
        assets: assetSummary.rows[0].count,
        open_work_orders: workOrderSummary.rows[0].count,
        reports: reportSummary.rows[0].count,
        certificates: certificateSummary.rows[0].count
      },
      buildings: buildings.rows,
      assets: assets.rows,
      work_orders: workOrders.rows,
      reports: reports.rows,
      certificates: certificates.rows
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
