const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "DCAM API",
    name: "Digital Compliance & Asset Management",
    version: "v7",
    status: "healthy",
    auth: "login-roles-permissions-foundation",
    crm: "customers-foundation",
    buildings: "buildings-sites-foundation",
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
