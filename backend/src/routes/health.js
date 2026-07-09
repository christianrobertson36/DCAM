const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "DCAM API",
    name: "Digital Compliance & Asset Management",
    version: "v2",
    status: "healthy", auth: "login-and-roles-foundation",
    modules: [
      "CRM",
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

