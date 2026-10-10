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

module.exports = mongoose.model("Order", orderSchema);
