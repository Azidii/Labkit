const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Dashboard & Home
router.get("/", dashboardController.renderDashboard);

// Settings
router.get("/settings", dashboardController.renderSettings);
router.post("/settings/username", dashboardController.updateUsername);
router.post("/settings/change-password", dashboardController.changePassword);

// Admin shortcut & Logout
router.get("/admin", dashboardController.redirectAdmin);
router.get("/logout", dashboardController.logout);

module.exports = router;
