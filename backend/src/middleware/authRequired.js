const { verifyToken } = require("../auth/tokens");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required"
    });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: "Invalid or expired token"
    });
  }
}

module.exports = {
  authRequired
};
