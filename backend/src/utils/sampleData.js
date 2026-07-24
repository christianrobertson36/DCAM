const SAMPLE_KEY = "dcam-operating-company-sample-v49";
const LEGACY_SAMPLE_KEY = "dcam-v24-sample-data";

const COUNT_TABLES = [
  ["customers", "customers"],
  ["contacts", "contacts"],
  ["buildings", "buildings"],
  ["assets", "assets"],
  ["work_orders", "work_orders"],
  ["schedule_assignments", "schedule_assignments"],
  ["maintenance_plans", "maintenance_plans"],
  ["compliance_services", "compliance_services"],
  ["defects", "defects"],
  ["service_requests", "service_requests"],
  ["pipeline_opportunities", "opportunities"],
  ["quotations", "quotations"],
  ["contracts", "contracts"],
  ["contract_services", "contract_services"],
  ["reports", "reports"],
  ["certificates", "certificates"],
  ["form_templates", "form_templates"],
  ["customer_activities", "customer_activities"],
  ["staff_profiles", "staff_profiles"],
  ["staff_qualifications", "staff_qualifications"],
  ["work_order_checklist_items", "checklist_items"],
  ["work_order_signatures", "signatures"]
];

async function sampleCounts(client) {
  const expressions = COUNT_TABLES.map(
    ([table, key]) => `(SELECT COUNT(*)::INT FROM ${table} WHERE sample_data_key = $1) AS ${key}`
  );
  const result = await client.query(`SELECT ${expressions.join(",\n")}`, [SAMPLE_KEY]);
  const counts = result.rows[0];
  const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  return { installed: total > 0, total, counts };
}

async function deleteSampleData(client) {
  const tables = [
    "certificates",
    "reports",
    "defects",
    "service_requests",
    "compliance_services",
    "schedule_assignments",
    "work_order_signatures",
    "work_order_checklist_items",
    "work_orders",
    "contract_services",
    "contracts",
    "quotations",
    "pipeline_opportunities",
    "maintenance_plans",
    "form_templates",
    "customer_activities",
    "contacts",
    "staff_qualifications",
    "staff_profiles",
    "assets",
    "buildings",
    "customers"
  ];
  const deleted = {};
  for (const table of tables) {
    const result = await client.query(
      `DELETE FROM ${table} WHERE sample_data_key = ANY($1::TEXT[])`,
      [[SAMPLE_KEY, LEGACY_SAMPLE_KEY]]
    );
    deleted[table] = result.rowCount;
  }
  return deleted;
}

async function deleteLegacySampleData(client) {
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
  for (const table of tables) {
    await client.query(`DELETE FROM ${table} WHERE sample_data_key = $1`, [LEGACY_SAMPLE_KEY]);
  }
}

function indexBy(rows, field) {
  return Object.fromEntries(rows.map((row) => [row[field], row]));
}

