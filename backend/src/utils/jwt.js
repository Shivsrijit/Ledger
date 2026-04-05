const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { normalizeAuthUser } = require("./authUser");

function signToken(payload) {
  const user = normalizeAuthUser(payload);
  return jwt.sign(user, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { signToken, verifyToken };
