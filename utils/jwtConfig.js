const crypto = require("crypto");

let jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (!jwtSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  // In development, generate an ephemeral cryptographically secure random secret per boot
  console.warn("[SECURITY WARN] JWT_SECRET is not set in environment. Using an ephemeral random secret for this session.");
  jwtSecret = crypto.randomBytes(32).toString("hex");
}

module.exports = jwtSecret;
