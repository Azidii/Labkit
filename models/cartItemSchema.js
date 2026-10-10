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
      min: [1, "Quantity must be at least 1"],
      default: 1
    },

    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"]
    }
  },
  { _id: true }
);

/**
 * Instance Method: Calculate line item total price
 * @returns {number}
 */
cartItemSchema.methods.getTotalPrice = function () {
  return (this.unitPrice || 0) * (this.quantity || 1);
};

module.exports = mongoose.model("CartItem", cartItemSchema);
