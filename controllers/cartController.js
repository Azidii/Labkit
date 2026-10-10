const Cart = require("../models/cartSchema");

// GET /cart - Retrieve user's active cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.session && req.session.user ? req.session.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Please sign in to view your cart." });
    }

    let cart = await Cart.findOne({ user: userId, status: "active" });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [], status: "active" });
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalCount = cart.items.reduce((sum, item) => sum + item.qty, 0);

    return res.status(200).json({
      success: true,
      cart,
      subtotal,
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
    const userId = req.session && req.session.user ? req.session.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Please sign in to add items." });
    }

    const { id, productId, name, price, qty, img } = req.body;
    const targetId = String(productId || id);

    if (!targetId || !name || price === undefined) {
      return res.status(400).json({ success: false, error: "Missing required item fields." });
    }

    let cart = await Cart.findOne({ user: userId, status: "active" });
    if (!cart) {
      cart = new Cart({ user: userId, items: [], status: "active" });
    }

    const quantityToAdd = Math.max(1, Number(qty || 1));
    const existingIndex = cart.items.findIndex((item) => String(item.productId) === targetId);

    if (existingIndex > -1) {
      cart.items[existingIndex].qty += quantityToAdd;
    } else {
      cart.items.push({
        productId: targetId,
        name: String(name).trim(),
        price: Number(price),
        qty: quantityToAdd,
        img: img || ""
      });
    }

    await cart.save();

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalCount = cart.items.reduce((sum, item) => sum + item.qty, 0);

    return res.status(200).json({
      success: true,
      message: "Item added to cart.",
      cart,
      subtotal,
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
    const userId = req.session && req.session.user ? req.session.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Please sign in to update your cart." });
    }

    const { id, productId, qty, delta } = req.body;
    const targetId = String(productId || id);

    const cart = await Cart.findOne({ user: userId, status: "active" });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found." });
    }

    const itemIndex = cart.items.findIndex(
      (item) => String(item.productId) === targetId || String(item._id) === targetId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: "Item not found in cart." });
    }

    if (delta !== undefined) {
      cart.items[itemIndex].qty += Number(delta);
    } else if (qty !== undefined) {
      cart.items[itemIndex].qty = Number(qty);
    }

    if (cart.items[itemIndex].qty <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalCount = cart.items.reduce((sum, item) => sum + item.qty, 0);

    return res.status(200).json({
      success: true,
      cart,
      subtotal,
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
    const userId = req.session && req.session.user ? req.session.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Please sign in to modify your cart." });
    }

    const { id, productId } = req.body;
    const targetId = String(productId || id || req.params.id);

    const cart = await Cart.findOne({ user: userId, status: "active" });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found." });
    }

    cart.items = cart.items.filter(
      (item) => String(item.productId) !== targetId && String(item._id) !== targetId
    );

    await cart.save();

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalCount = cart.items.reduce((sum, item) => sum + item.qty, 0);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      cart,
      subtotal,
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
    const userId = req.session && req.session.user ? req.session.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Please sign in." });
    }

    const cart = await Cart.findOne({ user: userId, status: "active" });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared.",
      cart: cart || { items: [] },
      subtotal: 0,
      totalCount: 0
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({ success: false, error: "Failed to clear cart." });
  }
};
