const { createSampleData } = require("../src/utils/sampleData");

let nextId = 1;

const returnedRows = {
  customers: [
    "Carpathia Property Management SRL",
    "Danube Grand Hotel SA",
    "Transilvania Components SRL",
    "Orizont Education Foundation"
  ].map((company_name) => ({ id: nextId++, company_name })),
  contacts: ["SAMPLE-CON-001", "SAMPLE-CON-002", "SAMPLE-CON-003", "SAMPLE-CON-004", "SAMPLE-CON-005"]
    .map((contact_reference) => ({ id: nextId++, contact_reference })),
  buildings: [
    "Riverside Business Centre",
    "Pipera Office Campus - Building B",
    "Danube Grand Hotel",
    "Cluj Production Plant",
    "Orizont School Brasov",
    "Orizont Kindergarten"
  ].map((name) => ({ id: nextId++, name })),
  assets: Array.from({ length: 12 }, (_, index) => ({
    id: nextId++,
    asset_reference: `SAMPLE-AST-${String(index + 1).padStart(3, "0")}`
  })),
  work_orders: Array.from({ length: 8 }, (_, index) => ({
    id: nextId++,
    work_order_reference: `SAMPLE-WO-${String(index + 1).padStart(3, "0")}`
  })),
  compliance_services: Array.from({ length: 4 }, (_, index) => ({
    id: nextId++,
    service_reference: `SAMPLE-CMP-${String(index + 1).padStart(3, "0")}`
  })),
  service_requests: Array.from({ length: 3 }, (_, index) => ({
    id: nextId++,
    request_reference: `SAMPLE-REQ-${String(index + 1).padStart(3, "0")}`
  })),
  pipeline_opportunities: Array.from({ length: 4 }, (_, index) => ({
    id: nextId++,
    opportunity_reference: `SAMPLE-OPP-${String(index + 1).padStart(3, "0")}`
  })),
  quotations: Array.from({ length: 4 }, (_, index) => ({
    id: nextId++,
    quotation_reference: `SAMPLE-Q-${String(index + 1).padStart(3, "0")}`
  })),
  contracts: Array.from({ length: 3 }, (_, index) => ({
    id: nextId++,
    contract_reference: `SAMPLE-CTR-${String(index + 1).padStart(3, "0")}`
  })),
  reports: Array.from({ length: 3 }, (_, index) => ({
    id: nextId++,
    report_reference: `SAMPLE-RPT-${String(index + 1).padStart(3, "0")}`
  }))
};

function insertedTable(sql) {
  return sql.match(/INSERT\s+INTO\s+([a-z_]+)/i)?.[1] || null;
}

const client = {
  async query(sql, params = []) {
    const placeholders = [...sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
    const expected = placeholders.length ? Math.max(...placeholders) : 0;
    if (expected !== params.length) {
      throw new Error(`Parameter mismatch for ${insertedTable(sql) || "query"}: SQL expects ${expected}, received ${params.length}`);
    }

    const table = insertedTable(sql);
    const rows = returnedRows[table] || (sql.includes("RETURNING") ? [{ id: nextId++ }] : []);
    return { rows, rowCount: rows.length };
  }
};

createSampleData(client, 999)
  .then((created) => {
    console.log("Comprehensive sample-data query validation passed.");
    console.log(JSON.stringify(created, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
