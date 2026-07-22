require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const customersRoutes = require("./routes/customers");
const contactsRoutes = require("./routes/contacts");
const pipelineRoutes = require("./routes/pipeline");
const buildingsRoutes = require("./routes/buildings");
const assetsRoutes = require("./routes/assets");
const assetOptionsRoutes = require("./routes/assetOptions");
const workOrdersRoutes = require("./routes/workOrders");
const staffRoutes = require("./routes/staff");
const scheduleRoutes = require("./routes/schedule");
const technicianRoutes = require("./routes/technician");
const settingsRoutes = require("./routes/settings");
const auditRoutes = require("./routes/audit");
const maintenancePlansRoutes = require("./routes/maintenancePlans");
const complianceServicesRoutes = require("./routes/complianceServices");
const formTemplatesRoutes = require("./routes/formTemplates");
const reportsRoutes = require("./routes/reports");
const certificatesRoutes = require("./routes/certificates");
const customerPortalRoutes = require("./routes/customerPortal");
const usersRoutes = require("./routes/users");
const moduleRoutes = require("./routes/modules");

const app = express();

const PORT = Number(process.env.PORT || 5055);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/", healthRoutes);
app.use("/auth", authRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/buildings", buildingsRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/asset-options", assetOptionsRoutes);
app.use("/api/work-orders", workOrdersRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/maintenance-plans", maintenancePlansRoutes);
app.use("/api/compliance-services", complianceServicesRoutes);
app.use("/api/form-templates", formTemplatesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/customer-portal", customerPortalRoutes);
app.use("/api/admin/users", usersRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api", moduleRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Not found",
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error("DCAM API error:", err);

  res.status(500).json({
    ok: false,
    error: "Internal server error"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("DCAM API running on port " + PORT);
});
