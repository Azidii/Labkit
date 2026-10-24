const mongoose = require("mongoose");
const Cart = require("../models/cartSchema");
const Item = require("../models/itemSchema");
const Kit = require("../models/kitsSchema");

function getAuthUserId(req) {
  const rawId = req.session?.user?.id || req.session?.user?._id || req.user?.userId || req.user?.id;
  if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
    return String(rawId);
  }
  return null;
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
    let targetKit = kitId && mongoose.Types.ObjectId.isValid(kitId) ? String(kitId) : null;
    let targetItem = itemId && mongoose.Types.ObjectId.isValid(itemId) ? String(itemId) : null;

    if (!targetKit && !targetItem && id && mongoose.Types.ObjectId.isValid(id)) {
      const dbItem = await Item.findById(id).lean();
      if (dbItem) {
        targetItem = String(id);
      } else {
        const dbKit = await Kit.findById(id).lean();
        if (dbKit) {
          targetKit = String(id);
        } else {
          targetItem = String(id);
        }
      }
    }

    if (!targetKit && !targetItem) {
      return res.status(400).json({ success: false, error: "Missing or invalid item/kit ID." });
    }

    // Authoritative server-side price check and stock validation
    let verifiedPrice = Number(unitPrice !== undefined ? unitPrice : price);
    let availableStock = 9999;
    if (targetItem) {
      const dbItem = await Item.findById(targetItem).lean();
      if (dbItem) {
        if (Number.isFinite(dbItem.price) && dbItem.price >= 0) {
          verifiedPrice = dbItem.price;
        }
        availableStock = Number(dbItem.stockQuantity !== undefined ? dbItem.stockQuantity : (dbItem.stock || 0));
      }
    } else if (targetKit) {
      const dbKit = await Kit.findById(targetKit).lean() || await Item.findById(targetKit).lean();
      if (dbKit) {
        if (Number.isFinite(dbKit.price) && dbKit.price >= 0) {
          verifiedPrice = dbKit.price;
        }
        availableStock = Number(dbKit.stockQuantity !== undefined ? dbKit.stockQuantity : (dbKit.stock_quantity !== undefined ? dbKit.stock_quantity : 0));
      }
    }

    if (availableStock <= 0) {
      return res.status(400).json({ success: false, error: "This item is currently out of stock." });
    }

    const parsedQty = Number(quantity || qty || 1);
    const requestedQty = Math.max(1, Number.isInteger(parsedQty) ? parsedQty : 1);
    const itemQty = Math.min(availableStock, requestedQty);

    const cart = await Cart.getOrCreateForUser(userId);
    await cart.addItem({
      kit: targetKit,
      item: targetItem,
      quantity: itemQty,
      unitPrice: verifiedPrice
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
    const rawId = id || req.params?.id;
    if (!rawId) {
      return res.status(400).json({ success: false, error: "Item ID is required." });
    }
    const targetId = String(rawId);

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

    // Determine available stock in database for dynamic limit
    const targetProduct = (item.item ? await Item.findById(item.item).lean() : null) ||
                          (item.kit ? await Kit.findById(item.kit).lean() : null) ||
                          await Item.findById(item.item || item.kit).lean() ||
                          await Kit.findById(item.item || item.kit).lean();
    const availableStock = targetProduct
      ? Number(targetProduct.stockQuantity !== undefined ? targetProduct.stockQuantity : (targetProduct.stock || 0))
      : 9999;

    if (delta !== undefined) {
      const deltaNum = Number(delta);
      if (Number.isFinite(deltaNum)) {
        item.quantity = Math.min(availableStock, Math.max(0, item.quantity + deltaNum));
      }
    } else if (quantity !== undefined) {
      const qtyNum = Number(quantity);
      if (Number.isFinite(qtyNum)) {
        item.quantity = Math.min(availableStock, Math.max(0, Math.round(qtyNum)));
      }
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
    const rawId = id || req.params?.id;
    if (!rawId) {
      return res.status(400).json({ success: false, error: "Item ID is required." });
    }
    const targetId = String(rawId);

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
