const mongoose = require("mongoose");

/**
 * Enumeration: PaymentStatus
 * Values: 'pending', 'paid', 'failed', 'refunded'
 */
const PAYMENT_STATUS_ENUM = ["pending", "paid", "failed", "refunded"];

/**
 * Enumeration: OrderStatus
 * Values: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
 */
const ORDER_STATUS_ENUM = ["pending", "processing", "shipped", "delivered", "cancelled"];

const orderItemSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"]
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"]
    }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true
    },

    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      default: 0,
      min: [0, "Subtotal cannot be negative"]
    },

    shippingFee: {
      type: Number,
      required: [true, "Shipping fee is required"],
      default: 0,
      min: [0, "Shipping fee cannot be negative"]
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      default: 0,
      min: [0, "Total amount cannot be negative"]
    },

    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true
    },

    paymentStatus: {
      type: String,
      required: [true, "Payment status is required"],
      enum: {
        values: PAYMENT_STATUS_ENUM,
        message: "{VALUE} is not a valid paymentStatus. Allowed: pending, paid, failed, refunded"
      },
      default: "pending",
      lowercase: true
    },

    orderStatus: {
      type: String,
      required: [true, "Order status is required"],
      enum: {
        values: ORDER_STATUS_ENUM,
        message: "{VALUE} is not a valid orderStatus. Allowed: pending, processing, shipped, delivered, cancelled"
      },
      default: "pending",
      lowercase: true
    },

    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true
    },

    items: [orderItemSchema]
  },
  { timestamps: true }
);

/**
 * Instance Method: Calculate and update order total amount
 * @returns {number}
 */
orderSchema.methods.calculateTotal = function () {
  this.totalAmount = (this.subtotal || 0) + (this.shippingFee || 0);
  return this.totalAmount;
};

/**
 * Instance Method: Update order fulfillment status
 * @param {string} newStatus
 * @returns {Promise<Order>}
 */
orderSchema.methods.updateStatus = async function (newStatus) {
  if (!ORDER_STATUS_ENUM.includes(newStatus.toLowerCase())) {
    throw new Error(`Invalid order status: ${newStatus}`);
  }
  this.orderStatus = newStatus.toLowerCase();
  return this.save();
};

/**
 * Static Method: Find all orders purchased by a specific user
 * @param {string|ObjectId} userId
 * @returns {Promise<Order[]>}
 */
orderSchema.statics.findPurchasedByUser = function (userId) {
  return this.find({ userId }).populate("items.kit items.item").sort({ createdAt: -1 });
};

/**
 * Static Method: Record a new purchase order and deduct inventory
 * @param {Object} orderData
 * @returns {Promise<Order>}
 */
orderSchema.statics.recordOrder = async function ({
  userId,
  items = [],
  shippingAddress = "",
  paymentMethod = "credit_card",
  paymentStatus = "paid",
  orderStatus = "processing",
  shippingFee = 0
}) {
  const Kit = mongoose.models.Kit || mongoose.model("Kit");
  const Item = mongoose.models.Item || mongoose.model("Item");

  let calculatedSubtotal = 0;
  const processedItems = [];

  for (const itemData of items) {
    const qty = Math.max(1, Number(itemData.quantity) || 1);
    let unitPrice = Number(itemData.unitPrice) || 0;
    let name = itemData.name || "";

    if (itemData.kit) {
      let kit = await Kit.findById(itemData.kit);
      if (!kit) {
        kit = await Item.findById(itemData.kit);
        if (kit) {
          itemData.item = kit._id;
          itemData.kit = null;
        } else {
          throw new Error(`Kit not found: ${itemData.kit}`);
        }
      }
      if (typeof kit.reduceStock === "function") {
        await kit.reduceStock(qty);
      } else {
        const newStock = Math.max(0, (kit.stockQuantity || 0) - qty);
        await kit.constructor.findByIdAndUpdate(kit._id, {
          stockQuantity: newStock,
          in_stock: newStock > 0
        });
      }
      unitPrice = kit.price;
      name = name || kit.name;
    } else if (itemData.item) {
      let item = await Item.findById(itemData.item);
      if (!item) {
        item = await Kit.findById(itemData.item);
        if (item) {
          itemData.kit = item._id;
          itemData.item = null;
        } else {
          throw new Error(`Item not found: ${itemData.item}`);
        }
      }
      if (typeof item.reduceStock === "function") {
        await item.reduceStock(qty);
      } else {
        const newStock = Math.max(0, (item.stockQuantity || 0) - qty);
        await item.constructor.findByIdAndUpdate(item._id, {
          stockQuantity: newStock,
          in_stock: newStock > 0
        });
      }
      unitPrice = item.price;
      name = name || item.name;
    }

    calculatedSubtotal += unitPrice * qty;
    processedItems.push({
      kit: itemData.kit || null,
      item: itemData.item || null,
      name,
      unitPrice,
      quantity: qty
    });
  }

  const order = new this({
    userId,
    items: processedItems,
    subtotal: calculatedSubtotal,
    shippingFee: Number(shippingFee) || 0,
    totalAmount: calculatedSubtotal + (Number(shippingFee) || 0),
    shippingAddress,
    paymentMethod,
    paymentStatus,
    orderStatus
  });

  return order.save();
};

/**
 * Static Method: Direct helper to purchase a kit as an Order
 * @param {string|ObjectId} kitId
 * @param {string|ObjectId} userId
 * @param {number} quantity
 * @param {Object} details
 * @returns {Promise<Order>}
 */
orderSchema.statics.purchaseKit = async function (kitId, userId, quantity = 1, details = {}) {
  const Kit = mongoose.model("Kit");
  const kit = await Kit.findById(kitId);
  if (!kit) throw new Error("Kit not found");

  return this.recordOrder({
    userId,
    items: [{ kit: kitId, quantity, unitPrice: kit.price, name: kit.name }],
    shippingAddress: details.shippingAddress || "Digital Delivery / Standard",
    paymentMethod: details.paymentMethod || "online",
    paymentStatus: "paid",
    orderStatus: "completed"
  });
};

module.exports = mongoose.model("Order", orderSchema);
