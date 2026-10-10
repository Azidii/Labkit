const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");

// Shop catalog
router.get("/", shopController.renderShop);

module.exports = router;
