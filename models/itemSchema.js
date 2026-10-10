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

module.exports = mongoose.model("Item", itemSchema);
