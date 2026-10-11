const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be configured in production.");
}

module.exports = jwtSecret || "labkit-jwt-secret-key-2026";
