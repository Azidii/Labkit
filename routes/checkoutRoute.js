const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");

// Checkout page
router.get("/", checkoutController.renderCheckout);

module.exports = router;
