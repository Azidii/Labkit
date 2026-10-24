const mongoose = require("mongoose");
const User = require("../models/userSchema");
const Item = require("../models/itemSchema");
const Kit = require("../models/kitsSchema");

async function getFeaturedProducts() {
  try {
    const databaseItems = await Item.find({
      $or: [
        { stockQuantity: { $gt: 0 } },
        { stock_quantity: { $gt: 0 } },
        { in_stock: true }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const featuredItems = databaseItems.map((item) => ({
      ...item,
      id: String(item._id),
      slug: item.slug || String(item._id),
      name: item.name,
      tagline: item.tagline || (item.description ? item.description.slice(0, 80) : ""),
      description: item.description,
      price: Number(item.price) || 0,
      compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : null,
      category: item.category || "Sensors & Modules",
      difficulty: item.difficulty || "Beginner",
      image_url: item.imageUrl || item.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
      rating: item.rating || 5.0,
      review_count: item.review_count || 0,
      in_stock: item.stockQuantity !== undefined ? item.stockQuantity > 0 : true,
      maxPurchaseQuantity: item.maxPurchaseQuantity || 10
    }));

    if (featuredItems.length < 6) {
      const databaseKits = await Kit.find({ in_stock: true, stock_quantity: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .limit(6 - featuredItems.length)
        .lean();

      const featuredKits = databaseKits.map((kit) => ({
        ...kit,
        id: String(kit._id),
        slug: kit.slug || String(kit._id),
        name: kit.name,
        tagline: kit.tagline || (kit.description ? kit.description.slice(0, 80) : ""),
        image_url: kit.image_url || kit.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
        rating: kit.rating || 5.0,
        review_count: kit.review_count || 0,
        maxPurchaseQuantity: kit.maxPurchaseQuantity || 10
      }));

      return featuredItems.concat(featuredKits);
    }

    return featuredItems;
  } catch (err) {
    console.error("Dashboard getFeaturedProducts error:", err);
    return [];
  }
}

// GET / - Dashboard home
exports.renderDashboard = async (req, res) => {
  const featured = await getFeaturedProducts();
  const currentUser = (req.session && req.session.user) || (res.locals && res.locals.currentUser) || null;
  res.render("dashboard", { featured, loading: false, currentUser });
};

// GET /settings - User Settings page
exports.renderSettings = async (req, res) => {
  let currentUser = (req.session && req.session.user) || (res.locals && res.locals.currentUser) || req.user || null;
  const rawId = currentUser?.id || currentUser?._id || currentUser?.userId;
  if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
    try {
      const dbUser = await User.findById(String(rawId)).lean();
      if (dbUser) {
        currentUser = {
          id: dbUser._id,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          username: dbUser.username || "",
          email: dbUser.email,
          role: dbUser.role,
          avatar: dbUser.avatar || "",
          hasPassword: !!dbUser.passwordHash
        };
        if (req.session) {
          req.session.user = currentUser;
        }
      }
    } catch (err) {
      console.error("Error refreshing user in settings:", err);
    }
  }
  res.render("settings", { currentUser });
};

// POST /settings/username - Add or update username
exports.updateUsername = async (req, res) => {
  const rawUserId = req.session?.user?.id || req.session?.user?._id || req.user?.userId || req.user?.id;
  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    return res.status(401).json({ success: false, error: "Please sign in to update your username." });
  }
  const currentUserId = String(rawUserId);

  try {
    const rawUsername = String(req.body?.username || "").trim();

    if (!rawUsername) {
      return res.status(400).json({ success: false, error: "Username cannot be empty." });
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(rawUsername)) {
      return res.status(400).json({
        success: false,
        error: "Username must be 3-30 characters long (letters, numbers, and underscores only)."
      });
    }

    // Check if username is taken by another account
    const escapedUsername = rawUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await User.findOne({
      username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
      _id: { $ne: currentUserId }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: "This username is already taken. Please choose another." });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Account not found." });
    }

    user.username = rawUsername;
    await user.save();

    if (req.session?.user) {
      req.session.user.username = rawUsername;
    }

    return res.json({
      success: true,
      message: "Username updated successfully!",
      username: rawUsername
    });
  } catch (err) {
    console.error("Settings username update error:", err);
    return res.status(500).json({ success: false, error: "Failed to update username. Please try again." });
  }
};

// POST /settings/change-password - Change account password
exports.changePassword = async (req, res) => {
  const rawUserId = req.session?.user?.id || req.session?.user?._id || req.user?.userId || req.user?.id;
  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    return res.status(401).json({ success: false, error: "Please sign in to change your password." });
  }
  const currentUserId = String(rawUserId);

  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ success: false, error: "Account not found." });
    }

    // If account has an existing password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: "Please enter your current password." });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: "Current password is incorrect." });
      }
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters long." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: "New passwords do not match." });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully!"
    });
  } catch (err) {
    console.error("Settings change password error:", err);
    return res.status(500).json({ success: false, error: "Failed to update password. Please try again." });
  }
};

// GET /admin - Shortcut redirect
exports.redirectAdmin = (req, res) => {
  res.redirect("/settings");
};

// GET /logout - Sign out user and destroy session
exports.logout = (req, res) => {
  const clearOpts = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
  res.clearCookie("token", clearOpts);
  if (req.session) {
    req.session.destroy((err) => {
      if (err) console.error("Error destroying session:", err);
      res.clearCookie("connect.sid", clearOpts);
      res.redirect("/login");
    });
  } else {
    res.clearCookie("connect.sid", clearOpts);
    res.redirect("/login");
  }
};
