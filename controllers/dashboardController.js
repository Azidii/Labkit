const User = require("../models/userSchema");

async function getFeaturedProducts() {
  const featured = [
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
      id: "7",
      slug: "ky-038-microphone-sound-sensor",
      name: "KY-038 Microphone Sound Sensor Module",
      tagline: "High-sensitivity voice & acoustic detection for IoT triggers",
      price: 2.4,
      compare_at_price: null,
      category: "Sensors & Modules",
      difficulty: "Beginner",
      image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
      rating: 4.8,
      review_count: 142
    },
    {
      id: "8",
      slug: "jumper-wires-40pin-mf",
      name: "40-Pin Breadboard Jumper Wires (M/F)",
      tagline: "20cm multi-color ribbon cables for breadboard prototyping",
      price: 1.95,
      compare_at_price: null,
      category: "Sensors & Modules",
      difficulty: "Beginner",
      image_url: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600",
      rating: 4.9,
      review_count: 360
    },
    {
      id: "9",
      slug: "resistor-pack-100pcs",
      name: "Metal Film Resistor Assortment (100 pcs)",
      tagline: "10Ω to 1MΩ 1/4W precision resistors (220Ω, 1kΩ, 10kΩ included)",
      price: 2.2,
      compare_at_price: null,
      category: "Displays & Power",
      difficulty: "Beginner",
      image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
      rating: 4.9,
      review_count: 420
    },
    {
      id: "10",
      slug: "active-piezo-buzzer-5v",
      name: "5V Active Buzzer Module",
      tagline: "Continuous audible alert & tone notification module",
      price: 1.2,
      compare_at_price: null,
      category: "Buzzers & Audio",
      difficulty: "Beginner",
      image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
      rating: 4.7,
      review_count: 195
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
    }
  ];
  const prices = {
    "esp32-devkit-v1-wroom32": 350,
    "ky-038-microphone-sound-sensor": 65,
    "jumper-wires-40pin-mf": 45,
    "resistor-pack-100pcs": 85,
    "active-piezo-buzzer-5v": 20,
    "hc-sr04-ultrasonic-sensor": 85
  };
  return featured.map((product) => ({ ...product, price: prices[product.slug] || product.price }));
}

// GET / - Dashboard home
exports.renderDashboard = async (req, res) => {
  const featured = await getFeaturedProducts();
  const currentUser = (req.session && req.session.user) || res.locals.currentUser || null;
  res.render("dashboard", { featured, loading: false, currentUser });
};

// GET /settings - User Settings page
exports.renderSettings = async (req, res) => {
  let currentUser = (req.session && req.session.user) || res.locals.currentUser || null;
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
  res.clearCookie("token", { httpOnly: true, path: "/" });
  if (req.session) {
    req.session.destroy((err) => {
      if (err) console.error("Error destroying session:", err);
      res.clearCookie("connect.sid", { path: "/" });
      res.redirect("/login");
    });
  } else {
    res.clearCookie("connect.sid", { path: "/" });
    res.redirect("/login");
  }
};
