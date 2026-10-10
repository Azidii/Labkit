const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../utils/authMiddleware");

// All admin routes are protected by JWT token and session verification
router.use(requireAdmin);

// Admin Console (uses views/admin.ejs)
router.get("/", adminController.renderAdmin);
router.get("/dashboard", adminController.renderAdmin);
router.get("/admin-dashboard", (req, res) => res.redirect("/admin"));
router.post("/bundles", adminController.createKit);
router.post("/accounts/:userId/delete", adminController.removeUser);

module.exports = router;
