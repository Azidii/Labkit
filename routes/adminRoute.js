const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.use(adminController.requireAdmin);
router.get("/", adminController.renderAdmin);
router.post("/bundles", adminController.createKit);
router.post("/accounts/:userId/delete", adminController.removeUser);
const { requireAdmin } = require("../utils/authMiddleware");

/**
 * GET /admin/dashboard
 * Protected by requireAdmin middleware.
 * Verifies JWT and checks (decoded.role === "admin").
 */
router.get("/dashboard", requireAdmin, (req, res) => {
  res.render("admin-dashboard", {
    title: "Admin Dashboard — LabKit Market",
    user: req.user,
    userRole: res.locals.userRole || req.user?.role || "admin",
    currentUser: req.session?.user || req.user
  });
});

// Also support /admin/dashboard if router is mounted at root
router.get("/admin/dashboard", requireAdmin, (req, res) => {
  res.render("admin-dashboard", {
    title: "Admin Dashboard — LabKit Market",
    user: req.user,
    userRole: res.locals.userRole || req.user?.role || "admin",
    currentUser: req.session?.user || req.user
  });
});

// Shortcut /admin -> /admin/dashboard
router.get("/", requireAdmin, (req, res) => {
  res.redirect("/admin/dashboard");
});

module.exports = router;
