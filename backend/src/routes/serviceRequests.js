const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

const { getPool } = require("../db/pool");
const { ROLES } = require("../config/roles");
const {
  PERMISSIONS,
  hasPermission
} = require("../config/permissions");
const {
  authRequired,
  requirePermission
} = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const uploadRoot = process.env.UPLOADS_PATH || "/app/uploads";
const maximumFileBytes = 5 * 1024 * 1024;
const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

router.use(authRequired);

function normaliseText(value) {
  return String(value || "").trim();
}

function normaliseOptionalText(value) {
  const text = normaliseText(value);
  return text || null;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function hoursForPriority(priority) {
  return {
    Critical: 4,
    High: 24,
    Normal: 72,
    Low: 120
  }[priority] || 72;
}

function safeFileExtension(contentType) {
  return {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf"
  }[contentType] || "";
}

async function customerIdsForUser(pool, user) {
  if (user.role !== ROLES.CUSTOMER) {
    return null;
  }

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
    [user.sub, user.email]
  );

  return result.rows.map((row) => Number(row.id));
}

function scopeSql(customerIds, startIndex = 1, alias = "sr") {
  if (customerIds === null) {
    return { clause: "", values: [] };
  }

  if (customerIds.length === 0) {
    return { clause: " AND FALSE", values: [] };
  }

  return {
    clause: ` AND ${alias}.customer_id = ANY($${startIndex}::int[])`,
    values: [customerIds]
  };
}

function requestSelect() {
  return `
    SELECT
      sr.*,
      c.company_name AS customer_name,
      b.name AS building_name,
      a.asset_reference,
      a.asset_name,
      assigned.name AS assigned_user_name,
      wo.work_order_reference,
      (
        sr.sla_due_at IS NOT NULL
        AND sr.sla_due_at < NOW()
        AND sr.status NOT IN ('Converted', 'Closed', 'Rejected')
      ) AS sla_overdue
    FROM service_requests sr
    JOIN customers c ON c.id = sr.customer_id
    LEFT JOIN buildings b ON b.id = sr.building_id
    LEFT JOIN assets a ON a.id = sr.asset_id
    LEFT JOIN users assigned ON assigned.id = sr.assigned_user_id
    LEFT JOIN work_orders wo ON wo.id = sr.work_order_id
  `;
}

async function getRequest(pool, requestId, customerIds) {
  const scope = scopeSql(customerIds, 2);
  const result = await pool.query(
    `
    ${requestSelect()}
    WHERE sr.id = $1
    ${scope.clause}
    LIMIT 1
    `,
    [requestId, ...scope.values]
  );

  return result.rows[0] || null;
}

