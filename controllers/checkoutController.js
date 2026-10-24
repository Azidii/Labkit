const mongoose = require("mongoose");
const Item = require("../models/itemSchema");
const Kit = require("../models/kitsSchema");
const Order = require("../models/orderSchema");
const Invoice = require("../models/invoiceSchema");
const User = require("../models/userSchema");
const Cart = require("../models/cartSchema");
const { sendInvoiceEmail } = require("../utils/sendEmail");
const { calculateShippingFee } = require("../utils/shippingCalculator");

exports.renderCheckout = async (req, res) => {
  try {
    const rawUserId = req.session?.user?.id || req.session?.user?._id || req.user?.userId || req.user?.id;
    let isDbCartEmpty = true;
    if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      const cart = await Cart.findOne({ userId: String(rawUserId) }).lean();
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

/**
 * GET /checkout/shipping-fee?country=...&province=...&city=...&quantity=...
 * Returns the dynamic shipping fee for the given location & quantity.
 */
exports.getShippingFee = (req, res) => {
  const { country, province, city, quantity } = req.query;
  const ctry = String(country || "Philippines").trim();
  const prov = String(province || "").trim();
  const cty = String(city || "").trim();
  const isDomestic = !ctry || ctry.toLowerCase() === "philippines" || ctry.toLowerCase() === "ph";

  if (isDomestic && !prov) {
    return res.status(400).json({ error: "Province is required for domestic shipping." });
  }

  const totalQuantity = Math.max(1, Number(quantity) || 1);
  const result = calculateShippingFee(prov, cty, totalQuantity, ctry);
  return res.json(result);
};

exports.createCheckout = async (req, res) => {
  const rawUserId = req.session?.user?.id || req.session?.user?._id || req.user?.userId || req.user?.id;
  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    return res.status(401).json({ error: "Please log in to complete your checkout." });
  }
  const userId = String(rawUserId);

  const { items, billing, paymentMethod } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  const allowedPaymentMethods = ["gcash", "card", "cod"];
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: "Select a valid payment method." });
  }

  const country = String(billing?.country || "Philippines").trim();
  const isInternational = country.toLowerCase() !== "philippines" && country.toLowerCase() !== "ph";

  if (!billing || !billing.address || (!isInternational && (!billing.province || !billing.city))) {
    return res.status(400).json({ error: "Complete your billing information before checking out." });
  }

  const orderItems = [];
  try {
    let totalQuantity = 0;
    for (const cartItem of items) {
      if (!mongoose.Types.ObjectId.isValid(cartItem.id)) {
        return res.status(400).json({ error: "One or more cart items are invalid." });
      }

      const quantity = Number(cartItem.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return res.status(400).json({ error: "Cart quantities must be between 1 and 10." });
      }

      totalQuantity += quantity;

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

    // Calculate shipping fee dynamically based on billing location
    const { fee: shippingFee } = calculateShippingFee(
      billing.province || "",
      billing.city || "",
      totalQuantity,
      country
    );

    const shippingAddress = [
      billing.address,
      billing.barangay,
      billing.city,
      billing.province,
      billing.zipCode,
      isInternational ? country : null
    ].filter(Boolean).join(", ");
    const paymentStatus = paymentMethod === "cod" ? "pending" : "paid";
    const order = await Order.recordOrder({
      userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus: "processing",
      shippingFee
    });
    const invoice = await Invoice.generateForOrder(order);
    const user = await User.findById(userId).lean();
    const recipientEmail = String(billing.email || user?.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
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
