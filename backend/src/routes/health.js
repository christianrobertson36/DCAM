const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "DCAM API",
    name: "Digital Compliance & Asset Management",
    version: "v16",
    status: "healthy",
    auth: "login-roles-permissions-foundation",
    crm: "customers-foundation",
    buildings: "buildings-sites-foundation",
    assets: "asset-qr-history-foundation",
    work_orders: "work-orders-cmms-foundation",
    audit: "audit-events-foundation",
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
