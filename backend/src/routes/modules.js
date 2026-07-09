const express = require("express");

const { PERMISSIONS } = require("../config/permissions");
const { authRequired, requirePermission } = require("../middleware/authRequired");

const router = express.Router();

router.use(authRequired);

const notImplemented = (moduleName) => (req, res) => {
  res.status(501).json({
    ok: false,
    module: moduleName,
    error: moduleName + " is not implemented yet"
  });
};

router.get("/contacts", requirePermission(PERMISSIONS.CUSTOMERS_VIEW), notImplemented("Contacts"));
router.get("/work-orders", requirePermission(PERMISSIONS.BUILDINGS_VIEW), notImplemented("Work Orders"));
router.get("/reports", requirePermission(PERMISSIONS.BUILDINGS_VIEW), notImplemented("Reports"));
router.get("/certificates", requirePermission(PERMISSIONS.BUILDINGS_VIEW), notImplemented("Certificates"));

module.exports = router;
