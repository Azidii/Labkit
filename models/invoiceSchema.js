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

module.exports = mongoose.model("Invoice", invoiceSchema);
