const path = require("path");
const fs = require("fs");
const Item = require("../models/itemSchema");
const Kit = require("../models/kitsSchema");
const User = require("../models/userSchema");
const { requireAdmin } = require("../utils/authMiddleware");

// In-memory cache for server-side Philippine localities
let philippineLocalitiesCache = null;

function getPhilippineLocalitiesData() {
  if (!philippineLocalitiesCache) {
    try {
      const dataPath = path.join(__dirname, "../data/philippine-localities.json");
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, "utf8");
        philippineLocalitiesCache = JSON.parse(raw);
      } else {
        philippineLocalitiesCache = [];
      }
    } catch (err) {
      console.error("Failed to load philippine-localities.json:", err.message);
      philippineLocalitiesCache = [];
    }
  }
  return philippineLocalitiesCache;
}

function parseComponents(rawComponents) {
  if (!rawComponents || !rawComponents.trim()) return [];

  return rawComponents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/^[•\-\*\u2022]\s*/, "");
      const parts = cleaned.split("|").map((value) => value.trim());
      const name = parts[0] || "";
      const rawQty = parts[1];
      const spec = parts[2] || "";
      const parsedQty = Number(rawQty);
      const qty = Number.isInteger(parsedQty) && parsedQty >= 1 ? parsedQty : 1;
      return { name, qty, spec };
    });
}

exports.requireAdmin = requireAdmin;

async function getAdminUser(req) {
  let currentUser = req.session?.user || req.user || {};
  try {
    const query = (currentUser.id || currentUser._id)
      ? { _id: currentUser.id || currentUser._id }
      : (currentUser.email ? { email: currentUser.email } : null);
    if (query) {
      const dbUser = await User.findOne(query).lean();
      if (dbUser) {
        currentUser = {
          ...currentUser,
          id: dbUser._id,
          _id: dbUser._id,
          firstName: dbUser.firstName || "",
          lastName: dbUser.lastName || "",
          username: dbUser.username || "",
          email: dbUser.email || "",
          role: dbUser.role || "admin",
          avatar: dbUser.avatar || "",
          hasPassword: !!dbUser.passwordHash
        };
        if (req.session?.user) req.session.user = currentUser;
      }
    }
  } catch (err) {
    console.warn("Could not load fresh user in admin:", err.message);
  }
  return currentUser;
}

