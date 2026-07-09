const express = require("express");
const bcrypt = require("bcryptjs");

const { getPool } = require("../db/pool");
const { signToken } = require("../auth/tokens");
const { authRequired } = require("../middleware/authRequired");
const { publicUser } = require("../utils/publicUser");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email and password are required"
      });
    }

    const pool = getPool();

    const result = await pool.query(
      `
      SELECT id, name, email, password_hash, role, status, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return res.status(401).json({
        ok: false,
        error: "Invalid login details"
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({
        ok: false,
        error: "Invalid login details"
      });
    }

    await pool.query(
      "UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
      [user.id]
    );

    const safeUser = publicUser(user);
    const token = signToken(safeUser);

    return res.json({
      ok: true,
      token,
      user: safeUser
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/logout", (req, res) => {
  res.json({
    ok: true,
    message: "Logged out"
  });
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const pool = getPool();

    const result = await pool.query(
      `
      SELECT id, name, email, role, status, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.sub]
    );

    const user = result.rows[0];

    if (!user || user.status !== "active") {
      return res.status(401).json({
        ok: false,
        error: "User not found or inactive"
      });
    }

    return res.json({
      ok: true,
      user: publicUser(user)
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
