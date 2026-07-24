const crypto = require("crypto");
const jwt = require("jsonwebtoken");

let microsoftJwks;

function microsoftConfig() {
  const clientId = String(process.env.MICROSOFT_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.MICROSOFT_CLIENT_SECRET || "").trim();
  const homeTenantId = String(process.env.MICROSOFT_HOME_TENANT_ID || "").trim().toLowerCase();
  const redirectUri = String(
    process.env.MICROSOFT_REDIRECT_URI ||
    "https://dcam.ctec-shop.co.uk/auth/microsoft/callback"
  ).trim();
  const publicUrl = String(process.env.DCAM_PUBLIC_URL || "https://dcam.ctec-shop.co.uk")
    .trim()
    .replace(/\/+$/, "");

  return {
    enabled: Boolean(clientId && clientSecret && homeTenantId && redirectUri && publicUrl),
    clientId,
    clientSecret,
    homeTenantId,
    redirectUri,
    publicUrl
  };
}

function randomValue(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function codeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function stateCookieName() {
  return "dcam_microsoft_state";
}

function createStateCookie() {
  const state = randomValue();
  const nonce = randomValue();
  const verifier = randomValue(48);
  const secret = process.env.JWT_SECRET || "change_this_in_production";
  const token = jwt.sign({ state, nonce, verifier, purpose: "microsoft-sso" }, secret, {
    expiresIn: "10m"
  });

  return { state, nonce, verifier, token };
}

function verifyStateCookie(token, expectedState) {
  const secret = process.env.JWT_SECRET || "change_this_in_production";
  const value = jwt.verify(token, secret);
  const actual = Buffer.from(String(value.state || ""));
  const expected = Buffer.from(String(expectedState || ""));
  if (
    value.purpose !== "microsoft-sso" ||
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  ) {
    throw new Error("Invalid Microsoft sign-in state");
  }
  return value;
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    const key = cookie.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(cookie.slice(separator + 1));
  }
  return null;
}

function cookieOptions(config) {
  return {
    httpOnly: true,
    secure: config.redirectUri.startsWith("https://"),
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/auth/microsoft"
  };
}

function microsoftAuthorizeUrl(config, state) {
  const url = new URL("https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state.state);
  url.searchParams.set("nonce", state.nonce);
  url.searchParams.set("code_challenge", codeChallenge(state.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

async function exchangeCode(config, code, verifier) {
  const response = await fetch(
    "https://login.microsoftonline.com/organizations/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        code_verifier: verifier,
        scope: "openid profile email"
      })
    }
  );
  const data = await response.json();
  if (!response.ok || !data.id_token) {
    throw new Error(`Microsoft token exchange failed: ${data.error || response.status}`);
  }
  return data;
}

function uuid(value) {
  const text = String(value || "").toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)
    ? text
    : null;
}

async function verifyMicrosoftIdToken(config, idToken, expectedNonce) {
  const { createRemoteJWKSet, decodeJwt, jwtVerify } = await import("jose");
  const unverified = decodeJwt(idToken);
  const tenantId = uuid(unverified.tid);
  if (!tenantId) throw new Error("Microsoft token did not contain a valid tenant");

  if (!microsoftJwks) {
    microsoftJwks = createRemoteJWKSet(
      new URL("https://login.microsoftonline.com/common/discovery/v2.0/keys")
    );
  }

  const { payload } = await jwtVerify(idToken, microsoftJwks, {
    audience: config.clientId,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`
  });

  if (payload.nonce !== expectedNonce) throw new Error("Microsoft token nonce did not match");
  const objectId = uuid(payload.oid);
  if (!objectId) throw new Error("Microsoft token did not contain a valid user ID");

  return {
    tenantId,
    objectId,
    email: String(payload.email || payload.preferred_username || "").trim().toLowerCase(),
    name: String(payload.name || payload.preferred_username || "Microsoft user").trim()
  };
}

module.exports = {
  microsoftConfig,
  stateCookieName,
  createStateCookie,
  verifyStateCookie,
  readCookie,
  cookieOptions,
  microsoftAuthorizeUrl,
  exchangeCode,
  verifyMicrosoftIdToken
};