exports.renderAdmin = async (req, res) => {
  const currentUser = await getAdminUser(req);
  try {
    const items = await Item.find().sort({ createdAt: -1 }).lean();
    const kits = await Kit.find().sort({ createdAt: -1 }).lean();
    const users = await User.find({}, "firstName lastName username email role createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const success = req.query.updated === "1"
      ? "Item updated successfully!"
      : req.query.created === "1"
      ? "Item added to catalog successfully!"
      : null;
    res.render("admin", { items, kits, users, error: null, success, formData: {}, currentUser });
  } catch (error) {
    console.error("Admin catalog load error:", error);
    res.status(500).render("admin", {
      items: [],
      kits: [],
      users: [],
      error: "Unable to load shop catalog right now.",
      success: null,
      formData: {},
      currentUser
    });
  }
};

exports.removeUser = async (req, res) => {
  const userId = String(req.params.userId || "");
  if (userId === String(req.session.user.id)) {
    return res.status(400).send("You cannot remove your own account.");
  }

  try {
    await User.findByIdAndDelete(userId);
    res.redirect("/admin?tab=accounts");
  } catch (error) {
    console.error("Admin account removal error:", error);
    res.status(500).send("Unable to remove this account.");
  }
};

exports.createItem = async (req, res) => {
  const formData = { ...req.body };
  const currentUser = req.session?.user || res.locals.currentUser || req.user || {};

  try {
    if (req.uploadError) {
      const items = await Item.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const users = await User.find({}, "firstName lastName username email role createdAt").lean().catch(() => []);
      return res.status(400).render("admin", {
        items,
        kits,
        users,
        error: req.uploadError,
        formData,
        currentUser
      });
    }

    const {
      name,
      tagline,
      description,
      price,
      compare_at_price,
      category,
      difficulty,
      image_url,
      imageUrl,
      stock_quantity,
      stockQuantity,
      maxPurchaseQuantity,
      components,
      features
    } = req.body;

    const cleanName = (name || "").trim();
    const cleanDescription = (description || "").trim();
    const cleanTagline = (tagline || "").trim();
    const cleanCategory = (category || "Sensors & Modules").trim();
    const cleanDifficulty = (difficulty || "Beginner").trim();

    let cleanImageUrl = (imageUrl || image_url || "").trim();
    if (req.file && req.file.buffer) {
      const mime = req.file.mimetype || "image/png";
      const base64 = req.file.buffer.toString("base64");
      cleanImageUrl = `data:${mime};base64,${base64}`;
    }

    const numericPrice = Number(price);
    const rawStock = stockQuantity !== undefined && stockQuantity !== "" ? stockQuantity : stock_quantity;
    const numericStock = Number(rawStock);
    const numericLimit = Number(maxPurchaseQuantity || 10);

    if (
      !cleanName ||
      !cleanDescription ||
      !cleanImageUrl ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      const items = await Item.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const users = await User.find({}, "firstName lastName username email role createdAt").lean().catch(() => []);
      return res.status(400).render("admin", {
        items,
        kits,
        users,
        error: !cleanImageUrl
          ? "Please provide an item image (upload a file or enter an image URL)."
          : "Enter item name, description, valid price (≥ 0), and stock quantity (≥ 0).",
        formData,
        currentUser
      });
    }


    const cleanComponents = parseComponents(components);
    const cleanFeatures = (features || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[•\-\*\u2022]\s*/, "").trim())
      .filter(Boolean);

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    await Item.create({
      name: cleanName,
      slug: `${slug}-${Date.now().toString(36)}`,
      tagline: cleanTagline,
      description: cleanDescription,
      price: numericPrice,
      compare_at_price: compare_at_price ? Number(compare_at_price) : null,
      category: cleanCategory,
      difficulty: cleanDifficulty,
      imageUrl: cleanImageUrl,
      stockQuantity: numericStock,
      maxPurchaseQuantity: Number.isInteger(numericLimit) && numericLimit >= 1 ? numericLimit : 10,
      components: cleanComponents,
      features: cleanFeatures
    });

    res.redirect("/admin?tab=products&created=1");
  } catch (error) {
    console.error("Admin item creation error:", error);
    const items = await Item.find().sort({ createdAt: -1 }).lean().catch(() => []);
    const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch(() => []);
    const users = await User.find({}, "firstName lastName username email role createdAt").lean().catch(() => []);
    res.status(500).render("admin", {
      items,
      kits,
      users,
      error: error.message || "Unable to save this item. Check that all fields are correct.",
      formData,
      currentUser
    });
  }
};

exports.removeItem = async (req, res) => {
  const itemId = String(req.params.itemId || "");
  try {
    await Item.findByIdAndDelete(itemId);
    res.redirect("/admin?tab=products");
  } catch (error) {
    console.error("Admin item removal error:", error);
    res.status(500).send("Unable to remove this item.");
  }
};

exports.removeBundle = async (req, res) => {
  const bundleId = String(req.params.bundleId || req.params.kitId || "");
  try {
    await Kit.findByIdAndDelete(bundleId);
    res.redirect("/admin?tab=products");
  } catch (error) {
    console.error("Admin bundle removal error:", error);
    res.status(500).send("Unable to remove this bundle.");
  }
};

// Aliases for backwards compatibility
exports.createKit = exports.createItem;

