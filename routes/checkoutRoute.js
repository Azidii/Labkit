const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const adminController = require("../controllers/adminController");

function requireAuthentication(req, res, next) {
  if (!req.session || !req.session.user) {
    const returnTo = encodeURIComponent("/checkout");
    return res.redirect(`/login?error=${encodeURIComponent("Please log in or create an account before checkout.")}&returnTo=${returnTo}`);
  }
  next();
}

// Localities endpoint using admin controller method
router.get("/localities", adminController.getLocalities);

// Checkout page
router.get("/", requireAuthentication, checkoutController.renderCheckout);

module.exports = router;
