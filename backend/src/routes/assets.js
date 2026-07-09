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

function cleanDate(value) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function publicAsset(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    building_id: row.building_id,
    building_name: row.building_name,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    asset_reference: row.asset_reference,
    asset_name: row.asset_name,
    asset_tag: row.asset_tag,
    asset_category: row.asset_category,
    asset_type: row.asset_type,
    status: row.status,
    condition: row.condition,
    ownership_type: row.ownership_type,
    manufacturer: row.manufacturer,
    model: row.model,
    serial_number: row.serial_number,
    location_description: row.location_description,
    install_date: row.install_date,
    last_service_date: row.last_service_date,
    next_service_date: row.next_service_date,
    warranty_provider: row.warranty_provider,
    warranty_reference: row.warranty_reference,
    warranty_expiry: row.warranty_expiry,
    notes: row.notes,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function nextAssetReference(pool) {
  const result = await pool.query(
    "SELECT 'AST-' || LPAD(nextval('asset_reference_seq')::TEXT, 6, '0') AS asset_reference"
  );

  return result.rows[0].asset_reference;
}

async function assetReferenceAvailable(pool, assetReference, currentAssetId = null) {
  if (!assetReference) {
    return true;
  }

  const values = [assetReference];
  let currentFilter = "";

  if (currentAssetId) {
    values.push(currentAssetId);
    currentFilter = "AND id <> $2";
  }

  const result = await pool.query(
    `SELECT id FROM assets WHERE asset_reference = $1 ${currentFilter} LIMIT 1`,
    values
  );

  return !result.rows[0];
}

async function buildingExists(pool, buildingId) {
  const result = await pool.query(
    "SELECT id FROM buildings WHERE id = $1 LIMIT 1",
    [buildingId]
  );

  return Boolean(result.rows[0]);
}

async function joinedAsset(pool, assetId) {
  const result = await pool.query(
    `
    SELECT
      a.*,
      b.name AS building_name,
      c.id AS customer_id,
      c.company_name AS customer_name
    FROM assets a
    JOIN buildings b ON b.id = a.building_id
    JOIN customers c ON c.id = b.customer_id
    WHERE a.id = $1
    LIMIT 1
    `,
    [assetId]
  );

  return result.rows[0];
}

router.get("/", requirePermission(PERMISSIONS.ASSETS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const search = cleanText(req.query.search);
    const status = cleanText(req.query.status);
    const assetCategory = cleanText(req.query.asset_category);
    const assetType = cleanText(req.query.asset_type);
    const condition = cleanText(req.query.condition);
    const customerId = cleanInteger(req.query.customer_id);
    const buildingId = cleanInteger(req.query.building_id);

    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(
        a.asset_reference ILIKE $${values.length}
        OR a.asset_category ILIKE $${values.length}
        OR a.asset_name ILIKE $${values.length}
        OR a.asset_tag ILIKE $${values.length}
        OR a.condition ILIKE $${values.length}
        OR a.ownership_type ILIKE $${values.length}
        OR a.manufacturer ILIKE $${values.length}
        OR a.model ILIKE $${values.length}
        OR a.serial_number ILIKE $${values.length}
        OR a.location_description ILIKE $${values.length}
        OR a.warranty_provider ILIKE $${values.length}
        OR a.warranty_reference ILIKE $${values.length}
        OR b.name ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
      )`);
    }

    if (status) {
      values.push(status);
      where.push(`a.status = $${values.length}`);
    }

    if (assetCategory) {
      values.push(assetCategory);
      where.push(`a.asset_category = $${values.length}`);
    }

    if (assetType) {
      values.push(assetType);
      where.push(`a.asset_type = $${values.length}`);
    }

    if (condition) {
      values.push(condition);
      where.push(`a.condition = $${values.length}`);
    }

    if (customerId) {
      values.push(customerId);
      where.push(`c.id = $${values.length}`);
    }

    if (buildingId) {
      values.push(buildingId);
      where.push(`a.building_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT
        a.*,
        b.name AS building_name,
        c.id AS customer_id,
        c.company_name AS customer_name
      FROM assets a
      JOIN buildings b ON b.id = a.building_id
      JOIN customers c ON c.id = b.customer_id
      ${whereSql}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT 250
      `,
      values
    );

    return res.json({
      ok: true,
      assets: result.rows.map(publicAsset)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/summary", requirePermission(PERMISSIONS.ASSETS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'Active')::INT AS active,
        COUNT(*) FILTER (WHERE status = 'Service Due')::INT AS service_due,
        COUNT(*) FILTER (WHERE status = 'Out of Service')::INT AS out_of_service,
        COUNT(*) FILTER (WHERE status = 'Retired')::INT AS retired
      FROM assets
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

router.get("/:id", requirePermission(PERMISSIONS.ASSETS_VIEW), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Invalid asset ID"
      });
    }

    const asset = await joinedAsset(pool, id);

    if (!asset) {
      return res.status(404).json({
        ok: false,
        error: "Asset not found"
      });
    }

    return res.json({
      ok: true,
      asset: publicAsset(asset)
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", requirePermission(PERMISSIONS.ASSETS_CREATE), async (req, res, next) => {
  try {
    const pool = getPool();
    const buildingId = cleanInteger(req.body.building_id);
    const assetName = cleanText(req.body.asset_name);
    const assetReference = cleanText(req.body.asset_reference) || await nextAssetReference(pool);

    if (!buildingId) {
      return res.status(400).json({
        ok: false,
        error: "Building is required"
      });
    }

    if (!assetName) {
      return res.status(400).json({
        ok: false,
        error: "Asset name is required"
      });
    }

    const exists = await buildingExists(pool, buildingId);

    if (!exists) {
      return res.status(400).json({
        ok: false,
        error: "Building not found"
      });
    }

    const referenceAvailable = await assetReferenceAvailable(pool, assetReference);

    if (!referenceAvailable) {
      return res.status(409).json({
        ok: false,
        error: "Asset reference already exists"
      });
    }

    const values = [
      buildingId,
      assetReference,
      assetName,
      cleanText(req.body.asset_tag),
      cleanText(req.body.asset_category) || "General",
      cleanText(req.body.asset_type) || "General",
      cleanText(req.body.status) || "Active",
      cleanText(req.body.condition) || "Unknown",
      cleanText(req.body.ownership_type) || "Customer Owned",
      cleanText(req.body.manufacturer),
      cleanText(req.body.model),
      cleanText(req.body.serial_number),
      cleanText(req.body.location_description),
      cleanDate(req.body.install_date),
      cleanDate(req.body.last_service_date),
      cleanDate(req.body.next_service_date),
      cleanText(req.body.warranty_provider),
      cleanText(req.body.warranty_reference),
      cleanDate(req.body.warranty_expiry),
      cleanText(req.body.notes),
      req.user.id
    ];

    const result = await pool.query(
      `
      INSERT INTO assets (
        building_id,
        asset_reference,
        asset_name,
        asset_tag,
        asset_category,
        asset_type,
        status,
        condition,
        ownership_type,
        manufacturer,
        model,
        serial_number,
        location_description,
        install_date,
        last_service_date,
        next_service_date,
        warranty_provider,
        warranty_reference,
        warranty_expiry,
        notes,
        created_by,
        updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $21
      )
      RETURNING *
      `,
      values
    );

    const asset = await joinedAsset(pool, result.rows[0].id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "asset.created",
      entityType: "asset",
      entityId: result.rows[0].id,
      metadata: {
        building_id: result.rows[0].building_id,
        asset_reference: result.rows[0].asset_reference,
        asset_name: result.rows[0].asset_name,
        asset_tag: result.rows[0].asset_tag,
        asset_category: result.rows[0].asset_category,
        status: result.rows[0].status
      }
    });

    return res.status(201).json({
      ok: true,
      asset: publicAsset(asset)
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id", requirePermission(PERMISSIONS.ASSETS_EDIT), async (req, res, next) => {
  try {
    const pool = getPool();
    const id = cleanInteger(req.params.id);
    const buildingId = cleanInteger(req.body.building_id);
    const assetName = cleanText(req.body.asset_name);
    const assetReference = cleanText(req.body.asset_reference);

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Invalid asset ID"
      });
    }

    if (!buildingId) {
      return res.status(400).json({
        ok: false,
        error: "Building is required"
      });
    }

    if (!assetName) {
      return res.status(400).json({
        ok: false,
        error: "Asset name is required"
      });
    }

    if (!assetReference) {
      return res.status(400).json({
        ok: false,
        error: "Asset reference is required"
      });
    }

    const existing = await pool.query(
      "SELECT * FROM assets WHERE id = $1 LIMIT 1",
      [id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({
        ok: false,
        error: "Asset not found"
      });
    }

    const exists = await buildingExists(pool, buildingId);

    if (!exists) {
      return res.status(400).json({
        ok: false,
        error: "Building not found"
      });
    }

    const referenceAvailable = await assetReferenceAvailable(pool, assetReference, id);

    if (!referenceAvailable) {
      return res.status(409).json({
        ok: false,
        error: "Asset reference already exists"
      });
    }

    const values = [
      buildingId,
      assetReference,
      assetName,
      cleanText(req.body.asset_tag),
      cleanText(req.body.asset_category) || "General",
      cleanText(req.body.asset_type) || "General",
      cleanText(req.body.status) || "Active",
      cleanText(req.body.condition) || "Unknown",
      cleanText(req.body.ownership_type) || "Customer Owned",
      cleanText(req.body.manufacturer),
      cleanText(req.body.model),
      cleanText(req.body.serial_number),
      cleanText(req.body.location_description),
      cleanDate(req.body.install_date),
      cleanDate(req.body.last_service_date),
      cleanDate(req.body.next_service_date),
      cleanText(req.body.warranty_provider),
      cleanText(req.body.warranty_reference),
      cleanDate(req.body.warranty_expiry),
      cleanText(req.body.notes),
      req.user.id,
      id
    ];

    await pool.query(
      `
      UPDATE assets
      SET
        building_id = $1,
        asset_reference = $2,
        asset_name = $3,
        asset_tag = $4,
        asset_category = $5,
        asset_type = $6,
        status = $7,
        condition = $8,
        ownership_type = $9,
        manufacturer = $10,
        model = $11,
        serial_number = $12,
        location_description = $13,
        install_date = $14,
        last_service_date = $15,
        next_service_date = $16,
        warranty_provider = $17,
        warranty_reference = $18,
        warranty_expiry = $19,
        notes = $20,
        updated_by = $21,
        updated_at = NOW()
      WHERE id = $22
      `,
      values
    );

    const asset = await joinedAsset(pool, id);

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "asset.updated",
      entityType: "asset",
      entityId: id,
      metadata: {
        previous_building_id: existing.rows[0].building_id,
        building_id: asset.building_id,
        previous_asset_reference: existing.rows[0].asset_reference,
        asset_reference: asset.asset_reference,
        asset_name: asset.asset_name,
        asset_tag: asset.asset_tag,
        previous_asset_category: existing.rows[0].asset_category,
        asset_category: asset.asset_category,
        previous_status: existing.rows[0].status,
        status: asset.status,
        previous_condition: existing.rows[0].condition,
        condition: asset.condition
      }
    });

    return res.json({
      ok: true,
      asset: publicAsset(asset)
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