exports.updateItem = async (req, res) => {
  const itemId = String(req.params.itemId || req.params.bundleId || "");
  const formData = { ...req.body };
  const currentUser = req.session?.user || res.locals.currentUser || req.user || {};

  try {
    let targetDoc = await Item.findById(itemId);
    let isKit = false;
    if (!targetDoc) {
      targetDoc = await Kit.findById(itemId);
      isKit = true;
    }

    if (!targetDoc) {
      const items = await Item.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const users = await User.find({}, "firstName lastName username email role createdAt").lean().catch(() => []);
      return res.status(404).render("admin", {
        items,
        kits,
        users,
        error: "Item not found in catalog.",
        success: null,
        formData,
        currentUser
      });
    }

    if (req.uploadError) {
      const items = await Item.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const users = await User.find({}, "firstName lastName username email role createdAt").lean().catch(() => []);
      return res.status(400).render("admin", {
        items,
        kits,
        users,
        error: req.uploadError,
        success: null,
        formData,
        currentUser
      });
    }

    const {
      name,
      tagline,
      description,
      price,
      compare_at_price,
      category,
      difficulty,
      image_url,
      imageUrl,
      existingImageUrl,
      stock_quantity,
      stockQuantity,
      maxPurchaseQuantity,
      components,
      features
    } = req.body;

    const cleanName = (name || "").trim();
    const cleanDescription = (description || "").trim();
    const cleanTagline = (tagline || "").trim();
    const cleanCategory = (category || "Sensors & Modules").trim();
    const cleanDifficulty = (difficulty || "Beginner").trim();

    // Check for uploaded file, then form URL inputs, then existing image URL, then database document
    let cleanImageUrl = (imageUrl || image_url || existingImageUrl || "").trim();
    if (req.file && req.file.buffer) {
      const mime = req.file.mimetype || "image/png";
      const base64 = req.file.buffer.toString("base64");
      cleanImageUrl = `data:${mime};base64,${base64}`;
    }
    if (!cleanImageUrl && targetDoc.imageUrl) {
      cleanImageUrl = targetDoc.imageUrl;
    }

    const numericPrice = Number(price);
    const rawStock = stockQuantity !== undefined && stockQuantity !== "" ? stockQuantity : stock_quantity;
    const numericStock = Number(rawStock);
    const numericLimit = Number(maxPurchaseQuantity || 10);

    if (
      !cleanName ||
      !cleanDescription ||
      !cleanImageUrl ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      const items = await Item.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch(() => []);
      const users = await User.find({}, "firstName lastName username email role createdAt").lean().catch(() => []);
      return res.status(400).render("admin", {
        items,
        kits,
        users,
        error: !cleanImageUrl
          ? "Please provide an item image (upload a file or enter an image URL)."
          : "Enter item name, description, valid price (≥ 0), and stock quantity (≥ 0).",
        success: null,
        formData,
        currentUser
      });
    }

    const cleanComponents = parseComponents(components);
    const cleanFeatures = (features || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[•\-\*\u2022]\s*/, "").trim())
      .filter(Boolean);

    targetDoc.name = cleanName;
    targetDoc.tagline = cleanTagline;
    targetDoc.description = cleanDescription;
    targetDoc.price = numericPrice;
    targetDoc.compare_at_price = compare_at_price ? Number(compare_at_price) : null;
    targetDoc.category = cleanCategory;
    targetDoc.difficulty = cleanDifficulty;
    targetDoc.imageUrl = cleanImageUrl;
    targetDoc.stockQuantity = numericStock;
    targetDoc.maxPurchaseQuantity = Number.isInteger(numericLimit) && numericLimit >= 1 ? numericLimit : 10;
    targetDoc.components = cleanComponents;
    if (!isKit) {
      targetDoc.features = cleanFeatures;
    }

    await targetDoc.save();

    res.redirect("/admin?tab=products&updated=1");
  } catch (error) {
    console.error("Admin item update error:", error);
    const items = await Item.find().sort({ createdAt: -1 }).lean().catch(() => []);
    const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch(() => []);
    const users = await User.find({}, "firstName lastName username email role createdAt").lean().catch(() => []);
    res.status(500).render("admin", {
      items,
      kits,
      users,
      error: error.message || "Unable to update this item. Check that all fields are correct.",
      success: null,
      formData,
      currentUser
    });
  }
};

exports.updateKit = exports.updateItem;

/**
 * Server-side method to retrieve Philippine localities
 * Supports filtering by province (?province=Cebu) to keep client payloads lightweight
 */
exports.getLocalities = (req, res) => {
  const localities = getPhilippineLocalitiesData();
  const rawProvince = (req.query.province || "").trim();

  if (!rawProvince) {
    return res.json(localities);
  }

  const provinceAliases = {
    "samar (formerly western samar)": "samar",
    "cotabato (formerly north cotabato)": "cotabato",
    "davao de oro (formerly compostela valley)": "davao de oro"
  };

  const normalizedQuery = rawProvince.toLowerCase();
  const canonical = provinceAliases[normalizedQuery] || normalizedQuery;

  const filtered = localities
    .filter((item) => {
      const p = (item.province || "").trim().toLowerCase();
      return p === normalizedQuery || p === canonical;
    })
    .map((item) => ({
      province: item.province.trim(),
      locality: item.locality.trim(),
      name: item.locality.trim()
    }))
    .filter((item, index, items) => items.findIndex((cand) => cand.name.toLowerCase() === item.name.toLowerCase()) === index)
    .sort((a, b) => a.name.localeCompare(b.name));

  return res.json(filtered);
};

exports.getPhilippineLocalities = exports.getLocalities;
exports.getPhilippineLocalitiesData = getPhilippineLocalitiesData;



