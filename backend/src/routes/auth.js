const express = require("express");

const router = express.Router();

router.post("/login", (req, res) => {
  res.status(501).json({
    ok: false,
    message: "Auth login endpoint planned for v2."
  });
});

router.post("/logout", (req, res) => {
  res.status(501).json({
    ok: false,
    message: "Auth logout endpoint planned for v2."
  });
});

router.get("/me", (req, res) => {
  res.status(501).json({
    ok: false,
    message: "Current user endpoint planned for v2."
  });
});

module.exports = router;
