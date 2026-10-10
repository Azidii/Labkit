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

module.exports = mongoose.model("Cart", cartSchema);
