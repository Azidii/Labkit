const mongoose = require("mongoose");

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
 * Purchase log subdocument for tracking kit purchases
 */
const kitPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Purchasing user is required"]
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Purchase quantity must be at least 1"]
    },
    pricePaid: {
      type: Number,
      required: [true, "Price paid is required"],
      min: [0, "Price paid cannot be negative"]
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    orderId: {
      type: String,
      trim: true,
      default: function () {
        return "LK-KIT-" + Date.now().toString().slice(-6);
      }
    },
    status: {
      type: String,
      enum: ["completed", "pending", "processing", "refunded", "cancelled"],
      default: "completed"
    },
    customerEmail: {
      type: String,
      trim: true,
      default: ""
    },
    shippingAddress: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: true }
);

/**
 * Main IoT Kits Schema
 */
const kitsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Kit name is required"],
      trim: true
    },

    slug: {
      type: String,
      required: [true, "Kit slug is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    tagline: {
      type: String,
      required: [true, "Kit tagline is required"],
      trim: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    price: {
      type: Number,
      required: [true, "Kit price is required"],
      min: [0, "Price cannot be negative"]
    },

    compare_at_price: {
      type: Number,
      default: null
    },

    category: {
      type: String,
      default: "IoT Kits",
      trim: true
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All levels"],
      default: "Beginner"
    },

    image_url: {
      type: String,
      default: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600"
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

    stock_quantity: {
      type: Number,
      default: 25,
      min: [0, "Stock cannot be negative"]
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
    },

    purchases: [kitPurchaseSchema]
  },
  { timestamps: true }
);

/**
 * Instance Method: Check if a user can purchase this kit
 * @param {number} quantity - Number of units to purchase
 * @returns {boolean}
 */
kitsSchema.methods.canPurchase = function (quantity = 1) {
  const qty = Number(quantity) || 1;
  return this.in_stock && this.stock_quantity >= qty;
};

/**
 * Instance Method: Record a user purchase for this IoT kit
 * Decrements stock, marks out-of-stock if 0, and records purchase log
 * @param {Object} purchaseData
 * @param {ObjectId} purchaseData.user
 * @param {number} purchaseData.quantity
 * @param {number} purchaseData.pricePaid
 * @param {string} purchaseData.orderId
 * @param {string} purchaseData.customerEmail
 * @param {string} purchaseData.shippingAddress
 * @returns {Promise<Object>}
 */
kitsSchema.methods.recordPurchase = async function ({
  user,
  quantity = 1,
  pricePaid = this.price,
  orderId,
  customerEmail = "",
  shippingAddress = ""
}) {
  const qty = Math.max(1, Number(quantity) || 1);

  if (!this.canPurchase(qty)) {
    throw new Error(`Insufficient stock for kit: ${this.name}. Available: ${this.stock_quantity}`);
  }

  // Deduct inventory
  this.stock_quantity -= qty;
  if (this.stock_quantity <= 0) {
    this.in_stock = false;
  }

  const newPurchase = {
    user,
    quantity: qty,
    pricePaid: Number(pricePaid),
    orderId: orderId || "LK-KIT-" + Date.now().toString().slice(-6),
    customerEmail,
    shippingAddress,
    purchasedAt: new Date(),
    status: "completed"
  };

  this.purchases.push(newPurchase);
  await this.save();

  return {
    success: true,
    purchase: newPurchase,
    remainingStock: this.stock_quantity,
    kit: this
  };
};

/**
 * Static Method: Purchase a kit by its ID
 * @param {string|ObjectId} kitId
 * @param {string|ObjectId} userId
 * @param {number} quantity
 * @param {Object} orderDetails
 */
kitsSchema.statics.purchaseKit = async function (kitId, userId, quantity = 1, orderDetails = {}) {
  const kit = await this.findById(kitId);
  if (!kit) {
    throw new Error("IoT Kit not found");
  }

  return kit.recordPurchase({
    user: userId,
    quantity,
    pricePaid: orderDetails.pricePaid !== undefined ? orderDetails.pricePaid : kit.price * quantity,
    orderId: orderDetails.orderId,
    customerEmail: orderDetails.customerEmail,
    shippingAddress: orderDetails.shippingAddress
  });
};

/**
 * Static Method: Get all kits purchased by a specific user
 * @param {string|ObjectId} userId
 */
kitsSchema.statics.findPurchasedByUser = function (userId) {
  return this.find({ "purchases.user": userId });
};

/**
 * Static Method: Get available kits in stock
 */
kitsSchema.statics.getAvailableKits = function () {
  return this.find({ in_stock: true, stock_quantity: { $gt: 0 } });
};

module.exports = mongoose.model("Kit", kitsSchema);
