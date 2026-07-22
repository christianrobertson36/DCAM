const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "DCAM API",
    name: "Digital Compliance & Asset Management",
    version: "v41",
    status: "healthy",
    auth: "login-roles-permissions-foundation",
    crm: "customers-foundation",
    contacts: "contacts-foundation",
    pipeline: "crm-pipeline-foundation",
    buildings: "buildings-sites-foundation",
    assets: "asset-qr-history-foundation",
    work_orders: "work-orders-cmms-foundation",
    staff: "technician-engineer-profiles-foundation",
    schedule: "scheduling-job-allocation-foundation",
    planned_maintenance: "planned-preventive-maintenance-foundation",
    compliance_services: "compliance-service-modules-foundation",
    forms: "forms-inspection-builder-foundation",
    reports_foundation: "reports-foundation",
    certificates_foundation: "certificates-foundation",
    customer_portal: "customer-portal-foundation",
    technician_jobs: "technician-jobs-foundation",
    job_evidence: "technician-job-evidence-foundation",
    job_checklists: "technician-job-checklist-foundation",
    job_signoff: "technician-job-signoff-foundation",
    settings: "settings-language-sample-data-foundation",
    record_history: "record-edit-history-foundation",
    audit: "audit-events-foundation",
    user_administration: "users-roles-access-foundation",
    dashboard: "live-permission-aware-operations-dashboard",
    operational_alerts: "permission-aware-alert-centre-foundation",
    global_search: "permission-aware-global-search-foundation",
    branding: "branding-white-label-settings-foundation",
    branded_documents: "branded-report-certificate-pdf-foundation",
    modules: [
      "CRM",
      "Buildings / Sites",
      "CMMS",
      "Asset Management",
      "Work Orders",
      "Technician App",
      "Customer Portal",
      "Reports",
      "Certificates"
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
