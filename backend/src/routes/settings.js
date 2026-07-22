const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const SAMPLE_KEY = "dcam-v24-sample-data";
const uploadRoot = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));
const brandingUploadRoot = path.join(uploadRoot, "branding");
const BRANDING_DEFAULTS = {
  product_name: "DCAM",
  company_name: "Digital Compliance & Asset Management",
  tagline: "Technical compliance operations, connected.",
  primary_color: "#2563EB",
  accent_color: "#38BDF8",
  sidebar_color: "#07111F",
  support_email: null,
  support_phone: null,
  company_address: null,
  logo_filename: null,
  logo_content_type: null,
  favicon_filename: null,
  favicon_content_type: null,
  show_powered_by: true
};

function cleanText(value, maxLength = 500) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function cleanColour(value, fallback) {
  const colour = String(value || "").trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(colour) ? colour : fallback;
}

function publicBranding(row) {
  const branding = { ...BRANDING_DEFAULTS, ...(row || {}) };
  return {
    product_name: branding.product_name,
    company_name: branding.company_name,
    tagline: branding.tagline,
    primary_color: branding.primary_color,
    accent_color: branding.accent_color,
    sidebar_color: branding.sidebar_color,
    support_email: branding.support_email,
    support_phone: branding.support_phone,
    company_address: branding.company_address,
    show_powered_by: branding.show_powered_by,
    logo_url: branding.logo_filename ? "/api/settings/branding/logo" : null,
    favicon_url: branding.favicon_filename ? "/api/settings/branding/favicon" : null,
    updated_at: branding.updated_at || null
  };
}

async function getBrandingRow(pool) {
  const result = await pool.query("SELECT * FROM branding_settings WHERE id = 1 LIMIT 1");
  return result.rows[0] || null;
}

router.get("/branding", async (req, res, next) => {
  try {
    const row = await getBrandingRow(getPool());
    return res.json({ ok: true, branding: publicBranding(row) });
  } catch (err) {
    return next(err);
  }
});

router.get("/branding/:kind(logo|favicon)", async (req, res, next) => {
  try {
    const row = await getBrandingRow(getPool());
    const filename = row?.[`${req.params.kind}_filename`];
    const contentType = row?.[`${req.params.kind}_content_type`];

    if (!filename) return res.status(404).json({ ok: false, error: "Brand asset not found" });

    const filePath = path.join(brandingUploadRoot, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: "Brand asset file not found" });

    res.type(contentType || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=300");
    return res.sendFile(filePath);
  } catch (err) {
    return next(err);
  }
});

router.use(authRequired);

