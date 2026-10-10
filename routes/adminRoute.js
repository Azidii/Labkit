const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.use(adminController.requireAdmin);
router.get("/", adminController.renderAdmin);
router.post("/bundles", adminController.createKit);

module.exports = router;
