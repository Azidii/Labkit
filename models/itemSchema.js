const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },

    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"]
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },

    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true
    }
  },
  { timestamps: true }
);

/**
 * Instance Method: Check if item has enough stock
 * @param {number} quantity
 * @returns {boolean}
 */
itemSchema.methods.hasStock = function (quantity = 1) {
  return (this.stockQuantity || 0) >= (Number(quantity) || 1);
};

/**
 * Instance Method: Deduct stock quantity
 * @param {number} quantity
 * @returns {Promise<Item>}
 */
itemSchema.methods.reduceStock = async function (quantity = 1) {
  const qty = Math.max(1, Number(quantity) || 1);
  if (!this.hasStock(qty)) {
    throw new Error(`Insufficient stock for item: ${this.name}. Available: ${this.stockQuantity}`);
  }
  this.stockQuantity -= qty;
  return this.save();
};

module.exports = mongoose.model("Item", itemSchema);
