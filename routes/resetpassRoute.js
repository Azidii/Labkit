const express = require("express");
const router = express.Router();
const resetpassController = require("../controllers/resetpassController");

// Reset password page
router.get("/", resetpassController.renderResetPass);

// OTP actions
router.post("/send-otp", resetpassController.sendOtp);
router.post("/verify-otp", resetpassController.verifyOtp);

// Final password change
router.post("/reset", resetpassController.resetPassword);

module.exports = router;
