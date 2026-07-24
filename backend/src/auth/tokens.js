const jwt = require("jsonwebtoken");

function signToken(user) {
  const secret = process.env.JWT_SECRET || "change_this_in_production";

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tenant_id: user.tenant_id
    },
    secret,
    {
      expiresIn: "12h"
    }
  );
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "change_this_in_production";
  return jwt.verify(token, secret);
}

module.exports = {
  signToken,
  verifyToken
};
