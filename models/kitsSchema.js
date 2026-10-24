const mongoose = require("mongoose");

/**
 * Enumeration: Difficulty
 * Standard UML values: 'beginner', 'intermediate', 'advanced'
 */
const DIFFICULTY_ENUM = [
  "beginner",
  "intermediate",
  "advanced",
  "Beginner",
  "Intermediate",
  "Advanced",
  "All levels"
];

/**
 * Component / Part included inside an IoT Kit
 */
const kitComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Component name is required"],
      trim: true
    },
    qty: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Quantity must be at least 1"]
    },
    spec: {
      type: String,
      default: "",
      trim: true
    }
  },
  { _id: false }
);

/**
 * Digital Assets delivered with the kit
 */
const digitalAssetsSchema = new mongoose.Schema(
  {
    circuit_diagram: {
      type: String,
      default: "circuit-diagram.pdf"
    },
    packet_tracer: {
      type: String,
      default: "topology.pkt"
    },
    firmware_code: {
      type: String,
      default: "firmware.zip"
    }
  },
  { _id: false }
);

/**
 * IoT Kit Model Schema (UML Structure)
 */
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
      default: "beginner"
    },

    schematicUrl: {
      type: String,
      default: "",
      trim: true
    },

    firmwareUrl: {
      type: String,
      default: "",
      trim: true
    },

    stockQuantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      default: 0
    },

    imageUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
      trim: true
    },

    // Optional metadata fields for catalog and admin features
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

    category: {
      type: String,
      default: "IoT Kits",
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

    components: [kitComponentSchema],

    digital_assets: {
      type: digitalAssetsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases for compatibility with snake_case fields used in views/controllers
kitsSchema.virtual("stock_quantity")
  .get(function () {
    return this.stockQuantity;
  })
  .set(function (value) {
    this.stockQuantity = Number(value) || 0;
  });

kitsSchema.virtual("image_url")
  .get(function () {
    return this.imageUrl;
  })
  .set(function (value) {
    this.imageUrl = value;
  });

// Pre-save hook: ensure in_stock reflects stockQuantity
kitsSchema.pre("save", function (next) {
  this.in_stock = (this.stockQuantity || 0) > 0;
  next();
});

/**
 * Instance Method: Check if kit has sufficient inventory stock
 * @param {number} quantity
 * @returns {boolean}
 */
kitsSchema.methods.hasStock = function (quantity = 1) {
  const qty = Number(quantity) || 1;
  return (this.stockQuantity || 0) >= qty;
};

/**
 * Instance Method: Alias for hasStock
 * @param {number} quantity
 * @returns {boolean}
 */
kitsSchema.methods.canPurchase = function (quantity = 1) {
  return this.hasStock(quantity);
};

/**
 * Instance Method: Decrement kit stock by purchased quantity
 * @param {number} quantity
 * @returns {Promise<Kit>}
 */
kitsSchema.methods.reduceStock = async function (quantity = 1) {
  const qty = Math.max(1, Number(quantity) || 1);
  if (!this.hasStock(qty)) {
    throw new Error(`Insufficient stock for kit: ${this.name}. In stock: ${this.stockQuantity}`);
  }
  this.stockQuantity = Math.max(0, (this.stockQuantity || 0) - qty);
  this.in_stock = this.stockQuantity > 0;
  await this.save();
  await this.constructor.findByIdAndUpdate(this._id, {
    stockQuantity: this.stockQuantity,
    in_stock: this.in_stock
  });
  return this;
};

/**
 * Static Method: Retrieve available kits in stock
 * @returns {Promise<Kit[]>}
 */
kitsSchema.statics.getAvailableKits = function () {
  return this.find({ stockQuantity: { $gt: 0 } });
};

module.exports = mongoose.model("Kit", kitsSchema);