async function validateRelationships(pool, customerId, buildingId, assetId) {
  const customerResult = await pool.query(
    "SELECT id FROM customers WHERE id = $1 AND status <> 'Archived'",
    [customerId]
  );

  if (!customerResult.rows[0]) {
    return "Customer not found";
  }

  if (buildingId) {
    const buildingResult = await pool.query(
      "SELECT id FROM buildings WHERE id = $1 AND customer_id = $2",
      [buildingId, customerId]
    );

    if (!buildingResult.rows[0]) {
      return "Building does not belong to the selected customer";
    }
  }

  if (assetId) {
    const assetResult = await pool.query(
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

    if (!assetResult.rows[0]) {
      return "Asset does not belong to the selected customer and building";
    }
  }

  return null;
}

async function addUpdate(pool, requestId, visibility, message, userId) {
  if (!normaliseText(message)) {
    return;
  }

  await pool.query(
    `
    INSERT INTO service_request_updates (
      service_request_id,
      visibility,
      message,
      created_by
    )
    VALUES ($1, $2, $3, $4)
    `,
    [requestId, visibility, normaliseText(message), userId]
  );
}

router.get(
  "/summary",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_VIEW),
  async (req, res, next) => {
    try {
      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const scope = scopeSql(customerIds, 1);
      const result = await pool.query(
        `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE sr.status = 'New')::int AS new,
          COUNT(*) FILTER (WHERE sr.status = 'Under Review')::int AS under_review,
          COUNT(*) FILTER (WHERE sr.status = 'Approved')::int AS approved,
          COUNT(*) FILTER (WHERE sr.status = 'Converted')::int AS converted,
          COUNT(*) FILTER (WHERE sr.status = 'Closed')::int AS closed,
          COUNT(*) FILTER (
            WHERE sr.sla_due_at < NOW()
              AND sr.status NOT IN ('Converted', 'Closed', 'Rejected')
          )::int AS overdue
        FROM service_requests sr
        WHERE TRUE
        ${scope.clause}
        `,
        scope.values
      );

      return res.json({ ok: true, summary: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_VIEW),
  async (req, res, next) => {
    try {
      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const values = [];
      const conditions = ["TRUE"];

      const search = normaliseText(req.query.search);
      if (search) {
        values.push(`%${search}%`);
        conditions.push(`
          (
            sr.request_reference ILIKE $${values.length}
            OR sr.title ILIKE $${values.length}
            OR sr.description ILIKE $${values.length}
            OR c.company_name ILIKE $${values.length}
            OR COALESCE(b.name, '') ILIKE $${values.length}
          )
        `);
      }

      for (const [queryKey, column] of [
        ["status", "sr.status"],
        ["priority", "sr.priority"],
        ["category", "sr.category"]
      ]) {
        const value = normaliseText(req.query[queryKey]);
        if (value) {
          values.push(value);
          conditions.push(`${column} = $${values.length}`);
        }
      }

      for (const [queryKey, column] of [
        ["customer_id", "sr.customer_id"],
        ["assigned_user_id", "sr.assigned_user_id"]
      ]) {
        const value = parseId(req.query[queryKey]);
        if (value) {
          values.push(value);
          conditions.push(`${column} = $${values.length}`);
        }
      }

      if (customerIds !== null) {
        if (customerIds.length === 0) {
          conditions.push("FALSE");
        } else {
          values.push(customerIds);
          conditions.push(`sr.customer_id = ANY($${values.length}::int[])`);
        }
      }

      const result = await pool.query(
        `
        ${requestSelect()}
        WHERE ${conditions.join(" AND ")}
        ORDER BY
          CASE sr.priority
            WHEN 'Critical' THEN 1
            WHEN 'High' THEN 2
            WHEN 'Normal' THEN 3
            ELSE 4
          END,
          sr.created_at DESC
        `,
        values
      );

      return res.json({ ok: true, service_requests: result.rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_VIEW),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      if (!requestId) {
        return res.status(400).json({ ok: false, error: "Invalid request ID" });
      }

      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const request = await getRequest(pool, requestId, customerIds);

      if (!request) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }

      return res.json({ ok: true, service_request: request });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_CREATE),
  async (req, res, next) => {
    try {
      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const customerId = parseId(req.body.customer_id);
      const buildingId = parseId(req.body.building_id);
      const assetId = parseId(req.body.asset_id);
      const title = normaliseText(req.body.title);
      const description = normaliseText(req.body.description);
      const priority = normaliseText(req.body.priority) || "Normal";
      const category = normaliseText(req.body.category) || "Maintenance";

      if (!customerId || !title || !description) {
        return res.status(400).json({
          ok: false,
          error: "Customer, title and description are required"
        });
      }

      if (customerIds !== null && !customerIds.includes(customerId)) {
        return res.status(403).json({
          ok: false,
          error: "You cannot create a request for this customer"
        });
      }

      const relationshipError = await validateRelationships(
        pool,
        customerId,
        buildingId,
        assetId
      );

      if (relationshipError) {
        return res.status(400).json({ ok: false, error: relationshipError });
      }

      const slaDueAt = req.body.sla_due_at
        ? new Date(req.body.sla_due_at)
        : new Date(Date.now() + hoursForPriority(priority) * 60 * 60 * 1000);

      const result = await pool.query(
        `
        INSERT INTO service_requests (
          request_reference,
          customer_id,
          building_id,
          asset_id,
          requested_by_user_id,
          requester_name,
          requester_email,
          requester_phone,
          category,
          title,
          description,
          priority,
          status,
          source,
          sla_due_at,
          created_by,
          updated_by
        )
        VALUES (
          'SR-' || LPAD(nextval('service_request_reference_seq')::text, 6, '0'),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          'New', $12, $13, $4, $4
        )
        RETURNING id
        `,
        [
          customerId,
          buildingId,
          assetId,
          req.user.sub,
          normaliseOptionalText(req.body.requester_name) || req.user.name,
          normaliseOptionalText(req.body.requester_email) || req.user.email,
          normaliseOptionalText(req.body.requester_phone),
          category,
          title,
          description,
          priority,
          req.user.role === ROLES.CUSTOMER ? "Portal" : "Office",
          slaDueAt
        ]
      );

      const requestId = result.rows[0].id;
      await addUpdate(
        pool,
        requestId,
        "Customer Visible",
        "Service request created.",
        req.user.sub
      );
      await writeAuditEvent(pool, {
        actorUserId: req.user.sub,
        action: "service_request.create",
        entityType: "service_request",
        entityId: requestId,
        metadata: { customer_id: customerId, title, priority }
      });

      const request = await getRequest(pool, requestId, customerIds);
      return res.status(201).json({ ok: true, service_request: request });
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  "/:id",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_EDIT),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      if (!requestId) {
        return res.status(400).json({ ok: false, error: "Invalid request ID" });
      }

      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const existing = await getRequest(pool, requestId, customerIds);

      if (!existing) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }

      if (req.user.role === ROLES.CUSTOMER && existing.status !== "New") {
        return res.status(403).json({
          ok: false,
          error: "Customer requests can only be edited while new"
        });
      }

      const customerId =
        req.user.role === ROLES.CUSTOMER
          ? Number(existing.customer_id)
          : parseId(req.body.customer_id) || Number(existing.customer_id);
      const buildingId =
        req.body.building_id === undefined
          ? parseId(existing.building_id)
          : parseId(req.body.building_id);
      const assetId =
        req.body.asset_id === undefined
          ? parseId(existing.asset_id)
          : parseId(req.body.asset_id);
      const title = normaliseText(req.body.title || existing.title);
      const description = normaliseText(req.body.description || existing.description);
      const category = normaliseText(req.body.category || existing.category);
      const priority = normaliseText(req.body.priority || existing.priority);

      const relationshipError = await validateRelationships(
        pool,
        customerId,
        buildingId,
        assetId
      );
      if (relationshipError) {
        return res.status(400).json({ ok: false, error: relationshipError });
      }

      let status = existing.status;
      let assignedUserId = parseId(existing.assigned_user_id);
      if (req.user.role !== ROLES.CUSTOMER) {
        status = normaliseText(req.body.status || existing.status);
        if (
          ["Converted", "Closed"].includes(status)
          && status !== existing.status
        ) {
          return res.status(400).json({
            ok: false,
            error: "Use the dedicated convert or close action for this status"
          });
        }

        if (req.body.assigned_user_id !== undefined) {
          if (!hasPermission(req.user, PERMISSIONS.SERVICE_REQUESTS_ASSIGN)) {
            return res.status(403).json({
              ok: false,
              error: "You do not have permission to assign service requests"
            });
          }
          assignedUserId = parseId(req.body.assigned_user_id);
        }
      }

      const slaDueAt =
        req.user.role === ROLES.CUSTOMER || !req.body.sla_due_at
          ? existing.sla_due_at
          : new Date(req.body.sla_due_at);

      await pool.query(
        `
        UPDATE service_requests
        SET
          customer_id = $2,
          building_id = $3,
          asset_id = $4,
          requester_name = $5,
          requester_email = $6,
          requester_phone = $7,
          category = $8,
          title = $9,
          description = $10,
          priority = $11,
          status = $12,
          assigned_user_id = $13,
          sla_due_at = $14,
          updated_by = $15,
          updated_at = NOW()
        WHERE id = $1
        `,
        [
          requestId,
          customerId,
          buildingId,
          assetId,
          normaliseOptionalText(req.body.requester_name) || existing.requester_name,
          normaliseOptionalText(req.body.requester_email) || existing.requester_email,
          req.body.requester_phone === undefined
            ? existing.requester_phone
            : normaliseOptionalText(req.body.requester_phone),
          category,
          title,
          description,
          priority,
          status,
          assignedUserId,
          slaDueAt,
          req.user.sub
        ]
      );

      await writeAuditEvent(pool, {
        actorUserId: req.user.sub,
        action: "service_request.update",
        entityType: "service_request",
        entityId: requestId,
        metadata: { status, assigned_user_id: assignedUserId }
      });

      const request = await getRequest(pool, requestId, customerIds);
      return res.json({ ok: true, service_request: request });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/:id/updates",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_VIEW),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const request = requestId
        ? await getRequest(pool, requestId, customerIds)
        : null;

      if (!request) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }

      const values = [requestId];
      const visibility =
        req.user.role === ROLES.CUSTOMER
          ? " AND sru.visibility = 'Customer Visible'"
          : "";
      const result = await pool.query(
        `
        SELECT sru.*, u.name AS created_by_name
        FROM service_request_updates sru
        LEFT JOIN users u ON u.id = sru.created_by
        WHERE sru.service_request_id = $1
        ${visibility}
        ORDER BY sru.created_at ASC
        `,
        values
      );

      return res.json({ ok: true, updates: result.rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/:id/updates",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_EDIT),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      const message = normaliseText(req.body.message);
      if (!requestId || !message) {
        return res.status(400).json({ ok: false, error: "Update message is required" });
      }

      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const request = await getRequest(pool, requestId, customerIds);
      if (!request) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }

      const visibility =
        req.user.role === ROLES.CUSTOMER
          ? "Customer Visible"
          : normaliseText(req.body.visibility) === "Internal"
            ? "Internal"
            : "Customer Visible";

      await addUpdate(pool, requestId, visibility, message, req.user.sub);
      await writeAuditEvent(pool, {
        actorUserId: req.user.sub,
        action: "service_request.update_note",
        entityType: "service_request",
        entityId: requestId,
        metadata: { visibility }
      });

      return res.status(201).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/:id/files",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_VIEW),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const request = requestId
        ? await getRequest(pool, requestId, customerIds)
        : null;
      if (!request) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }

      const visibility =
        req.user.role === ROLES.CUSTOMER
          ? " AND srf.visibility = 'Customer Visible'"
          : "";
      const result = await pool.query(
        `
        SELECT
          srf.id,
          srf.original_filename,
          srf.content_type,
          srf.file_size,
          srf.visibility,
          srf.created_at,
          u.name AS uploaded_by_name
        FROM service_request_files srf
        LEFT JOIN users u ON u.id = srf.uploaded_by
        WHERE srf.service_request_id = $1
        ${visibility}
        ORDER BY srf.created_at DESC
        `,
        [requestId]
      );

      return res.json({ ok: true, files: result.rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/:id/files",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_EDIT),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      const contentType = normaliseText(req.body.content_type).toLowerCase();
      const originalFilename = normaliseText(req.body.filename);
      const base64Data = normaliseText(req.body.data);
      if (!requestId || !originalFilename || !base64Data) {
        return res.status(400).json({ ok: false, error: "File details are required" });
      }
      if (!allowedContentTypes.has(contentType)) {
        return res.status(400).json({
          ok: false,
          error: "Only PNG, JPEG, WebP and PDF files are supported"
        });
      }

      const buffer = Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (!buffer.length || buffer.length > maximumFileBytes) {
        return res.status(400).json({
          ok: false,
          error: "File must be between 1 byte and 5 MB"
        });
      }

      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const request = await getRequest(pool, requestId, customerIds);
      if (!request) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }

      const folder = path.join(uploadRoot, "service-requests", String(requestId));
      await fs.promises.mkdir(folder, { recursive: true });
      const storedFilename = `${crypto.randomUUID()}${safeFileExtension(contentType)}`;
      await fs.promises.writeFile(path.join(folder, storedFilename), buffer);
      const visibility =
        req.user.role === ROLES.CUSTOMER
          ? "Customer Visible"
          : normaliseText(req.body.visibility) === "Internal"
            ? "Internal"
            : "Customer Visible";

      const result = await pool.query(
        `
        INSERT INTO service_request_files (
          service_request_id,
          original_filename,
          stored_filename,
          content_type,
          file_size,
          visibility,
          uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        `,
        [
          requestId,
          path.basename(originalFilename),
          storedFilename,
          contentType,
          buffer.length,
          visibility,
          req.user.sub
        ]
      );

      await writeAuditEvent(pool, {
        actorUserId: req.user.sub,
        action: "service_request.upload_file",
        entityType: "service_request",
        entityId: requestId,
        metadata: { file_id: result.rows[0].id, visibility }
      });

      return res.status(201).json({ ok: true, file_id: result.rows[0].id });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/:id/files/:fileId/download",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_VIEW),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      const fileId = parseId(req.params.fileId);
      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const request = requestId
        ? await getRequest(pool, requestId, customerIds)
        : null;
      if (!request || !fileId) {
        return res.status(404).json({ ok: false, error: "File not found" });
      }

      const result = await pool.query(
        `
        SELECT *
        FROM service_request_files
        WHERE id = $1
          AND service_request_id = $2
          AND ($3::boolean = FALSE OR visibility = 'Customer Visible')
        LIMIT 1
        `,
        [fileId, requestId, req.user.role === ROLES.CUSTOMER]
      );
      const file = result.rows[0];
      if (!file) {
        return res.status(404).json({ ok: false, error: "File not found" });
      }

      const filePath = path.join(
        uploadRoot,
        "service-requests",
        String(requestId),
        file.stored_filename
      );
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ ok: false, error: "Stored file not found" });
      }

      res.setHeader("Content-Type", file.content_type);
      return res.download(filePath, file.original_filename);
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/:id/convert",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_CONVERT),
  async (req, res, next) => {
    const pool = getPool();
    const client = await pool.connect();
    try {
      if (!hasPermission(req.user, PERMISSIONS.WORK_ORDERS_CREATE)) {
        return res.status(403).json({
          ok: false,
          error: "Work order creation permission is required"
        });
      }

      const requestId = parseId(req.params.id);
      const customerIds = await customerIdsForUser(client, req.user);
      const request = requestId
        ? await getRequest(client, requestId, customerIds)
        : null;
      if (!request) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }
      if (request.work_order_id) {
        return res.status(409).json({
          ok: false,
          error: "This request has already been converted"
        });
      }

      await client.query("BEGIN");
      const workOrderResult = await client.query(
        `
        INSERT INTO work_orders (
          work_order_reference,
          title,
          description,
          priority,
          status,
          customer_id,
          building_id,
          asset_id,
          assigned_user_id,
          due_date,
          created_by,
          updated_by
        )
        VALUES (
          'WO-' || LPAD(nextval('work_order_reference_seq')::text, 6, '0'),
          $1, $2, $3, 'Open', $4, $5, $6, $7, $8, $9, $9
        )
        RETURNING id, work_order_reference
        `,
        [
          request.title,
          request.description,
          request.priority,
          request.customer_id,
          request.building_id,
          request.asset_id,
          request.assigned_user_id,
          request.sla_due_at,
          req.user.sub
        ]
      );
      const workOrder = workOrderResult.rows[0];

      await client.query(
        `
        UPDATE service_requests
        SET
          status = 'Converted',
          work_order_id = $2,
          converted_at = NOW(),
          converted_by = $3,
          updated_by = $3,
          updated_at = NOW()
        WHERE id = $1
        `,
        [requestId, workOrder.id, req.user.sub]
      );
      await addUpdate(
        client,
        requestId,
        "Customer Visible",
        `Request converted to work order ${workOrder.work_order_reference}.`,
        req.user.sub
      );
      await writeAuditEvent(client, {
        actorUserId: req.user.sub,
        action: "service_request.convert",
        entityType: "service_request",
        entityId: requestId,
        metadata: {
          work_order_id: workOrder.id,
          work_order_reference: workOrder.work_order_reference
        }
      });
      await client.query("COMMIT");

      return res.json({ ok: true, work_order: workOrder });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      return next(error);
    } finally {
      client.release();
    }
  }
);

router.post(
  "/:id/close",
  requirePermission(PERMISSIONS.SERVICE_REQUESTS_CLOSE),
  async (req, res, next) => {
    try {
      const requestId = parseId(req.params.id);
      const pool = getPool();
      const customerIds = await customerIdsForUser(pool, req.user);
      const request = requestId
        ? await getRequest(pool, requestId, customerIds)
        : null;
      if (!request) {
        return res.status(404).json({ ok: false, error: "Service request not found" });
      }

      await pool.query(
        `
        UPDATE service_requests
        SET
          status = 'Closed',
          closed_at = NOW(),
          closed_by = $2,
          updated_by = $2,
          updated_at = NOW()
        WHERE id = $1
        `,
        [requestId, req.user.sub]
      );
      await addUpdate(
        pool,
        requestId,
        "Customer Visible",
        normaliseText(req.body.message) || "Service request closed.",
        req.user.sub
      );
      await writeAuditEvent(pool, {
        actorUserId: req.user.sub,
        action: "service_request.close",
        entityType: "service_request",
        entityId: requestId
      });

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
