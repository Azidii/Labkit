const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null
    },

    kit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kit",
      default: null
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"]
    },

    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"]
    }
  },
  { _id: true }
);

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

    items: [cartItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
