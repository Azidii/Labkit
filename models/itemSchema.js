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
    },

    // Extended catalog attributes for storefront and admin integration
    slug: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true
    },

    tagline: {
      type: String,
      default: "",
      trim: true
    },

    difficulty: {
      type: String,
      default: "Beginner",
      trim: true
    },

    compare_at_price: {
      type: Number,
      default: null
    },

    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },

    review_count: {
      type: Number,
      default: 0,
      min: 0
    },

    in_stock: {
      type: Boolean,
      default: true
    },

    maxPurchaseQuantity: {
      type: Number,
      default: 10,
      min: [1, "Maximum purchase quantity must be at least 1"]
    },

    components: {
      type: [
        {
          name: { type: String, trim: true },
          qty: { type: Number, default: 1 },
          spec: { type: String, default: "", trim: true }
        }
      ],
      default: []
    },

    features: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases for compatibility with snake_case fields used in views/controllers
itemSchema.virtual("stock_quantity")
  .get(function () {
    return this.stockQuantity;
  })
  .set(function (value) {
    this.stockQuantity = Number(value) || 0;
  });

itemSchema.virtual("image_url")
  .get(function () {
    return this.imageUrl;
  })
  .set(function (value) {
    this.imageUrl = value;
  });

// Pre-save hook: ensure in_stock reflects stockQuantity
itemSchema.pre("save", function (next) {
  this.in_stock = (this.stockQuantity || 0) > 0;
  if (typeof next === "function") next();
});

/**
 * Instance Method: Check if item has enough stock
 * @param {number} quantity
 * @returns {boolean}
 */
itemSchema.methods.hasStock = function (quantity = 1) {
  return (this.stockQuantity || 0) >= (Number(quantity) || 1);
};

/**
 * Instance Method: Check if item can be purchased
 * @param {number} quantity
 * @returns {boolean}
 */
itemSchema.methods.canPurchase = function (quantity = 1) {
  return this.hasStock(quantity);
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
  this.in_stock = this.stockQuantity > 0;
  return this.save();
};

/**
 * Static Method: Retrieve available items in stock
 * @returns {Promise<Item[]>}
 */
itemSchema.statics.getAvailableItems = function () {
  return this.find({ stockQuantity: { $gt: 0 } });
};

module.exports = mongoose.model("Item", itemSchema);

