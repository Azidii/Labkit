const mongoose = require("mongoose");
const Item = require("../models/itemSchema");
const Kit = require("../models/kitsSchema");
const Order = require("../models/orderSchema");
const Invoice = require("../models/invoiceSchema");
const User = require("../models/userSchema");
const Cart = require("../models/cartSchema");
const { sendInvoiceEmail } = require("../utils/sendEmail");

const SHIPPING_FEE = 380.25;

exports.renderCheckout = async (req, res) => {
  try {
    const userId = req.session?.user?.id || req.session?.user?._id;
    let isDbCartEmpty = true;
    if (userId) {
      const cart = await Cart.findOne({ userId }).lean();
      if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
        isDbCartEmpty = false;
      }
    }
    res.render("checkout", { isDbCartEmpty });
  } catch (error) {
    console.error("Error in renderCheckout:", error);
    res.render("checkout", { isDbCartEmpty: false });
  }
};

exports.createCheckout = async (req, res) => {
  const userId = req.session.user.id;
  const { items, billing, paymentMethod } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  const allowedPaymentMethods = ["gcash", "card", "cod"];
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: "Select a valid payment method." });
  }

  if (!billing || !billing.address || !billing.province || !billing.city || !billing.barangay) {
    return res.status(400).json({ error: "Complete your billing information before checking out." });
  }

  const billingEmail = String(billing.email || "").trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  if (!billingEmail || !emailRegex.test(billingEmail)) {
    return res.status(400).json({ error: "Please provide a valid email address (e.g. name@example.com)." });
  }

  const orderItems = [];
  try {
    for (const cartItem of items) {
      if (!mongoose.Types.ObjectId.isValid(cartItem.id)) {
        return res.status(400).json({ error: "One or more cart items are invalid." });
      }

      const quantity = Number(cartItem.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return res.status(400).json({ error: "Cart quantities must be between 1 and 10." });
      }

      const product = await Item.findById(cartItem.id) || await Kit.findById(cartItem.id);
      if (!product) {
        return res.status(400).json({ error: "One or more cart items are no longer available." });
      }

      const productData = product.constructor.modelName === "Kit"
        ? { kit: product._id, item: null }
        : { item: product._id, kit: null };
      orderItems.push({
        ...productData,
        name: product.name,
        unitPrice: product.price,
        quantity
      });
    }

    const shippingAddress = [
      billing.address,
      billing.barangay,
      billing.city,
      billing.province,
      billing.zipCode
    ].filter(Boolean).join(", ");
    const paymentStatus = paymentMethod === "cod" ? "pending" : "paid";
    const order = await Order.recordOrder({
      userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus: "processing",
      shippingFee: SHIPPING_FEE
    });
    const invoice = await Invoice.generateForOrder(order);
    const user = await User.findById(userId).lean();
    const recipientEmail = String(billing.email || user?.email || "").trim().toLowerCase();
    if (!emailRegex.test(recipientEmail)) {
      throw new Error("A valid email address is required to send the invoice.");
    }

    await sendInvoiceEmail({
      to: recipientEmail,
      name: [user?.firstName || billing.firstName, user?.lastName || billing.lastName].filter(Boolean).join(" ") || user?.username,
      order,
      invoice
    });
    invoice.emailSent = true;
    await invoice.save();
    const cart = await Cart.findOne({ userId });
    if (cart) {
      for (const item of order.items) {
        await cart.removeItem(item.item || item.kit);
      }
    }

    return res.status(201).json({
      success: true,
      orderId: order._id,
      invoiceNumber: invoice.invoiceNumber,
      total: order.totalAmount,
      emailSent: invoice.emailSent,
      email: recipientEmail
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return res.status(500).json({
      error: "We could not complete your order. Please verify your cart and try again."
    });
  }
};
