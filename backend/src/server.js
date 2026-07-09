require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const customersRoutes = require("./routes/customers");
const buildingsRoutes = require("./routes/buildings");
const assetsRoutes = require("./routes/assets");
const moduleRoutes = require("./routes/modules");

const app = express();

const PORT = Number(process.env.PORT || 5055);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/", healthRoutes);
app.use("/auth", authRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/buildings", buildingsRoutes);
app.use("/api/assets", assetsRoutes);
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