async function createSampleData(client, userId, requestedCurrency = "GBP") {
  const currency = requestedCurrency === "RON" ? "RON" : "GBP";
  const created = Object.fromEntries(COUNT_TABLES.map(([, key]) => [key, 0]));
  await deleteLegacySampleData(client);

  const customersResult = await client.query(
    `
    INSERT INTO customers (
      company_name, trading_name, customer_type, status, email, phone, website,
      address_line_1, city, county, postcode, country,
      primary_contact_name, primary_contact_email, primary_contact_phone,
      billing_contact_name, billing_contact_email, billing_contact_phone,
      account_owner_id, account_risk, notes, created_by, updated_by, sample_data_key
    ) VALUES
      ('Carpathia Property Management SRL', 'Carpathia Property', 'Property Management', 'Active',
       'office@carpathia.example.dcam', '+40 21 555 0101', 'https://carpathia.example.dcam',
       'Strada Aviatorilor 24', 'Bucharest', 'Bucharest', '011853', 'Romania',
       'Elena Ionescu', 'elena.ionescu@carpathia.example.dcam', '+40 722 100 101',
       'Marius Ionescu', 'finance@carpathia.example.dcam', '+40 21 555 0199',
       $1, 'Normal', 'Key account with two managed commercial properties and a recurring compliance contract.', $1, $1, $2),
      ('Danube Grand Hotel SA', 'Danube Grand Hotel', 'Hospitality', 'Active',
       'facilities@danubehotel.example.dcam', '+40 21 555 0201', 'https://danubehotel.example.dcam',
       'Calea Victoriei 118', 'Bucharest', 'Bucharest', '010092', 'Romania',
       'Andrei Pop', 'andrei.pop@danubehotel.example.dcam', '+40 723 200 202',
       'Irina Stan', 'accounts@danubehotel.example.dcam', '+40 21 555 0299',
       $1, 'Watch', 'Twenty-four-hour hotel operation; all disruptive work requires an agreed permit window.', $1, $1, $2),
      ('Transilvania Components SRL', 'TC Manufacturing', 'Industrial', 'Active',
       'maintenance@tcmanufacturing.example.dcam', '+40 264 555 0301', 'https://tcmanufacturing.example.dcam',
       'Strada Fabricii 8', 'Cluj-Napoca', 'Cluj', '400632', 'Romania',
       'Radu Muresan', 'radu.muresan@tcmanufacturing.example.dcam', '+40 724 300 303',
       'Ioana Pavel', 'finance@tcmanufacturing.example.dcam', '+40 264 555 0399',
       $1, 'High', 'Industrial site with critical electrical assets and an open high-risk defect.', $1, $1, $2),
      ('Orizont Education Foundation', 'Orizont Schools', 'Education', 'Prospect',
       'admin@orizont.example.dcam', '+40 268 555 0401', 'https://orizont.example.dcam',
       'Strada Scolii 15', 'Brasov', 'Brasov', '500123', 'Romania',
       'Maria Dumitru', 'maria.dumitru@orizont.example.dcam', '+40 725 400 404',
       'Maria Dumitru', 'maria.dumitru@orizont.example.dcam', '+40 725 400 404',
       $1, 'Normal', 'Prospect requesting a fire door survey and annual PAT testing quotation.', $1, $1, $2)
    RETURNING id, company_name
    `,
    [userId, SAMPLE_KEY]
  );
  created.customers = customersResult.rowCount;
  const customers = indexBy(customersResult.rows, "company_name");

  const contactsResult = await client.query(
    `
    INSERT INTO contacts (
      customer_id, contact_reference, first_name, last_name, job_title, email, phone, mobile,
      contact_type, status, is_primary, notes, created_by, updated_by, sample_data_key
    ) VALUES
      ($1, 'SAMPLE-CON-001', 'Elena', 'Ionescu', 'Property Operations Director', 'elena.ionescu@carpathia.example.dcam', '+40 21 555 0101', '+40 722 100 101', 'Primary', 'Active', TRUE, 'Approves compliance programmes and remedial budgets.', $5, $5, $6),
      ($1, 'SAMPLE-CON-002', 'Mihai', 'Georgescu', 'Site Facilities Manager', 'mihai.georgescu@carpathia.example.dcam', NULL, '+40 722 100 102', 'Site', 'Active', FALSE, 'Day-to-day access and engineer coordination.', $5, $5, $6),
      ($2, 'SAMPLE-CON-003', 'Andrei', 'Pop', 'Chief Engineer', 'andrei.pop@danubehotel.example.dcam', '+40 21 555 0201', '+40 723 200 202', 'Primary', 'Active', TRUE, 'Available around the clock for emergencies.', $5, $5, $6),
      ($3, 'SAMPLE-CON-004', 'Radu', 'Muresan', 'Maintenance Manager', 'radu.muresan@tcmanufacturing.example.dcam', '+40 264 555 0301', '+40 724 300 303', 'Primary', 'Active', TRUE, 'Requires RAMS before production-area work.', $5, $5, $6),
      ($4, 'SAMPLE-CON-005', 'Maria', 'Dumitru', 'Foundation Administrator', 'maria.dumitru@orizont.example.dcam', '+40 268 555 0401', '+40 725 400 404', 'Primary', 'Active', TRUE, 'Main contact for the current quotation.', $5, $5, $6)
    RETURNING id, contact_reference
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      customers["Orizont Education Foundation"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.contacts = contactsResult.rowCount;
  const contacts = indexBy(contactsResult.rows, "contact_reference");

  const buildingsResult = await client.query(
    `
    INSERT INTO buildings (
      customer_id, name, building_type, status, address_line_1, city, county, postcode, country,
      access_notes, compliance_notes, site_contact_name, site_contact_email, site_contact_phone,
      created_by, updated_by, sample_data_key
    ) VALUES
      ($1, 'Riverside Business Centre', 'Office', 'Active', 'Splaiul Independentei 210', 'Bucharest', 'Bucharest', '060029', 'Romania', 'Report to main reception. Plant rooms require escort.', 'Annual fire door, damper, emergency lighting and electrical inspections.', 'Mihai Georgescu', 'mihai.georgescu@carpathia.example.dcam', '+40 722 100 102', $5, $5, $6),
      ($1, 'Pipera Office Campus - Building B', 'Office', 'Active', 'Bulevardul Pipera 42', 'Voluntari', 'Ilfov', '077190', 'Romania', 'Parking must be booked 24 hours in advance.', 'Quarterly PPM and annual technical compliance audit.', 'Cristina Matei', 'cristina.matei@carpathia.example.dcam', '+40 722 100 103', $5, $5, $6),
      ($2, 'Danube Grand Hotel', 'Hotel', 'Active', 'Calea Victoriei 118', 'Bucharest', 'Bucharest', '010092', 'Romania', 'Use service entrance; noisy work 10:00-15:00 only.', 'Life-safety systems are critical. Guest floors require security escort.', 'Andrei Pop', 'andrei.pop@danubehotel.example.dcam', '+40 723 200 202', $5, $5, $6),
      ($3, 'Cluj Production Plant', 'Industrial', 'Active', 'Strada Fabricii 8', 'Cluj-Napoca', 'Cluj', '400632', 'Romania', 'Site induction, PPE and permit to work are mandatory.', 'Production shutdown window Saturday 06:00-12:00.', 'Radu Muresan', 'radu.muresan@tcmanufacturing.example.dcam', '+40 724 300 303', $5, $5, $6),
      ($4, 'Orizont School Brasov', 'Education', 'Survey Required', 'Strada Scolii 15', 'Brasov', 'Brasov', '500123', 'Romania', 'Visits outside teaching hours preferred.', 'Initial asset survey and fire door register required.', 'Maria Dumitru', 'maria.dumitru@orizont.example.dcam', '+40 725 400 404', $5, $5, $6),
      ($4, 'Orizont Kindergarten', 'Education', 'Survey Required', 'Strada Florilor 9', 'Brasov', 'Brasov', '500177', 'Romania', 'No contractor access during pupil arrival and collection.', 'Scope awaiting survey approval.', 'Maria Dumitru', 'maria.dumitru@orizont.example.dcam', '+40 725 400 404', $5, $5, $6)
    RETURNING id, name
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      customers["Orizont Education Foundation"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.buildings = buildingsResult.rowCount;
  const buildings = indexBy(buildingsResult.rows, "name");

  const assetRows = [
    ["Riverside Business Centre", "SAMPLE-AST-001", "Air Handling Unit AHU-01", "AHU-RBC-01", "Mechanical", "Air Handling Unit", "Active", "Good", "Ventex", "VX-500", "VX500-1001", "Roof plant room", -35, 55],
    ["Riverside Business Centre", "SAMPLE-AST-002", "Fire Alarm Panel FAP-01", "FAP-RBC-01", "Fire Safety", "Fire Alarm Panel", "Active", "Good", "Siemens", "FC2020", "FC20-8841", "Ground floor security room", -90, 275],
    ["Riverside Business Centre", "SAMPLE-AST-003", "Fire Door FD-GF-014", "FD-RBC-014", "Fire Safety", "Fire Door", "Remedial Required", "Poor", "Assa Abloy", "FD60", "FD60-014", "Ground floor east stair", -370, -5],
    ["Pipera Office Campus - Building B", "SAMPLE-AST-004", "Emergency Light EL-2F-22", "EL-PIP-022", "Electrical", "Emergency Light", "Service Due", "Fair", "Eaton", "SafeLite", "SL-22022", "Second floor north corridor", -190, 8],
    ["Pipera Office Campus - Building B", "SAMPLE-AST-005", "Distribution Board DB-L2", "DB-PIP-L2", "Electrical", "Distribution Board", "Active", "Good", "Schneider", "PrismaSeT", "PS-74112", "Second floor electrical riser", -240, 125],
    ["Danube Grand Hotel", "SAMPLE-AST-006", "Kitchen Fire Damper FD-K01", "DMP-DGH-K01", "Fire Safety", "Fire Damper", "Failed", "Poor", "Swegon", "FDC-200", "FDC-20114", "Main kitchen extract duct", -400, -12],
    ["Danube Grand Hotel", "SAMPLE-AST-007", "Passenger Lift L01", "LIFT-DGH-01", "Vertical Transport", "Passenger Lift", "Active", "Good", "KONE", "MonoSpace", "KMS-40018", "Main lobby", -28, 62],
    ["Danube Grand Hotel", "SAMPLE-AST-008", "Boiler B-02", "BLR-DGH-02", "Mechanical", "Gas Boiler", "Active", "Fair", "Viessmann", "Vitocrossal", "VC-19022", "Basement boiler room", -80, 10],
    ["Cluj Production Plant", "SAMPLE-AST-009", "Main LV Switchboard", "LV-TCM-01", "Electrical", "LV Switchboard", "Restricted Use", "Poor", "ABB", "MNS 3.0", "MNS-77211", "Main electrical room", -410, -20],
    ["Cluj Production Plant", "SAMPLE-AST-010", "Compressor CP-03", "CMP-TCM-03", "Mechanical", "Air Compressor", "Active", "Good", "Atlas Copco", "GA37", "GA37-55023", "Compressor house", -22, 68],
    ["Orizont School Brasov", "SAMPLE-AST-011", "Portable Appliance Batch - Admin", "PAT-ORI-ADM", "Electrical", "Portable Appliances", "Survey Required", "Unknown", "Various", "Mixed", "PAT-BATCH-01", "Administration wing", null, 21],
    ["Orizont School Brasov", "SAMPLE-AST-012", "Fire Door FD-1F-03", "FD-ORI-103", "Fire Safety", "Fire Door", "Survey Required", "Unknown", "Unknown", "FD30", "FD30-103", "First floor stair enclosure", null, 21]
  ];
  const assetValues = [];
  const assetParams = [];
  let p = 1;
  for (const row of assetRows) {
    const buildingId = buildings[row[0]].id;
    assetValues.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, 'Customer Owned', $${p++}, $${p++}, $${p++}, $${p++}, CURRENT_DATE - INTERVAL '900 days', ${row[12] === null ? "NULL" : `CURRENT_DATE + ($${p++} || ' days')::INTERVAL`}, CURRENT_DATE + ($${p++} || ' days')::INTERVAL, 'Sample operating asset with realistic service dates.', LOWER(MD5($${p++} || NOW()::TEXT)), $${p++}, $${p++}, $${p++})`);
    assetParams.push(buildingId, ...row.slice(1, 12));
    if (row[12] !== null) assetParams.push(row[12]);
    assetParams.push(row[13], row[1], userId, userId, SAMPLE_KEY);
  }
  const assetsResult = await client.query(
    `INSERT INTO assets (
      building_id, asset_reference, asset_name, asset_tag, asset_category, asset_type, status, condition,
      ownership_type, manufacturer, model, serial_number, location_description, install_date,
      last_service_date, next_service_date, notes, qr_token, created_by, updated_by, sample_data_key
    ) VALUES ${assetValues.join(",\n")} RETURNING id, asset_reference`,
    assetParams
  );
  created.assets = assetsResult.rowCount;
  const assets = indexBy(assetsResult.rows, "asset_reference");

  const workOrdersResult = await client.query(
    `
    INSERT INTO work_orders (
      work_order_reference, work_order_type, title, description, priority, status,
      customer_id, building_id, asset_id, assigned_user_id, due_date, completion_notes,
      created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-WO-001', 'Planned', 'Quarterly AHU inspection', 'Inspect filters, belts, panels and airflow.', 'Normal', 'Scheduled', $1, $5, $10, $14, CURRENT_DATE + 2, NULL, $14, $14, $15),
      ('SAMPLE-WO-002', 'Remedial', 'Repair fire door closer and seals', 'Replace defective closer and damaged intumescent seal.', 'High', 'Open', $1, $5, $11, $14, CURRENT_DATE + 5, NULL, $14, $14, $15),
      ('SAMPLE-WO-003', 'Reactive', 'Kitchen fire damper failed to close', 'Isolate affected duct section and replace actuator.', 'Urgent', 'In Progress', $2, $7, $12, $14, CURRENT_DATE, NULL, $14, $14, $15),
      ('SAMPLE-WO-004', 'Planned', 'Boiler seasonal service', 'Combustion analysis, safety checks and service record.', 'Normal', 'Scheduled', $2, $7, $13, $14, CURRENT_DATE + 7, NULL, $14, $14, $15),
      ('SAMPLE-WO-005', 'Remedial', 'Investigate LV switchboard thermal damage', 'Thermal scan identified hotspot on incoming connection.', 'Urgent', 'Awaiting Customer', $3, $8, $16, $14, CURRENT_DATE - 2, 'Quotation submitted for controlled shutdown repair.', $14, $14, $15),
      ('SAMPLE-WO-006', 'Planned', 'Air compressor monthly service', 'Check oil, filters, drains and operating temperatures.', 'Normal', 'Completed', $3, $8, $17, $14, CURRENT_DATE - 4, 'Service completed; readings within manufacturer limits.', $14, $14, $15),
      ('SAMPLE-WO-007', 'Survey', 'Initial school fire door survey', 'Create door register and record condition at both school blocks.', 'Normal', 'Open', $4, $9, $18, $14, CURRENT_DATE + 12, NULL, $14, $14, $15),
      ('SAMPLE-WO-008', 'Reactive', 'Emergency light intermittent fault', 'Inspect fitting and local circuit after occupant report.', 'High', 'Completed', $1, $6, $19, $14, CURRENT_DATE - 1, 'Battery pack replaced and functional test passed.', $14, $14, $15)
    RETURNING id, work_order_reference
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      customers["Orizont Education Foundation"].id,
      buildings["Riverside Business Centre"].id,
      buildings["Pipera Office Campus - Building B"].id,
      buildings["Danube Grand Hotel"].id,
      buildings["Cluj Production Plant"].id,
      buildings["Orizont School Brasov"].id,
      assets["SAMPLE-AST-001"].id,
      assets["SAMPLE-AST-003"].id,
      assets["SAMPLE-AST-006"].id,
      assets["SAMPLE-AST-008"].id,
      userId,
      SAMPLE_KEY,
      assets["SAMPLE-AST-009"].id,
      assets["SAMPLE-AST-010"].id,
      assets["SAMPLE-AST-012"].id,
      assets["SAMPLE-AST-004"].id
    ]
  );
  created.work_orders = workOrdersResult.rowCount;
  const workOrders = indexBy(workOrdersResult.rows, "work_order_reference");

  const schedulesResult = await client.query(
    `
    INSERT INTO schedule_assignments (
      work_order_id, assigned_user_id, schedule_date, start_time, end_time, status, notes,
      created_by, updated_by, sample_data_key
    ) VALUES
      ($1, $6, CURRENT_DATE + 2, '09:00', '11:30', 'Scheduled', 'Bring replacement filters and access permit.', $6, $6, $7),
      ($2, $6, CURRENT_DATE, '08:00', '12:00', 'In Progress', 'Urgent hotel response; coordinate with chief engineer.', $6, $6, $7),
      ($3, $6, CURRENT_DATE + 7, '10:00', '12:00', 'Scheduled', 'Use service entrance.', $6, $6, $7),
      ($4, $6, CURRENT_DATE + 12, '15:30', '18:00', 'Scheduled', 'Survey after teaching hours.', $6, $6, $7),
      ($5, $6, CURRENT_DATE - 4, '08:30', '10:00', 'Completed', 'Monthly compressor visit completed.', $6, $6, $7)
    RETURNING id
    `,
    [
      workOrders["SAMPLE-WO-001"].id,
      workOrders["SAMPLE-WO-003"].id,
      workOrders["SAMPLE-WO-004"].id,
      workOrders["SAMPLE-WO-007"].id,
      workOrders["SAMPLE-WO-006"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.schedule_assignments = schedulesResult.rowCount;

  const checklistResult = await client.query(
    `
    INSERT INTO work_order_checklist_items (
      work_order_id, item_text, is_completed, completed_at, completed_by, created_by, updated_by, sample_data_key
    ) VALUES
      ($1, 'Confirm safe access and isolation requirements', TRUE, NOW(), $4, $4, $4, $5),
      ($1, 'Inspect filters, belt tension and panel condition', FALSE, NULL, NULL, $4, $4, $5),
      ($2, 'Photograph damper and record failure position', TRUE, NOW(), $4, $4, $4, $5),
      ($2, 'Complete actuator replacement and drop test', FALSE, NULL, NULL, $4, $4, $5),
      ($3, 'Record compressor hours, temperatures and pressure', TRUE, NOW() - INTERVAL '4 days', $4, $4, $4, $5),
      ($3, 'Obtain customer sign-off', TRUE, NOW() - INTERVAL '4 days', $4, $4, $4, $5)
    RETURNING id
    `,
    [workOrders["SAMPLE-WO-001"].id, workOrders["SAMPLE-WO-003"].id, workOrders["SAMPLE-WO-006"].id, userId, SAMPLE_KEY]
  );
  created.checklist_items = checklistResult.rowCount;

  const signaturesResult = await client.query(
    `
    INSERT INTO work_order_signatures (
      work_order_id, signer_name, signer_role, signature_text, notes, signed_by, sample_data_key
    ) VALUES
      ($1, 'Radu Muresan', 'Maintenance Manager', 'Radu Muresan', 'Monthly compressor service accepted.', $2, $3),
      ($4, 'Cristina Matei', 'Site Manager', 'Cristina Matei', 'Emergency light repair accepted.', $2, $3)
    RETURNING id
    `,
    [workOrders["SAMPLE-WO-006"].id, userId, SAMPLE_KEY, workOrders["SAMPLE-WO-008"].id]
  );
  created.signatures = signaturesResult.rowCount;

  const maintenanceResult = await client.query(
    `
    INSERT INTO maintenance_plans (
      plan_reference, title, plan_type, status, frequency, priority, customer_id, building_id, asset_id,
      assigned_user_id, start_date, next_due_date, last_generated_date, estimated_duration_minutes,
      instructions, notes, created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-PPM-001', 'Riverside AHU quarterly PPM', 'Planned Maintenance', 'Active', 'Quarterly', 'Normal', $1, $4, $7, $10, CURRENT_DATE - 365, CURRENT_DATE + 2, CURRENT_DATE - 90, 150, 'Inspect filters, belts, bearings, panels and controls.', 'Active contracted maintenance plan.', $10, $10, $11),
      ('SAMPLE-PPM-002', 'Hotel boiler monthly checks', 'Planned Maintenance', 'Active', 'Monthly', 'Normal', $2, $5, $8, $10, CURRENT_DATE - 300, CURRENT_DATE + 7, CURRENT_DATE - 23, 120, 'Complete manufacturer service checklist and combustion readings.', 'Schedule within hotel maintenance window.', $10, $10, $11),
      ('SAMPLE-PPM-003', 'Production compressor monthly PPM', 'Planned Maintenance', 'Active', 'Monthly', 'High', $3, $6, $9, $10, CURRENT_DATE - 250, CURRENT_DATE + 26, CURRENT_DATE - 4, 90, 'Check oil, filters, condensate drains, temperature and vibration.', 'Production-critical asset.', $10, $10, $11)
    RETURNING id
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      buildings["Riverside Business Centre"].id,
      buildings["Danube Grand Hotel"].id,
      buildings["Cluj Production Plant"].id,
      assets["SAMPLE-AST-001"].id,
      assets["SAMPLE-AST-008"].id,
      assets["SAMPLE-AST-010"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.maintenance_plans = maintenanceResult.rowCount;

  const complianceResult = await client.query(
    `
    INSERT INTO compliance_services (
      service_reference, service_name, service_type, status, priority, result_status, risk_rating,
      customer_id, building_id, asset_id, work_order_id, assigned_user_id,
      scheduled_date, completed_date, defects_found, certificate_required, certificate_status,
      report_status, findings, corrective_actions, notes, approved_by, approved_at,
      created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-CMP-001', 'Riverside annual fire door inspection', 'Fire Door Inspection', 'Completed', 'Normal', 'Fail', 'High', $1, $4, $8, $12, $16, CURRENT_DATE - 8, CURRENT_DATE - 8, TRUE, TRUE, 'Not Issued', 'Approved', 'Door FD-GF-014 failed closer and seal checks.', 'Replace closer and intumescent seal within 14 days.', 'Remedial work order raised.', $16, NOW() - INTERVAL '7 days', $16, $16, $17),
      ('SAMPLE-CMP-002', 'Hotel kitchen fire damper test', 'Fire Damper Inspection', 'In Progress', 'Urgent', 'Fail', 'Critical', $2, $5, $9, $13, $16, CURRENT_DATE, NULL, TRUE, TRUE, 'Not Issued', 'Draft', 'Kitchen damper did not close during drop test.', 'Replace actuator and repeat full functional test.', 'Urgent corrective action underway.', NULL, NULL, $16, $16, $17),
      ('SAMPLE-CMP-003', 'Pipera emergency lighting inspection', 'Emergency Lighting', 'Completed', 'Normal', 'Pass with Observations', 'Low', $1, $6, $10, $14, $16, CURRENT_DATE - 3, CURRENT_DATE - 3, FALSE, TRUE, 'Issued', 'Issued', 'One intermittent fitting replaced; remaining sample passed.', 'Continue routine monthly function tests.', 'Report and certificate issued.', $16, NOW() - INTERVAL '2 days', $16, $16, $17),
      ('SAMPLE-CMP-004', 'Orizont initial fire door survey', 'Fire Door Inspection', 'Planned', 'Normal', 'Not Started', 'Unrated', $3, $7, $11, $15, $16, CURRENT_DATE + 12, NULL, FALSE, TRUE, 'Not Required', 'Draft', NULL, NULL, 'Initial register creation for prospect site.', NULL, NULL, $16, $16, $17)
    RETURNING id, service_reference
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Orizont Education Foundation"].id,
      buildings["Riverside Business Centre"].id,
      buildings["Danube Grand Hotel"].id,
      buildings["Pipera Office Campus - Building B"].id,
      buildings["Orizont School Brasov"].id,
      assets["SAMPLE-AST-003"].id,
      assets["SAMPLE-AST-006"].id,
      assets["SAMPLE-AST-004"].id,
      assets["SAMPLE-AST-012"].id,
      workOrders["SAMPLE-WO-002"].id,
      workOrders["SAMPLE-WO-003"].id,
      workOrders["SAMPLE-WO-008"].id,
      workOrders["SAMPLE-WO-007"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.compliance_services = complianceResult.rowCount;
  const services = indexBy(complianceResult.rows, "service_reference");

  const requestsResult = await client.query(
    `
    INSERT INTO service_requests (
      request_reference, customer_id, building_id, asset_id, requester_name, requester_email,
      category, title, description, priority, status, source, assigned_user_id, sla_due_at,
      work_order_id, converted_at, converted_by, created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-REQ-001', $1, $4, $7, 'Andrei Pop', 'andrei.pop@danubehotel.example.dcam', 'Reactive Maintenance', 'Kitchen damper warning', 'Kitchen team reported a damper warning after the morning fire system test.', 'Urgent', 'Converted', 'Email', $11, NOW() + INTERVAL '2 hours', $9, NOW() - INTERVAL '2 hours', $11, $11, $11, $12),
      ('SAMPLE-REQ-002', $2, $5, $8, 'Mihai Georgescu', 'mihai.georgescu@carpathia.example.dcam', 'Maintenance', 'AHU vibration reported', 'Occupants on level six reported unusual vibration from the roof plant.', 'High', 'In Progress', 'Portal', $11, NOW() + INTERVAL '8 hours', $10, NOW() - INTERVAL '1 day', $11, $11, $11, $12),
      ('SAMPLE-REQ-003', $3, $6, NULL, 'Maria Dumitru', 'maria.dumitru@orizont.example.dcam', 'Survey', 'Confirm school survey date', 'Please confirm the proposed after-school survey date and engineer arrival time.', 'Normal', 'New', 'Portal', $11, NOW() + INTERVAL '2 days', NULL, NULL, NULL, $11, $11, $12)
    RETURNING id, request_reference
    `,
    [
      customers["Danube Grand Hotel SA"].id,
      customers["Carpathia Property Management SRL"].id,
      customers["Orizont Education Foundation"].id,
      buildings["Danube Grand Hotel"].id,
      buildings["Riverside Business Centre"].id,
      buildings["Orizont School Brasov"].id,
      assets["SAMPLE-AST-006"].id,
      assets["SAMPLE-AST-001"].id,
      workOrders["SAMPLE-WO-003"].id,
      workOrders["SAMPLE-WO-001"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.service_requests = requestsResult.rowCount;
  const requests = indexBy(requestsResult.rows, "request_reference");

  const defectsResult = await client.query(
    `
    INSERT INTO defects (
      defect_reference, title, description, category, severity, risk_rating, status,
      customer_id, building_id, asset_id, compliance_service_id, service_request_id, work_order_id,
      assigned_user_id, identified_date, target_date, corrective_action, verification_notes,
      verified_at, verified_by, created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-DEF-001', 'Fire door closer does not latch', 'Door remains approximately 20 mm open from a full release.', 'Fire Safety', 'High', 'High', 'Remedial Work Raised', $1, $4, $7, $10, NULL, $12, $15, CURRENT_DATE - 8, CURRENT_DATE + 6, 'Replace closer, adjust latch and renew damaged seal.', NULL, NULL, NULL, $15, $15, $16),
      ('SAMPLE-DEF-002', 'Kitchen fire damper failed drop test', 'Damper blade remained open after release command.', 'Fire Safety', 'Critical', 'Critical', 'In Progress', $2, $5, $8, $11, $13, $14, $15, CURRENT_DATE, CURRENT_DATE + 1, 'Replace actuator and verify fail-safe closure.', NULL, NULL, NULL, $15, $15, $16),
      ('SAMPLE-DEF-003', 'LV switchboard incoming connection hotspot', 'Thermal scan recorded temperature significantly above adjacent phases.', 'Electrical', 'Critical', 'Critical', 'Awaiting Customer', $3, $6, $9, NULL, NULL, $17, $15, CURRENT_DATE - 5, CURRENT_DATE + 2, 'Approve controlled shutdown, retorque connection and repeat thermography.', 'Quotation issued; awaiting production shutdown approval.', NULL, NULL, $15, $15, $16)
    RETURNING id
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      buildings["Riverside Business Centre"].id,
      buildings["Danube Grand Hotel"].id,
      buildings["Cluj Production Plant"].id,
      assets["SAMPLE-AST-003"].id,
      assets["SAMPLE-AST-006"].id,
      assets["SAMPLE-AST-009"].id,
      services["SAMPLE-CMP-001"].id,
      services["SAMPLE-CMP-002"].id,
      workOrders["SAMPLE-WO-002"].id,
      requests["SAMPLE-REQ-001"].id,
      workOrders["SAMPLE-WO-003"].id,
      userId,
      SAMPLE_KEY,
      workOrders["SAMPLE-WO-005"].id
    ]
  );
  created.defects = defectsResult.rowCount;

  const opportunitiesResult = await client.query(
    `
    INSERT INTO pipeline_opportunities (
      customer_id, contact_id, opportunity_reference, opportunity_name, stage, status,
      estimated_value, probability, expected_close_date, owner_user_id, source, next_action,
      notes, created_by, updated_by, sample_data_key
    ) VALUES
      ($1, $5, 'SAMPLE-OPP-001', 'Orizont annual fire and PAT programme', 'Proposal', 'Open', 48500, 65, CURRENT_DATE + 18, $9, 'Referral', 'Follow up after board meeting', 'Two-site annual compliance proposal.', $9, $9, $10),
      ($2, $6, 'SAMPLE-OPP-002', 'Carpathia multi-site PPM renewal', 'Negotiation', 'Open', 126000, 85, CURRENT_DATE + 10, $9, 'Renewal', 'Confirm final service frequencies', 'Renewal opportunity for both managed offices.', $9, $9, $10),
      ($3, $7, 'SAMPLE-OPP-003', 'Hotel kitchen damper remedials', 'Won', 'Won', 12800, 100, CURRENT_DATE - 1, $9, 'Service', 'Schedule urgent remedial work', 'Accepted urgent remedial quotation.', $9, $9, $10),
      ($4, $8, 'SAMPLE-OPP-004', 'Plant electrical reliability programme', 'Qualified', 'Open', 76000, 40, CURRENT_DATE + 35, $9, 'Engineer Recommendation', 'Arrange scope review with maintenance manager', 'Thermography and planned electrical maintenance programme.', $9, $9, $10)
    RETURNING id, opportunity_reference
    `,
    [
      customers["Orizont Education Foundation"].id,
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      contacts["SAMPLE-CON-005"].id,
      contacts["SAMPLE-CON-001"].id,
      contacts["SAMPLE-CON-003"].id,
      contacts["SAMPLE-CON-004"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.opportunities = opportunitiesResult.rowCount;
  const opportunities = indexBy(opportunitiesResult.rows, "opportunity_reference");

  const quotationsResult = await client.query(
    `
    INSERT INTO quotations (
      quotation_reference, customer_id, building_id, opportunity_id, title, status, currency,
      valid_until, notes, subtotal, tax_rate, tax_total, total, accepted_at,
      created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-Q-001', $1, $4, $7, 'Annual fire door and PAT compliance programme', 'Sent', '${currency}', CURRENT_DATE + 25, 'Includes both Orizont sites; final quantities subject to survey.', 40756.30, 19, 7743.70, 48500.00, NULL, $10, $10, $11),
      ('SAMPLE-Q-002', $2, $5, $8, 'Carpathia multi-site PPM renewal', 'Draft', '${currency}', CURRENT_DATE + 30, 'Renewal pricing for quarterly PPM and annual compliance inspections.', 105882.35, 19, 20117.65, 126000.00, NULL, $10, $10, $11),
      ('SAMPLE-Q-003', $3, $6, $9, 'Urgent kitchen fire damper remedial works', 'Accepted', '${currency}', CURRENT_DATE + 7, 'Includes replacement actuator, access and repeat drop test.', 10756.30, 19, 2043.70, 12800.00, NOW() - INTERVAL '1 day', $10, $10, $11),
      ('SAMPLE-Q-004', $4, NULL, $12, 'LV switchboard controlled shutdown repair', 'Sent', '${currency}', CURRENT_DATE + 10, 'Weekend shutdown, torque remediation and verification thermography.', 18487.39, 19, 3512.61, 22000.00, NULL, $10, $10, $11)
    RETURNING id, quotation_reference
    `,
    [
      customers["Orizont Education Foundation"].id,
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      buildings["Orizont School Brasov"].id,
      buildings["Riverside Business Centre"].id,
      opportunities["SAMPLE-OPP-001"].id,
      opportunities["SAMPLE-OPP-002"].id,
      opportunities["SAMPLE-OPP-003"].id,
      userId,
      SAMPLE_KEY,
      opportunities["SAMPLE-OPP-004"].id
    ]
  );
  created.quotations = quotationsResult.rowCount;
  const quotations = indexBy(quotationsResult.rows, "quotation_reference");

  await client.query(
    `
    INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, line_total, sort_order)
    VALUES
      ($1, 'Fire door inspection and digital register', 110, 185, 20350, 1),
      ($1, 'PAT testing allowance', 350, 42, 14700, 2),
      ($1, 'Mobilisation and compliance reporting', 1, 5706.30, 5706.30, 3),
      ($2, 'Quarterly planned maintenance programme', 4, 18500, 74000, 1),
      ($2, 'Annual fire safety compliance inspections', 1, 31882.35, 31882.35, 2),
      ($3, 'Fire damper actuator and installation', 1, 7850, 7850, 1),
      ($3, 'Access, testing and certification', 1, 2906.30, 2906.30, 2),
      ($4, 'Controlled shutdown electrical remediation', 1, 14500, 14500, 1),
      ($4, 'Verification thermography and report', 1, 3987.39, 3987.39, 2)
    `,
    [
      quotations["SAMPLE-Q-001"].id,
      quotations["SAMPLE-Q-002"].id,
      quotations["SAMPLE-Q-003"].id,
      quotations["SAMPLE-Q-004"].id
    ]
  );

  const contractsResult = await client.query(
    `
    INSERT INTO contracts (
      contract_reference, quotation_id, customer_id, building_id, title, status,
      start_date, end_date, renewal_date, value, currency, notes,
      renewal_status, renewal_owner_id, renewal_opportunity_id, renewal_notice_days,
      created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-CTR-001', NULL, $1, NULL, 'Carpathia integrated compliance and PPM contract', 'Active', CURRENT_DATE - 330, CURRENT_DATE + 35, CURRENT_DATE + 35, 118000, '${currency}', 'Covers Riverside and Pipera locations.', 'In Progress', $4, $5, 90, $4, $4, $6),
      ('SAMPLE-CTR-002', NULL, $2, $7, 'Danube Grand Hotel life-safety maintenance', 'Active', CURRENT_DATE - 160, CURRENT_DATE + 205, CURRENT_DATE + 205, 82000, '${currency}', 'Annual life-safety inspections and monthly boiler PPM.', 'Not Started', $4, NULL, 90, $4, $4, $6),
      ('SAMPLE-CTR-003', NULL, $3, $8, 'TC Manufacturing mechanical PPM', 'Active', CURRENT_DATE - 95, CURRENT_DATE + 270, CURRENT_DATE + 270, 54000, '${currency}', 'Monthly compressor service and quarterly condition reporting.', 'Not Started', $4, NULL, 60, $4, $4, $6)
    RETURNING id, contract_reference
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      userId,
      opportunities["SAMPLE-OPP-002"].id,
      SAMPLE_KEY,
      buildings["Danube Grand Hotel"].id,
      buildings["Cluj Production Plant"].id
    ]
  );
  created.contracts = contractsResult.rowCount;
  const contracts = indexBy(contractsResult.rows, "contract_reference");

  const servicesResult = await client.query(
    `
    INSERT INTO contract_services (
      contract_id, service_name, frequency, priority, building_id, asset_id, assigned_user_id,
      next_due_date, last_generated_date, estimated_duration_minutes, instructions, status,
      created_by, updated_by, sample_data_key
    ) VALUES
      ($1, 'Riverside AHU quarterly PPM', 'Quarterly', 'Normal', $4, $7, $10, CURRENT_DATE + 2, CURRENT_DATE - 90, 150, 'Complete standard AHU inspection checklist.', 'Active', $10, $10, $11),
      ($1, 'Pipera annual emergency lighting inspection', 'Annual', 'Normal', $5, $8, $10, CURRENT_DATE + 90, CURRENT_DATE - 275, 240, 'Complete functional and duration testing.', 'Active', $10, $10, $11),
      ($2, 'Hotel boiler monthly PPM', 'Monthly', 'Normal', $6, $9, $10, CURRENT_DATE + 7, CURRENT_DATE - 23, 120, 'Use agreed hotel maintenance window.', 'Active', $10, $10, $11),
      ($2, 'Hotel annual fire damper programme', 'Annual', 'High', $6, NULL, $10, CURRENT_DATE + 190, CURRENT_DATE - 175, 480, 'Coordinate access to all guest and kitchen zones.', 'Active', $10, $10, $11),
      ($3, 'Production compressor monthly PPM', 'Monthly', 'High', $12, $13, $10, CURRENT_DATE + 26, CURRENT_DATE - 4, 90, 'Record operating condition and production impact.', 'Active', $10, $10, $11)
    RETURNING id
    `,
    [
      contracts["SAMPLE-CTR-001"].id,
      contracts["SAMPLE-CTR-002"].id,
      contracts["SAMPLE-CTR-003"].id,
      buildings["Riverside Business Centre"].id,
      buildings["Pipera Office Campus - Building B"].id,
      buildings["Danube Grand Hotel"].id,
      assets["SAMPLE-AST-001"].id,
      assets["SAMPLE-AST-004"].id,
      assets["SAMPLE-AST-008"].id,
      userId,
      SAMPLE_KEY,
      buildings["Cluj Production Plant"].id,
      assets["SAMPLE-AST-010"].id
    ]
  );
  created.contract_services = servicesResult.rowCount;

  const reportsResult = await client.query(
    `
    INSERT INTO reports (
      report_reference, report_title, report_type, status, customer_id, building_id, asset_id,
      work_order_id, compliance_service_id, date_from, date_to, summary, findings, recommendations,
      approved_by, approved_at, created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-RPT-001', 'Riverside Fire Door Inspection Report', 'Fire Door Inspection', 'Approved', $1, $3, $5, $7, $9, CURRENT_DATE - 8, CURRENT_DATE - 8, 'Annual inspection completed across the sampled door set.', 'One high-risk fire door defect requires remedial action.', 'Complete repair within 14 days and retain photographic evidence.', $11, NOW() - INTERVAL '7 days', $11, $11, $12),
      ('SAMPLE-RPT-002', 'Pipera Emergency Lighting Completion Report', 'Emergency Lighting', 'Issued', $1, $4, $6, $8, $10, CURRENT_DATE - 3, CURRENT_DATE - 3, 'Inspection and remedial replacement completed.', 'One battery pack was replaced; tested fittings passed.', 'Continue monthly function and annual duration testing.', $11, NOW() - INTERVAL '2 days', $11, $11, $12),
      ('SAMPLE-RPT-003', 'TC Manufacturing Compressor Service Report', 'Maintenance', 'Issued', $2, $13, $14, $15, NULL, CURRENT_DATE - 4, CURRENT_DATE - 4, 'Monthly planned maintenance completed.', 'Operating readings were within manufacturer tolerance.', 'Continue monthly plan; review oil sample at next quarterly visit.', $11, NOW() - INTERVAL '3 days', $11, $11, $12)
    RETURNING id, report_reference
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Transilvania Components SRL"].id,
      buildings["Riverside Business Centre"].id,
      buildings["Pipera Office Campus - Building B"].id,
      assets["SAMPLE-AST-003"].id,
      assets["SAMPLE-AST-004"].id,
      workOrders["SAMPLE-WO-002"].id,
      workOrders["SAMPLE-WO-008"].id,
      services["SAMPLE-CMP-001"].id,
      services["SAMPLE-CMP-003"].id,
      userId,
      SAMPLE_KEY,
      buildings["Cluj Production Plant"].id,
      assets["SAMPLE-AST-010"].id,
      workOrders["SAMPLE-WO-006"].id
    ]
  );
  created.reports = reportsResult.rowCount;
  const reports = indexBy(reportsResult.rows, "report_reference");

  const certificatesResult = await client.query(
    `
    INSERT INTO certificates (
      certificate_reference, certificate_title, certificate_type, status, customer_id, building_id,
      asset_id, compliance_service_id, report_id, issue_date, expiry_date, certificate_body,
      issued_by, issued_at, created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-CERT-001', 'Pipera Emergency Lighting Compliance Certificate', 'Emergency Lighting', 'Issued', $1, $2, $3, $4, $5, CURRENT_DATE - 2, CURRENT_DATE + 363, 'Emergency lighting inspection completed with recorded remedial action.', $6, NOW() - INTERVAL '2 days', $6, $6, $7),
      ('SAMPLE-CERT-002', 'TC Compressor Planned Maintenance Certificate', 'Maintenance Completion', 'Issued', $8, $9, $10, NULL, $11, CURRENT_DATE - 3, CURRENT_DATE + 27, 'Monthly preventive maintenance visit completed.', $6, NOW() - INTERVAL '3 days', $6, $6, $7)
    RETURNING id
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      buildings["Pipera Office Campus - Building B"].id,
      assets["SAMPLE-AST-004"].id,
      services["SAMPLE-CMP-003"].id,
      reports["SAMPLE-RPT-002"].id,
      userId,
      SAMPLE_KEY,
      customers["Transilvania Components SRL"].id,
      buildings["Cluj Production Plant"].id,
      assets["SAMPLE-AST-010"].id,
      reports["SAMPLE-RPT-003"].id
    ]
  );
  created.certificates = certificatesResult.rowCount;

  const templatesResult = await client.query(
    `
    INSERT INTO form_templates (
      template_reference, template_name, service_type, status, version_number, scoring_enabled,
      approval_required, description, sections, created_by, updated_by, sample_data_key
    ) VALUES
      ('SAMPLE-FRM-001', 'Fire Door Inspection Checklist', 'Fire Door Inspection', 'Published', 2, FALSE, TRUE, 'Operational fire door checklist with evidence prompts.', $1::JSONB, $4, $4, $5),
      ('SAMPLE-FRM-002', 'Fire Damper Drop Test', 'Fire Damper Inspection', 'Published', 1, FALSE, TRUE, 'Functional drop-test and reinstatement checklist.', $2::JSONB, $4, $4, $5),
      ('SAMPLE-FRM-003', 'General PPM Service Visit', 'Planned Maintenance', 'Published', 3, TRUE, FALSE, 'Reusable planned-maintenance service checklist.', $3::JSONB, $4, $4, $5)
    RETURNING id
    `,
    [
      JSON.stringify([{ title: "Door identification", questions: ["Confirm asset tag and location", "Photograph door leaf and frame"] }, { title: "Inspection", questions: ["Does the door fully close and latch?", "Are seals continuous and undamaged?", "Record gaps and defects"] }]),
      JSON.stringify([{ title: "Pre-test", questions: ["Confirm access and isolation", "Record damper position"] }, { title: "Functional test", questions: ["Release damper", "Confirm full closure", "Reset and photograph"] }]),
      JSON.stringify([{ title: "Safety", questions: ["Complete dynamic risk assessment", "Confirm isolation"] }, { title: "Service", questions: ["Record readings", "Inspect condition", "List parts used"] }]),
      userId,
      SAMPLE_KEY
    ]
  );
  created.form_templates = templatesResult.rowCount;

  const activitiesResult = await client.query(
    `
    INSERT INTO customer_activities (
      customer_id, activity_type, subject, details, occurred_at, created_by, sample_data_key
    ) VALUES
      ($1, 'Meeting', 'Quarterly account review', 'Reviewed open defects, PPM performance and upcoming contract renewal.', NOW() - INTERVAL '6 days', $5, $6),
      ($1, 'Email', 'Renewal budget sent', 'Sent draft renewal budget and updated service schedule.', NOW() - INTERVAL '2 days', $5, $6),
      ($2, 'Call', 'Urgent damper fault reported', 'Chief engineer requested same-day response to kitchen damper failure.', NOW() - INTERVAL '5 hours', $5, $6),
      ($3, 'Site Visit', 'Electrical risk review', 'Discussed shutdown requirements for LV switchboard remedial work.', NOW() - INTERVAL '3 days', $5, $6),
      ($4, 'Meeting', 'Proposal walkthrough', 'Explained fire door survey, PAT scope and customer portal access.', NOW() - INTERVAL '4 days', $5, $6),
      ($4, 'Task', 'Follow up after board meeting', 'Contact Maria to confirm approval and proposed survey dates.', NOW() + INTERVAL '3 days', $5, $6)
    RETURNING id
    `,
    [
      customers["Carpathia Property Management SRL"].id,
      customers["Danube Grand Hotel SA"].id,
      customers["Transilvania Components SRL"].id,
      customers["Orizont Education Foundation"].id,
      userId,
      SAMPLE_KEY
    ]
  );
  created.customer_activities = activitiesResult.rowCount;

  const profileResult = await client.query(
    `
    INSERT INTO staff_profiles (
      user_id, job_title, employment_type, phone, skills, service_areas, working_hours,
      availability_status, competency_notes, created_by, updated_by, sample_data_key
    ) VALUES (
      $1, 'Senior Compliance Engineer', 'Employee', '+40 721 900 001',
      'Fire doors, fire dampers, electrical inspection, HVAC PPM',
      'Bucharest, Ilfov, Brasov, Cluj', 'Monday-Friday 08:00-17:00',
      'Available', 'Sample operating profile attached to the current administrator for scheduling demonstrations.',
      $1, $1, $2
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id
    `,
    [userId, SAMPLE_KEY]
  );
  created.staff_profiles = profileResult.rowCount;
  if (profileResult.rows[0]) {
    const qualificationsResult = await client.query(
      `
      INSERT INTO staff_qualifications (
        staff_profile_id, qualification_name, issuing_body, certificate_number, issue_date,
        expiry_date, status, notes, created_by, updated_by, sample_data_key
      ) VALUES
        ($1, 'Fire Door Inspection Competency', 'DCAM Training Academy', 'SAMPLE-QUAL-001', CURRENT_DATE - 220, CURRENT_DATE + 145, 'Valid', 'Annual competency renewal tracked in DCAM.', $2, $2, $3),
        ($1, 'Electrical Safety and Isolation', 'DCAM Training Academy', 'SAMPLE-QUAL-002', CURRENT_DATE - 330, CURRENT_DATE + 35, 'Expiring Soon', 'Renewal reminder should appear in operational planning.', $2, $2, $3)
      RETURNING id
      `,
      [profileResult.rows[0].id, userId, SAMPLE_KEY]
    );
    created.staff_qualifications = qualificationsResult.rowCount;
  }

  return created;
}

module.exports = {
  SAMPLE_KEY,
  sampleCounts,
  deleteSampleData,
  createSampleData
};
