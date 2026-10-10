const User = require("../models/userSchema");

async function getFeaturedProducts() {
  return [
    {
      id: "1",
      slug: "raspberry-pi-4-model-b-4gb",
      name: "Raspberry Pi 4 Model B (4 GB)",
      tagline: "Quad-core SBC for full Linux projects",
      price: 55.0,
      compare_at_price: null,
      category: "Single-Board Computers",
      difficulty: "Single unit",
      image_url: "https://images.unsplash.com/photo-1629292923887-a803417bd405?w=600",
      rating: 4.9,
      review_count: 487
    },
    {
      id: "2",
      slug: "esp32-devkit-v1-wroom32",
      name: "ESP32 DevKit V1 (WROOM-32)",
      tagline: "Dual-core WiFi + Bluetooth dev board",
      price: 12.5,
      compare_at_price: null,
      category: "Microcontrollers",
      difficulty: "Intermediate",
      image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
      rating: 4.8,
      review_count: 214
    },
    {
      id: "3",
      slug: "hc-sr04-ultrasonic-sensor",
      name: "HC-SR04 Ultrasonic Sensor",
      tagline: "2–400 cm distance sensing, 4-pin module",
      price: 3.25,
      compare_at_price: null,
      category: "Sensors & Modules",
      difficulty: "Beginner",
      image_url: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600",
      rating: 4.7,
      review_count: 312
    },
    {
      id: "4",
      slug: "orange-pi-5-8gb",
      name: "Orange Pi 5 (8 GB)",
      tagline: "RK3588S powerhouse for AI & media projects",
      price: 89.0,
      compare_at_price: null,
      category: "Single-Board Computers",
      difficulty: "Single unit",
      image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
      rating: 4.7,
      review_count: 156
    },
    {
      id: "5",
      slug: "piezo-buzzer-12v",
      name: "Piezo Buzzer 12V",
      tagline: "Loud 12V active buzzer, one-wire control",
      price: 1.75,
      compare_at_price: null,
      category: "Buzzers & Audio",
      difficulty: "Beginner",
      image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
      rating: 4.6,
      review_count: 180
    }
  ];
}

// GET / - Dashboard home
exports.renderDashboard = async (req, res) => {
  const featured = await getFeaturedProducts();
  const currentUser = (req.session && req.session.user) || null;
  res.render("dashboard", { featured, loading: false, currentUser });
};

// GET /settings - User Settings page
exports.renderSettings = async (req, res) => {
  let currentUser = (req.session && req.session.user) || null;
  if (currentUser && currentUser.id) {
    try {
      const dbUser = await User.findById(currentUser.id);
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
        req.session.user = currentUser;
      }
    } catch (err) {
      console.error("Error refreshing user in settings:", err);
    }
  }
  res.render("settings", { currentUser });
};

// POST /settings/username - Add or update username
exports.updateUsername = async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: "Please sign in to update your username." });
  }

  try {
    const rawUsername = req.body.username;
    const cleanUsername = (rawUsername || "").trim();

    if (!cleanUsername) {
      return res.status(400).json({ success: false, error: "Username cannot be empty." });
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        error: "Username must be 3-30 characters long (letters, numbers, and underscores only)."
      });
    }

    // Check if username is taken by another account
    const existing = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      _id: { $ne: req.session.user.id }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: "This username is already taken. Please choose another." });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "Account not found." });
    }

    user.username = cleanUsername;
    await user.save();

    req.session.user.username = cleanUsername;

    return res.json({
      success: true,
      message: "Username updated successfully!",
      username: cleanUsername
    });
  } catch (err) {
    console.error("Settings username update error:", err);
    return res.status(500).json({ success: false, error: "Failed to update username. Please try again." });
  }
};

// POST /settings/change-password - Change account password
exports.changePassword = async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: "Please sign in to change your password." });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.session.user.id);

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
  if (req.session) {
    req.session.destroy((err) => {
      if (err) console.error("Error destroying session:", err);
      res.redirect("/login");
    });
  } else {
    res.redirect("/login");
  }
};
