const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
      unique: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true
    },

    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true
    },

    pdfUrl: {
      type: String,
      default: null,
      trim: true
    },

    emailSent: {
      type: Boolean,
      required: [true, "Email sent is required"],
      default: false
    },

    issuedAt: {
      type: Date,
      required: [true, "Issued date is required"],
      default: Date.now
    }
  },
  { timestamps: true }
);

/**
 * Static Method: Generate an invoice for a completed order
 * @param {Object} order
 * @returns {Promise<Invoice>}
 */
invoiceSchema.statics.generateForOrder = async function (order) {
  if (!order || !order._id || !order.userId) {
    throw new Error("Valid order instance is required to generate an invoice.");
  }

  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${String(order._id).slice(-4).toUpperCase()}`;

  return this.create({
    orderId: order._id,
    userId: order.userId,
    invoiceNumber,
    issuedAt: new Date()
  });
};

/**
 * Static Method: Find invoice associated with an order ID
 * @param {string|ObjectId} orderId
 * @returns {Promise<Invoice|null>}
 */
invoiceSchema.statics.findByOrder = function (orderId) {
  return this.findOne({ orderId }).populate("userId orderId");
};

module.exports = mongoose.model("Invoice", invoiceSchema);
