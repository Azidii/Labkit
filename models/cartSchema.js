const mongoose = require("mongoose");
const CartItem = require("./cartItemSchema");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    sessionId: {
      type: String,
      default: null,
      index: true
    },

    subtotal: {
      type: Number,
      default: 0,
      min: [0, "Subtotal cannot be negative"]
    },

    items: [CartItem.schema]
  },
  { timestamps: true }
);

/**
 * Instance Method: Calculate and update cart subtotal
 * @returns {number}
 */
cartSchema.methods.calculateSubtotal = function () {
  this.subtotal = (this.items || []).reduce((sum, item) => {
    return sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
  }, 0);
  return this.subtotal;
};

/**
 * Instance Method: Add or increment item/kit in cart
 * @param {Object} itemData
 * @returns {Promise<Cart>}
 */
cartSchema.methods.addItem = async function ({ kit, item, quantity = 1, unitPrice }) {
  const qty = Math.max(1, Number(quantity) || 1);
  const targetKit = kit ? String(kit) : null;
  const targetItem = item ? String(item) : null;

  const existing = this.items.find((i) => {
    if (targetKit && i.kit) return String(i.kit) === targetKit;
    if (targetItem && i.item) return String(i.item) === targetItem;
    return false;
  });

  if (existing) {
    existing.quantity += qty;
  } else {
    this.items.push({
      kit: targetKit || null,
      item: targetItem || null,
      quantity: qty,
      unitPrice: Number(unitPrice) || 0
    });
  }

  this.calculateSubtotal();
  return this.save();
};

/**
 * Instance Method: Remove item by subdocument ID, kit ID, or item ID
 * @param {string} id
 * @returns {Promise<Cart>}
 */
cartSchema.methods.removeItem = async function (id) {
  const targetId = String(id);
  this.items = this.items.filter((i) => {
    return (
      String(i._id) !== targetId &&
      String(i.kit) !== targetId &&
      String(i.item) !== targetId
    );
  });
  this.calculateSubtotal();
  return this.save();
};

/**
 * Instance Method: Clear all items in cart
 * @returns {Promise<Cart>}
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  this.subtotal = 0;
  return this.save();
};

/**
 * Static Method: Find active cart for user or create new one
 * @param {string|ObjectId} userId
 * @returns {Promise<Cart>}
 */
cartSchema.statics.getOrCreateForUser = async function (userId) {
  let cart = await this.findOne({ userId });
  if (!cart) {
    cart = await this.create({ userId, items: [], subtotal: 0 });
  }
  return cart;
};

module.exports = mongoose.model("Cart", cartSchema);