router.put("/branding", requirePermission(PERMISSIONS.SETTINGS_ADMIN), async (req, res, next) => {
  try {
    const pool = getPool();
    const values = {
      product_name: cleanText(req.body.product_name, 80) || BRANDING_DEFAULTS.product_name,
      company_name: cleanText(req.body.company_name, 160) || BRANDING_DEFAULTS.company_name,
      tagline: cleanText(req.body.tagline, 240) || BRANDING_DEFAULTS.tagline,
      primary_color: cleanColour(req.body.primary_color, BRANDING_DEFAULTS.primary_color),
      accent_color: cleanColour(req.body.accent_color, BRANDING_DEFAULTS.accent_color),
      sidebar_color: cleanColour(req.body.sidebar_color, BRANDING_DEFAULTS.sidebar_color),
      support_email: cleanText(req.body.support_email, 200),
      support_phone: cleanText(req.body.support_phone, 80),
      company_address: cleanText(req.body.company_address, 800),
      show_powered_by: req.body.show_powered_by !== false
    };

    const result = await pool.query(
      `
      INSERT INTO branding_settings (
        id, product_name, company_name, tagline, primary_color, accent_color,
        sidebar_color, support_email, support_phone, company_address,
        show_powered_by, updated_by, updated_at
      )
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (id) DO UPDATE SET
        product_name = EXCLUDED.product_name,
        company_name = EXCLUDED.company_name,
        tagline = EXCLUDED.tagline,
        primary_color = EXCLUDED.primary_color,
        accent_color = EXCLUDED.accent_color,
        sidebar_color = EXCLUDED.sidebar_color,
        support_email = EXCLUDED.support_email,
        support_phone = EXCLUDED.support_phone,
        company_address = EXCLUDED.company_address,
        show_powered_by = EXCLUDED.show_powered_by,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *
      `,
      [
        values.product_name, values.company_name, values.tagline, values.primary_color,
        values.accent_color, values.sidebar_color, values.support_email, values.support_phone,
        values.company_address, values.show_powered_by, req.user.id
      ]
    );

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: "settings.branding_updated",
      entityType: "branding_settings",
      entityId: 1,
      metadata: values
    });

    return res.json({ ok: true, branding: publicBranding(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.post("/branding/:kind(logo|favicon)", requirePermission(PERMISSIONS.SETTINGS_ADMIN), async (req, res, next) => {
  try {
    const kind = req.params.kind;
    const contentType = cleanText(req.body.content_type, 100);
    const allowedTypes = { "image/png": ".png", "image/webp": ".webp" };
    const extension = allowedTypes[contentType];
    const encoded = String(req.body.content_base64 || "");
    const base64 = encoded.includes(",") ? encoded.split(",").pop() : encoded;
    const content = Buffer.from(base64, "base64");

    if (!extension) return res.status(400).json({ ok: false, error: "Use a PNG or WebP image" });
    if (!content.length) return res.status(400).json({ ok: false, error: "Image content is required" });
    if (content.length > 2 * 1024 * 1024) return res.status(400).json({ ok: false, error: "Image must be 2MB or smaller" });

    const pngValid = contentType !== "image/png" || (content[0] === 0x89 && content.slice(1, 4).toString("ascii") === "PNG");
    const webpValid = contentType !== "image/webp" || (content.slice(0, 4).toString("ascii") === "RIFF" && content.slice(8, 12).toString("ascii") === "WEBP");
    if (!pngValid || !webpValid) return res.status(400).json({ ok: false, error: "Image content does not match its file type" });

    const pool = getPool();
    const before = await getBrandingRow(pool);
    const filename = `${kind}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;
    fs.mkdirSync(brandingUploadRoot, { recursive: true });
    fs.writeFileSync(path.join(brandingUploadRoot, filename), content);

    const result = await pool.query(
      `UPDATE branding_settings SET ${kind}_filename = $1, ${kind}_content_type = $2, updated_by = $3, updated_at = NOW() WHERE id = 1 RETURNING *`,
      [filename, contentType, req.user.id]
    );

    const previousFilename = before?.[`${kind}_filename`];
    if (previousFilename && previousFilename !== filename) {
      fs.rmSync(path.join(brandingUploadRoot, previousFilename), { force: true });
    }

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: `settings.branding_${kind}_uploaded`,
      entityType: "branding_settings",
      entityId: 1,
      metadata: { content_type: contentType, file_size: content.length }
    });

    return res.status(201).json({ ok: true, branding: publicBranding(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.delete("/branding/:kind(logo|favicon)", requirePermission(PERMISSIONS.SETTINGS_ADMIN), async (req, res, next) => {
  try {
    const kind = req.params.kind;
    const pool = getPool();
    const before = await getBrandingRow(pool);
    const result = await pool.query(
      `UPDATE branding_settings SET ${kind}_filename = NULL, ${kind}_content_type = NULL, updated_by = $1, updated_at = NOW() WHERE id = 1 RETURNING *`,
      [req.user.id]
    );

    const previousFilename = before?.[`${kind}_filename`];
    if (previousFilename) fs.rmSync(path.join(brandingUploadRoot, previousFilename), { force: true });

    await writeAuditEvent(pool, {
      actorUserId: req.user.id,
      action: `settings.branding_${kind}_removed`,
      entityType: "branding_settings",
      entityId: 1
    });

    return res.json({ ok: true, branding: publicBranding(result.rows[0]) });
  } catch (err) {
    return next(err);
  }
});

async function sampleCounts(client) {
  const result = await client.query(
    `
    SELECT
      (SELECT COUNT(*)::INT FROM customers WHERE sample_data_key = $1) AS customers,
      (SELECT COUNT(*)::INT FROM buildings WHERE sample_data_key = $1) AS buildings,
      (SELECT COUNT(*)::INT FROM assets WHERE sample_data_key = $1) AS assets,
      (SELECT COUNT(*)::INT FROM work_orders WHERE sample_data_key = $1) AS work_orders,
      (SELECT COUNT(*)::INT FROM schedule_assignments WHERE sample_data_key = $1) AS schedule_assignments,
      (SELECT COUNT(*)::INT FROM staff_profiles WHERE sample_data_key = $1) AS staff_profiles,
      (SELECT COUNT(*)::INT FROM staff_qualifications WHERE sample_data_key = $1) AS staff_qualifications,
      (SELECT COUNT(*)::INT FROM work_order_checklist_items WHERE sample_data_key = $1) AS checklist_items,
      (SELECT COUNT(*)::INT FROM work_order_signatures WHERE sample_data_key = $1) AS signatures
    `,
    [SAMPLE_KEY]
  );

  const counts = result.rows[0];
  const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);

  return {
    installed: total > 0,
    total,
    counts
  };
}

async function deleteSampleData(client) {
  const tables = [
    "work_order_signatures",
    "work_order_checklist_items",
    "schedule_assignments",
    "work_orders",
    "staff_qualifications",
    "staff_profiles",
    "assets",
    "buildings",
    "customers"
  ];
  const deleted = {};

  for (const table of tables) {
    const result = await client.query(
      `DELETE FROM ${table} WHERE sample_data_key = $1`,
      [SAMPLE_KEY]
    );
    deleted[table] = result.rowCount;
  }

  return deleted;
}

async function createSampleData(client, userId) {
  const created = {
    customers: 0,
    buildings: 0,
    assets: 0,
    work_orders: 0,
    schedule_assignments: 0,
    staff_profiles: 0,
    staff_qualifications: 0,
    checklist_items: 0,
    signatures: 0
  };

  const customerResult = await client.query(
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
      city,
      county,
      postcode,
      country,
      primary_contact_name,
      primary_contact_email,
      primary_contact_phone,
      notes,
      created_by,
      updated_by,
      sample_data_key
    )
    VALUES
      (
        'Apex Facilities Group',
        'Apex Facilities',
        'Commercial',
        'Active',
        'facilities@example.dcam',
        '+44 20 0000 1001',
        'https://example.dcam/apex',
        '10 Compliance Way',
        'London',
        'Greater London',
        'EC1A 1AA',
        'United Kingdom',
        'Sarah Collins',
        'sarah.collins@example.dcam',
        '+44 20 0000 1002',
        'Sample customer for compliance, assets and planned maintenance workflows.',
        $1,
        $1,
        $2
      ),
      (
        'Northbank Retail Ltd',
        'Northbank Retail',
        'Commercial',
        'Active',
        'estates@example.dcam',
        '+44 20 0000 2001',
        'https://example.dcam/northbank',
        '42 High Street',
        'Manchester',
        'Greater Manchester',
        'M1 1AE',
        'United Kingdom',
        'Daniel Price',
        'daniel.price@example.dcam',
        '+44 20 0000 2002',
        'Sample customer with retail site assets and reactive work.',
        $1,
        $1,
        $2
      )
    RETURNING id, company_name
    `,
    [userId, SAMPLE_KEY]
  );
  created.customers = customerResult.rowCount;

  const apexCustomer = customerResult.rows[0];
  const retailCustomer = customerResult.rows[1];

  const buildingResult = await client.query(
    `
    INSERT INTO buildings (
      customer_id,
      name,
      building_type,
      status,
      address_line_1,
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
      updated_by,
      sample_data_key
    )
    VALUES
      (
        $1,
        'Apex HQ - Plant Room',
        'Office',
        'Active',
        '10 Compliance Way',
        'London',
        'Greater London',
        'EC1A 1AA',
        'United Kingdom',
        'Report to reception and request plant room escort.',
        'Annual emergency lighting, HVAC and fire door checks required.',
        'Sarah Collins',
        'sarah.collins@example.dcam',
        '+44 20 0000 1002',
        $3,
        $3,
        $4
      ),
      (
        $2,
        'Northbank Store 014',
        'Retail',
        'Active',
        '42 High Street',
        'Manchester',
        'Greater Manchester',
        'M1 1AE',
        'United Kingdom',
        'Keys held by store manager. Rear loading bay access after 08:00.',
        'Quarterly asset inspections and reactive callouts tracked in DCAM.',
        'Daniel Price',
        'daniel.price@example.dcam',
        '+44 20 0000 2002',
        $3,
        $3,
        $4
      )
    RETURNING id, name
    `,
    [apexCustomer.id, retailCustomer.id, userId, SAMPLE_KEY]
  );
  created.buildings = buildingResult.rowCount;

  const apexBuilding = buildingResult.rows[0];
  const retailBuilding = buildingResult.rows[1];

  const assetResult = await client.query(
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
      qr_token,
      created_by,
      updated_by,
      sample_data_key
    )
    VALUES
      (
        $1,
        'SAMPLE-AST-001',
        'Main AHU 01',
        'AHU-PLANT-01',
        'Mechanical',
        'Air Handling Unit',
        'Active',
        'Good',
        'Customer Owned',
        'Ventex',
        'VX-500',
        'VX500-SAMPLE-001',
        'Roof plant deck',
        CURRENT_DATE - INTERVAL '730 days',
        CURRENT_DATE - INTERVAL '60 days',
        CURRENT_DATE + INTERVAL '30 days',
        'Ventex Service',
        'WX-SAMPLE-001',
        CURRENT_DATE + INTERVAL '180 days',
        'Sample asset due for planned service.',
        LOWER(MD5('SAMPLE-AST-001' || NOW()::TEXT)),
        $3,
        $3,
        $4
      ),
      (
        $2,
        'SAMPLE-AST-002',
        'Fire Alarm Panel',
        'FIRE-PANEL-014',
        'Fire Safety',
        'Alarm Panel',
        'Service Due',
        'Fair',
        'Customer Owned',
        'SafeSignal',
        'SS-2400',
        'SS2400-SAMPLE-014',
        'Back office riser cupboard',
        CURRENT_DATE - INTERVAL '1100 days',
        CURRENT_DATE - INTERVAL '120 days',
        CURRENT_DATE - INTERVAL '7 days',
        'SafeSignal',
        'FS-SAMPLE-014',
        CURRENT_DATE + INTERVAL '90 days',
        'Sample asset currently overdue for attention.',
        LOWER(MD5('SAMPLE-AST-002' || NOW()::TEXT)),
        $3,
        $3,
        $4
      )
    RETURNING id, asset_name
    `,
    [apexBuilding.id, retailBuilding.id, userId, SAMPLE_KEY]
  );
  created.assets = assetResult.rowCount;

  const ahuAsset = assetResult.rows[0];
  const fireAsset = assetResult.rows[1];

  await client.query(
    `
    INSERT INTO asset_history (asset_id, actor_user_id, event_type, event_title, metadata)
    VALUES
      ($1, $3, 'sample.created', 'Sample asset created', $4::JSONB),
      ($2, $3, 'sample.created', 'Sample asset created', $4::JSONB)
    `,
    [ahuAsset.id, fireAsset.id, userId, JSON.stringify({ sample_data_key: SAMPLE_KEY })]
  );

  const workOrderResult = await client.query(
    `
    INSERT INTO work_orders (
      work_order_reference,
      work_order_type,
      title,
      description,
      priority,
      status,
      customer_id,
      building_id,
      asset_id,
      assigned_user_id,
      due_date,
      completion_notes,
      created_by,
      updated_by,
      sample_data_key
    )
    VALUES
      (
        'SAMPLE-WO-001',
        'Planned',
        'Quarterly AHU inspection',
        'Inspect belts, filters, access panels and record airflow notes.',
        'Normal',
        'Open',
        $1,
        $2,
        $3,
        $7,
        CURRENT_DATE + INTERVAL '7 days',
        NULL,
        $7,
        $7,
        $8
      ),
      (
        'SAMPLE-WO-002',
        'Reactive',
        'Investigate fire panel fault',
        'Customer reported intermittent warning on the fire alarm panel.',
        'High',
        'In Progress',
        $4,
        $5,
        $6,
        $7,
        CURRENT_DATE + INTERVAL '1 day',
        NULL,
        $7,
        $7,
        $8
      )
    RETURNING id, work_order_reference
    `,
    [
      apexCustomer.id,
      apexBuilding.id,
      ahuAsset.id,
      retailCustomer.id,
      retailBuilding.id,
      fireAsset.id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.work_orders = workOrderResult.rowCount;

  const plannedOrder = workOrderResult.rows[0];
  const reactiveOrder = workOrderResult.rows[1];

  const scheduleResult = await client.query(
    `
    INSERT INTO schedule_assignments (
      work_order_id,
      assigned_user_id,
      schedule_date,
      start_time,
      end_time,
      status,
      notes,
      created_by,
      updated_by,
      sample_data_key
    )
    VALUES
      ($1, $3, CURRENT_DATE + INTERVAL '2 days', '09:00', '11:00', 'Scheduled', 'Sample planned maintenance visit.', $3, $3, $4),
      ($2, $3, CURRENT_DATE + INTERVAL '1 day', '13:00', '15:00', 'Scheduled', 'Sample reactive callout.', $3, $3, $4)
    RETURNING id
    `,
    [plannedOrder.id, reactiveOrder.id, userId, SAMPLE_KEY]
  );
  created.schedule_assignments = scheduleResult.rowCount;

  const checklistResult = await client.query(
    `
    INSERT INTO work_order_checklist_items (
      work_order_id,
      item_text,
      is_completed,
      completed_at,
      completed_by,
      created_by,
      updated_by,
      sample_data_key
    )
    VALUES
      ($1, 'Confirm safe access and isolation requirements', TRUE, NOW(), $3, $3, $3, $4),
      ($1, 'Inspect filters, belt tension and panel condition', FALSE, NULL, NULL, $3, $3, $4),
      ($2, 'Photograph fault code before reset', TRUE, NOW(), $3, $3, $3, $4),
      ($2, 'Record customer sign-off after test', FALSE, NULL, NULL, $3, $3, $4)
    RETURNING id
    `,
    [plannedOrder.id, reactiveOrder.id, userId, SAMPLE_KEY]
  );
  created.checklist_items = checklistResult.rowCount;

  const signatureResult = await client.query(
    `
    INSERT INTO work_order_signatures (
      work_order_id,
      signer_name,
      signer_role,
      signature_text,
      notes,
      signed_by,
      sample_data_key
    )
    VALUES
      ($1, 'Daniel Price', 'Store Manager', 'Daniel Price', 'Sample customer sign-off awaiting final completion notes.', $2, $3)
    RETURNING id
    `,
    [reactiveOrder.id, userId, SAMPLE_KEY]
  );
  created.signatures = signatureResult.rowCount;

  const staffProfileResult = await client.query(
    `
    INSERT INTO staff_profiles (
      user_id,
      job_title,
      employment_type,
      phone,
      skills,
      service_areas,
      working_hours,
      availability_status,
      competency_notes,
      created_by,
      updated_by,
      sample_data_key
    )
    VALUES (
      $1,
      'Sample Compliance Engineer',
      'Employee',
      '+44 20 0000 3001',
      'Fire alarms, HVAC, emergency lighting, asset verification',
      'London, Manchester',
      'Monday-Friday 08:00-17:00',
      'Available',
      'Sample staff profile generated for demo planning and job allocation.',
      $1,
      $1,
      $2
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id
    `,
    [userId, SAMPLE_KEY]
  );
  created.staff_profiles = staffProfileResult.rowCount;

  if (staffProfileResult.rows[0]) {
    const qualificationResult = await client.query(
      `
      INSERT INTO staff_qualifications (
        staff_profile_id,
        qualification_name,
        issuing_body,
        certificate_number,
        issue_date,
        expiry_date,
        status,
        notes,
        created_by,
        updated_by,
        sample_data_key
      )
      VALUES (
        $1,
        'Sample Fire Alarm Maintenance',
        'DCAM Training',
        'SAMPLE-CERT-001',
        CURRENT_DATE - INTERVAL '180 days',
        CURRENT_DATE + INTERVAL '185 days',
        'Valid',
        'Sample qualification for the People section.',
        $2,
        $2,
        $3
      )
      RETURNING id
      `,
      [staffProfileResult.rows[0].id, userId, SAMPLE_KEY]
    );
    created.staff_qualifications = qualificationResult.rowCount;
  }

  return created;
}

router.get("/sample-data", requirePermission(PERMISSIONS.SETTINGS_ADMIN), async (req, res, next) => {
  try {
    const pool = getPool();
    const status = await sampleCounts(pool);

    return res.json({
      ok: true,
      sample_data: status
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/sample-data", requirePermission(PERMISSIONS.SETTINGS_ADMIN), async (req, res, next) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const before = await sampleCounts(client);

    if (before.installed) {
      await client.query("COMMIT");
      return res.json({
        ok: true,
        sample_data: before,
        created: {},
        message: "Sample data is already installed"
      });
    }

    const created = await createSampleData(client, req.user.id);

    await writeAuditEvent(client, {
      actorUserId: req.user.id,
      action: "settings.sample_data_installed",
      entityType: "settings",
      entityId: null,
      metadata: {
        sample_data_key: SAMPLE_KEY,
        created
      }
    });

    const after = await sampleCounts(client);
    await client.query("COMMIT");

    return res.status(201).json({
      ok: true,
      sample_data: after,
      created,
      message: "Sample data installed"
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
});

router.delete("/sample-data", requirePermission(PERMISSIONS.SETTINGS_ADMIN), async (req, res, next) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const before = await sampleCounts(client);
    const deleted = await deleteSampleData(client);

    await writeAuditEvent(client, {
      actorUserId: req.user.id,
      action: "settings.sample_data_deleted",
      entityType: "settings",
      entityId: null,
      metadata: {
        sample_data_key: SAMPLE_KEY,
        previous_total: before.total,
        deleted
      }
    });

    const after = await sampleCounts(client);
    await client.query("COMMIT");

    return res.json({
      ok: true,
      sample_data: after,
      deleted,
      message: "Sample data deleted"
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
