const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../utils/authMiddleware");
const { handleItemImageUpload } = require("../utils/uploadMiddleware");

// Server-side Philippine localities endpoint (admin methods)
router.get("/localities", adminController.getLocalities);

// All admin routes are protected by JWT token and session verification
router.use((req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  res.vary("Cookie");
  next();
});
router.use(requireAdmin);
router.get("/products/:productType/:productId", adminController.getProductDetails);

// Admin Console (uses views/admin.ejs)
router.get("/", adminController.renderAdmin);
router.get("/dashboard", adminController.renderAdmin);
router.get("/admin-dashboard", (req, res) => res.redirect("/admin"));
router.post("/items", handleItemImageUpload, adminController.createItem);
router.post("/items/:itemId/edit", handleItemImageUpload, adminController.updateItem);
router.post("/items/:itemId/delete", adminController.removeItem);
router.post("/bundles", handleItemImageUpload, adminController.createItem);
router.post("/bundles/:bundleId/edit", handleItemImageUpload, adminController.updateItem);
router.post("/bundles/:bundleId/delete", adminController.removeBundle);
router.post("/accounts/:userId/delete", adminController.removeUser);

module.exports = router;


