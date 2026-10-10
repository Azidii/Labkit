const mongoose = require("mongoose");

/**
 * Enumeration: Difficulty
 * Values: 'beginner', 'intermediate', 'advanced'
 */
const DIFFICULTY_ENUM = ["beginner", "intermediate", "advanced"];

const kitsSchema = new mongoose.Schema(
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

    difficulty: {
      type: String,
      required: [true, "Difficulty is required"],
      enum: {
        values: DIFFICULTY_ENUM,
        message: "{VALUE} is not a valid difficulty. Allowed: beginner, intermediate, advanced"
      },
      lowercase: true,
      default: "beginner"
    },

    schematicUrl: {
      type: String,
      required: [true, "Schematic URL is required"],
      trim: true
    },

    firmwareUrl: {
      type: String,
      required: [true, "Firmware URL is required"],
      trim: true
    },

    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"]
    },

    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kit", kitsSchema);
