const express = require("express");
const bcrypt = require("bcryptjs");

const { getPool } = require("../db/pool");
const { signToken } = require("../auth/tokens");
const { authRequired } = require("../middleware/authRequired");
const { publicUser } = require("../utils/publicUser");
const { writeAuditEvent } = require("../utils/audit");
const {
  microsoftConfig,
  stateCookieName,
  createStateCookie,
  verifyStateCookie,
  readCookie,
  cookieOptions,
  microsoftAuthorizeUrl,
  exchangeCode,
  verifyMicrosoftIdToken
} = require("../auth/microsoft");

const router = express.Router();

function microsoftErrorRedirect(config, code) {
  return `${config.publicUrl}/#microsoft_error=${encodeURIComponent(code)}`;
}

router.get("/microsoft/status", (req, res) => {
  const config = microsoftConfig();
  return res.json({
    ok: true,
    microsoft: {
      enabled: config.enabled,
      account_type: "organizations"
    }
  });
});

router.get("/microsoft", (req, res) => {
  const config = microsoftConfig();
  if (!config.enabled) return res.redirect(microsoftErrorRedirect(config, "not_configured"));

  const state = createStateCookie();
  res.cookie(stateCookieName(), state.token, cookieOptions(config));
  return res.redirect(microsoftAuthorizeUrl(config, state));
});

router.get("/microsoft/callback", async (req, res) => {
  const config = microsoftConfig();
  const { maxAge, ...clearOptions } = cookieOptions(config);

  try {
    if (!config.enabled) return res.redirect(microsoftErrorRedirect(config, "not_configured"));
    if (req.query.error) return res.redirect(microsoftErrorRedirect(config, "cancelled"));

    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    const cookie = readCookie(req, stateCookieName());
    if (!code || !state || !cookie) {
      return res.redirect(microsoftErrorRedirect(config, "invalid_response"));
    }

    const stored = verifyStateCookie(cookie, state);
    res.clearCookie(stateCookieName(), clearOptions);
    const tokenResponse = await exchangeCode(config, code, stored.verifier);
    const identity = await verifyMicrosoftIdToken(config, tokenResponse.id_token, stored.nonce);
    const pool = getPool();

    const tenantResult = await pool.query(
      `
      SELECT tenant_id, display_name, status
      FROM microsoft_tenants
      WHERE tenant_id = $1
      LIMIT 1
      `,
      [identity.tenantId]
    );
    const tenant = tenantResult.rows[0];
    const isHomeTenant = identity.tenantId === config.homeTenantId;
    if (!isHomeTenant && (!tenant || tenant.status !== "active")) {
      return res.redirect(microsoftErrorRedirect(config, "tenant_not_approved"));
    }

    let userResult = await pool.query(
      `
      SELECT id, name, email, role, status, auth_provider,
             microsoft_tenant_id, microsoft_object_id, created_at, updated_at
      FROM users
      WHERE microsoft_tenant_id = $1 AND microsoft_object_id = $2
      LIMIT 1
      `,
      [identity.tenantId, identity.objectId]
    );
    let user = userResult.rows[0];

    if (!user && identity.email) {
      userResult = await pool.query(
        `
        SELECT id, name, email, role, status, auth_provider,
               microsoft_tenant_id, microsoft_object_id, created_at, updated_at
        FROM users
        WHERE LOWER(email) = $1
        LIMIT 1
        `,
        [identity.email]
      );
      user = userResult.rows[0];

      if (user && !user.microsoft_tenant_id && !user.microsoft_object_id) {
        const linked = await pool.query(
          `
          UPDATE users
          SET microsoft_tenant_id = $1,
              microsoft_object_id = $2,
              microsoft_linked_at = NOW(),
              auth_provider = 'microsoft',
              updated_at = NOW()
          WHERE id = $3
          RETURNING id, name, email, role, status, auth_provider,
                    microsoft_tenant_id, microsoft_object_id, created_at, updated_at
          `,
          [identity.tenantId, identity.objectId, user.id]
        );
        user = linked.rows[0];
        await writeAuditEvent(pool, {
          actorUserId: user.id,
          action: "auth.microsoft_account_linked",
          entityType: "user",
          entityId: user.id,
          metadata: { microsoft_tenant_id: identity.tenantId }
        });
      } else if (
        user &&
        (String(user.microsoft_tenant_id) !== identity.tenantId ||
          String(user.microsoft_object_id) !== identity.objectId)
      ) {
        return res.redirect(microsoftErrorRedirect(config, "account_link_conflict"));
      }
    }

    if (!user) return res.redirect(microsoftErrorRedirect(config, "account_not_invited"));
    if (user.status !== "active") {
      return res.redirect(microsoftErrorRedirect(config, "account_inactive"));
    }

    await pool.query(
      "UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
      [user.id]
    );
    await writeAuditEvent(pool, {
      actorUserId: user.id,
      action: "auth.microsoft_login",
      entityType: "user",
      entityId: user.id,
      metadata: { microsoft_tenant_id: identity.tenantId }
    });

    const safeUser = publicUser(user);
    const token = signToken(safeUser);
    return res.redirect(`${config.publicUrl}/#microsoft_token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("Microsoft SSO error:", error.message);
    res.clearCookie(stateCookieName(), clearOptions);
    return res.redirect(microsoftErrorRedirect(config, "sign_in_failed"));
  }
});

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
      SELECT id, name, email, password_hash, role, status, auth_provider, created_at, updated_at
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
      SELECT id, name, email, role, status, auth_provider, created_at, updated_at
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
