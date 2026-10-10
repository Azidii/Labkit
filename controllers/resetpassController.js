const User = require("../models/userSchema");
const { sendOtpEmail } = require("../utils/sendEmail");

// GET /resetpass - Render reset password page
exports.renderResetPass = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("resetpass", {
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// POST /resetpass/send-otp - Request OTP code to email
exports.sendOtp = async (req, res) => {
  const isJson = req.is("json") || req.headers.accept?.includes("application/json");

  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      const msg = "Please enter your email address.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("resetpass", { error: msg, success: null });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const msg = "No account found with this email address.";
      return isJson
        ? res.status(404).json({ success: false, error: msg })
        : res.status(404).render("resetpass", { error: msg, success: null });
    }

    // Generate random 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.resetPasswordCode = otpCode;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Send styled branded email
    try {
      await sendOtpEmail({
        to: user.email,
        name: user.firstName,
        code: otpCode
      });
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
      const msg = "Unable to send verification email. Please try again shortly.";
      return isJson
        ? res.status(500).json({ success: false, error: msg })
        : res.status(500).render("resetpass", { error: msg, success: null });
    }

    const successMsg = `Verification code sent to ${cleanEmail}.`;
    if (isJson) {
      return res.json({
        success: true,
        message: successMsg,
        email: cleanEmail
      });
    }

    res.render("resetpass", {
      error: null,
      success: successMsg
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    const msg = "An unexpected error occurred while processing your request.";
    if (isJson) {
      return res.status(500).json({ success: false, error: msg });
    }
    res.status(500).render("resetpass", { error: msg, success: null });
  }
};

// POST /resetpass/verify-otp - Check if OTP code is valid before entering new password
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: "Email and verification code are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, error: "Account not found." });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== cleanCode) {
      return res.status(400).json({ success: false, error: "Invalid verification code. Please check your email." });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, error: "Verification code has expired. Please request a new one." });
    }

    return res.json({ success: true, message: "Code verified successfully." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ success: false, error: "An error occurred during verification." });
  }
};

// POST /resetpass/reset - Verify OTP and update password
exports.resetPassword = async (req, res) => {
  const isJson = req.is("json") || req.headers.accept?.includes("application/json");

  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      const msg = "All fields are required.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("resetpass", { error: msg, success: null });
    }

    if (newPassword.length < 6) {
      const msg = "New password must be at least 6 characters long.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("resetpass", { error: msg, success: null });
    }

    if (newPassword !== confirmPassword) {
      const msg = "Passwords do not match.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("resetpass", { error: msg, success: null });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const msg = "Account not found.";
      return isJson
        ? res.status(404).json({ success: false, error: msg })
        : res.status(404).render("resetpass", { error: msg, success: null });
    }

    // Verify OTP validity
    if (!user.resetPasswordCode || user.resetPasswordCode !== cleanCode) {
      const msg = "Invalid verification code. Please check your email and try again.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("resetpass", { error: msg, success: null });
    }

    // Verify expiry
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      const msg = "Verification code has expired. Please request a new one.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("resetpass", { error: msg, success: null });
    }

    // Hash and save new password
    user.passwordHash = await User.hashPassword(newPassword);
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    const redirectUrl = "/login?success=" + encodeURIComponent("Password reset successfully! Please log in with your new password.");

    if (isJson) {
      return res.json({
        success: true,
        message: "Password changed successfully!",
        redirect: redirectUrl
      });
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Password reset error:", error);
    const msg = "Failed to reset password. Please try again.";
    if (isJson) {
      return res.status(500).json({ success: false, error: msg });
    }
    res.status(500).render("resetpass", { error: msg, success: null });
  }
};
