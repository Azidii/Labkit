const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

// Login page & credentials authentication
router.get("/", loginController.renderLogin);
router.post("/", loginController.login);

// Google OAuth authentication
router.get("/google", loginController.startGoogleAuth);
router.get("/google/callback", loginController.handleGoogleCallback);

// Logout
router.get("/logout", loginController.logout);

module.exports = router;
