const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController");

// Registration page
router.get("/", registerController.renderRegister);

// Google OAuth shortcut
router.get("/google", registerController.redirectToGoogle);

// Create new user account
router.post("/", registerController.register);

module.exports = router;
