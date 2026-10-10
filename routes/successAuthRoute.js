const express = require("express");
const router = express.Router();
const successController = require("../controllers/successController");

// Authentication transition screen
router.get("/", successController.renderSuccess);

module.exports = router;
