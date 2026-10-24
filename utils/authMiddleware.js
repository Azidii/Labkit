const jwt = require("jsonwebtoken");
const JWT_SECRET = require("./jwtConfig");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

/**
 * Middleware: requireAuth
 * Verifies the user via session or JWT token from cookies.
 * If missing or invalid, clears the cookie and redirects to /login.
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.user || req.session.user;
    res.locals.currentUser = req.session.user;
    res.locals.userRole = req.session.user.role || null;
    return next();
  }

  const token = req.cookies?.token;
  if (!token) {
    res.clearCookie("token", cookieOptions);
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    req.user = decoded;
    res.locals.userRole = decoded.role;
    if (!res.locals.currentUser) {
      res.locals.currentUser = {
        id: decoded.userId,
        _id: decoded.userId,
        role: decoded.role
      };
    }
    next();
  } catch (err) {
    res.clearCookie("token", cookieOptions);
    return res.redirect("/login");
  }
};

/**
 * Middleware: requireAdmin
 * Verifies the user has admin role via session or JWT.
 * If missing or invalid, clears the cookie and redirects to /login.
 * If valid but role is not "admin", returns a 403 Forbidden status with a restricted access message.
 */
const requireAdmin = (req, res, next) => {
  const sessionRole = req.session?.user?.role;
  if (sessionRole === "admin") {
    req.user = req.user || req.session.user;
    res.locals.currentUser = req.session.user;
    res.locals.userRole = "admin";
    return next();
  }

  const token = req.cookies?.token;
  if (!token) {
    if (req.session && req.session.user) {
      // User is logged in with session but not an admin
      if (req.headers?.accept?.includes("application/json")) {
        return res.status(403).json({ error: "Forbidden: Restricted access. Admin privileges required." });
      }
      return res.status(403).send("Forbidden: Restricted access. Admin privileges required.");
    }
    res.clearCookie("token", cookieOptions);
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
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
    res.clearCookie("token", cookieOptions);
    return res.redirect("/login");
  }
};

module.exports = {
  requireAuth,
  requireAdmin
};
