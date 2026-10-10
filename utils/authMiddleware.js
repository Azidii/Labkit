const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware: requireAuth
 * Verifies the JWT token from cookies.
 * If missing or invalid, clears the cookie and redirects to /login.
 */
const requireAuth = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    res.clearCookie("token");
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    res.locals.userRole = decoded.role;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

/**
 * Middleware: requireAdmin
 * Verifies the JWT and specifically checks if (decoded.role === "admin").
 * If missing or invalid, clears the cookie and redirects to /login.
 * If valid but role is not "admin", returns a 403 Forbidden status with a restricted access message.
 */
const requireAdmin = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    res.clearCookie("token");
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    res.locals.userRole = decoded.role;

    if (decoded.role === "admin") {
      return next();
    }

    if (req.headers?.accept?.includes("application/json")) {
      return res.status(403).json({ error: "Forbidden: Restricted access. Admin privileges required." });
    }
    return res.status(403).send("Forbidden: Restricted access. Admin privileges required.");
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

module.exports = {
  requireAuth,
  requireAdmin
};
