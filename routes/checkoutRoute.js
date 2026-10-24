const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const adminController = require("../controllers/adminController");

function requireAuthentication(req, res, next) {
  const user = req.session?.user || req.user;
  if (!user || (!user.id && !user._id && !user.userId)) {
    if (req.method !== "GET" || req.get("Accept")?.includes("application/json")) {
      return res.status(401).json({
        error: "Your session has expired. Please sign in again before checking out."
      });
    }
    const returnTo = encodeURIComponent("/checkout");
    return res.redirect(`/login?error=${encodeURIComponent("Please log in or create an account before checkout.")}&returnTo=${returnTo}`);
  }
  next();
}

// Localities endpoint using admin controller method
router.get("/localities", adminController.getLocalities);

// Shipping fee calculator endpoint
router.get("/shipping-fee", checkoutController.getShippingFee);

// Checkout page
router.get("/", requireAuthentication, checkoutController.renderCheckout);
router.post("/", requireAuthentication, checkoutController.createCheckout);

module.exports = router;
