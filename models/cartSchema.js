const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, "Product ID is required"],
      trim: true
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },

    qty: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1
    },

    img: {
      type: String,
      default: ""
    }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true
    },

    items: [cartItemSchema],

    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
