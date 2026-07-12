const express = require("express");

const { PERMISSIONS } = require("../config/permissions");
const { getPool } = require("../db/pool");
const { authRequired, requirePermission } = require("../middleware/authRequired");
const { writeAuditEvent } = require("../utils/audit");

const router = express.Router();
const SAMPLE_KEY = "dcam-v24-sample-data";

router.use(authRequired);

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
      ($2, 'Daniel Price', 'Store Manager', 'Daniel Price', 'Sample customer sign-off awaiting final completion notes.', $3, $4)
    RETURNING id
    `,
    [plannedOrder.id, reactiveOrder.id, userId, SAMPLE_KEY]
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
