const express = require("express");

const router = express.Router();

const placeholder = (moduleName) => (req, res) => {
  res.json({
    ok: true,
    module: moduleName,
    version: "v1",
    message: moduleName + " API placeholder created. Full CRUD planned in upcoming sprints."
  });
};

router.get("/customers", placeholder("Customers"));
router.get("/contacts", placeholder("Contacts"));
router.get("/buildings", placeholder("Buildings"));
router.get("/assets", placeholder("Assets"));
router.get("/work-orders", placeholder("Work Orders"));
router.get("/reports", placeholder("Reports"));
router.get("/certificates", placeholder("Certificates"));

module.exports = router;
