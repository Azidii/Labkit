const Cart = require("../models/cartSchema");

function getAuthUserId(req) {
  return req.session?.user?.id || req.session?.user?._id || req.user?.userId || null;
}

// GET /cart - Retrieve user's active cart
exports.getCart = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        redirect: "/login",
        error: "Please sign in to view your cart."
      });
    }

    const cart = await Cart.getOrCreateForUser(userId);
    const totalCount = (cart.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    return res.status(200).json({
      success: true,
      cart,
      subtotal: cart.subtotal || 0,
      totalCount
    });
  } catch (error) {
    console.error("Error retrieving cart:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve cart." });
  }
};

// POST /cart/add - Add an item to the cart
exports.addToCart = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        redirect: "/login",
        error: "Please sign in to add items to your cart."
      });
    }

    const { id, kitId, itemId, price, unitPrice, quantity, qty } = req.body;
    const targetKit = kitId || id;
    const targetItem = itemId || null;
    const itemPrice = Number(unitPrice !== undefined ? unitPrice : price);
    const itemQty = Math.max(1, Number(quantity || qty || 1));

    if (!targetKit && !targetItem) {
      return res.status(400).json({ success: false, error: "Missing required item or kit ID." });
    }

    const cart = await Cart.getOrCreateForUser(userId);
    await cart.addItem({
      kit: targetKit,
      item: targetItem,
      quantity: itemQty,
      unitPrice: itemPrice
    });

    const totalCount = (cart.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    return res.status(200).json({
      success: true,
      message: "Item added to cart.",
      cart,
      subtotal: cart.subtotal,
      totalCount
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return res.status(500).json({ success: false, error: "Failed to add item to cart." });
  }
};

// PUT /cart/update - Update item quantity in cart
exports.updateCartQty = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        redirect: "/login",
        error: "Please sign in to update your cart."
      });
    }

    const { id, quantity, delta } = req.body;
    const targetId = String(id || req.params.id);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found." });
    }

    const item = cart.items.find(
      (i) => String(i._id) === targetId || String(i.kit) === targetId || String(i.item) === targetId
    );

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found in cart." });
    }

    if (delta !== undefined) {
      item.quantity = Math.max(0, item.quantity + Number(delta));
    } else if (quantity !== undefined) {
      item.quantity = Math.max(0, Number(quantity));
    }

    if (item.quantity <= 0) {
      cart.items = cart.items.filter((i) => String(i._id) !== String(item._id));
    }

    cart.calculateSubtotal();
    await cart.save();

    const totalCount = (cart.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    return res.status(200).json({
      success: true,
      cart,
      subtotal: cart.subtotal,
      totalCount
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return res.status(500).json({ success: false, error: "Failed to update quantity." });
  }
};

// DELETE /cart/remove - Remove item from cart
exports.removeCartItem = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        redirect: "/login",
        error: "Please sign in to modify your cart."
      });
    }

    const { id } = req.body;
    const targetId = String(id || req.params.id);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found." });
    }

    await cart.removeItem(targetId);
    const totalCount = (cart.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      cart,
      subtotal: cart.subtotal,
      totalCount
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ success: false, error: "Failed to remove item." });
  }
};

// POST /cart/clear - Clear all items from cart
exports.clearCart = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        requireLogin: true,
        redirect: "/login",
        error: "Please sign in."
      });
    }

    const cart = await Cart.findOne({ userId });
    if (cart) {
      await cart.clearCart();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared.",
      cart: cart || { items: [], subtotal: 0 },
      subtotal: 0,
      totalCount: 0
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({ success: false, error: "Failed to clear cart." });
  }
};
