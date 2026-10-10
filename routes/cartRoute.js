const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/update", cartController.updateCartQty);
router.post("/update", cartController.updateCartQty);
router.delete("/remove", cartController.removeCartItem);
router.post("/remove", cartController.removeCartItem);
router.post("/clear", cartController.clearCart);

module.exports = router;
