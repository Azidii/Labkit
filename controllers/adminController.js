const Kit = require("../models/kitsSchema");

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login?error=" + encodeURIComponent("Please sign in as an administrator."));
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).send("Administrator access required.");
  }

  next();
}

function parseComponents(rawComponents) {
  if (!rawComponents || !rawComponents.trim()) return [];

  return rawComponents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, qty = "1", spec = ""] = line.split("|").map((value) => value.trim());
      return { name, qty: Number(qty), spec };
    });
}

exports.requireAdmin = requireAdmin;

exports.renderAdmin = async (req, res) => {
  try {
    const kits = await Kit.find().sort({ createdAt: -1 }).lean();
    res.render("admin", { kits, error: null, formData: {} });
  } catch (error) {
    console.error("Admin shop load error:", error);
    res.status(500).render("admin", {
      kits: [],
      error: "Unable to load shop bundles right now.",
      formData: {}
    });
  }
};

exports.createKit = async (req, res) => {
  const formData = { ...req.body };

  try {
    const {
      name,
      tagline,
      description,
      price,
      category,
      difficulty,
      image_url,
      stock_quantity,
      maxPurchaseQuantity,
      components
    } = req.body;

    const cleanName = (name || "").trim();
    const cleanTagline = (tagline || "").trim();
    const numericPrice = Number(price);
    const numericStock = Number(stock_quantity);
    const numericLimit = Number(maxPurchaseQuantity);

    if (!cleanName || !cleanTagline || !Number.isFinite(numericPrice) || numericPrice < 0 ||
        !Number.isInteger(numericStock) || numericStock < 0 ||
        !Number.isInteger(numericLimit) || numericLimit < 1) {
      const kits = await Kit.find().sort({ createdAt: -1 }).lean();
      return res.status(400).render("admin", {
        kits,
        error: "Enter a name, tagline, valid price, stock quantity, and purchase limit.",
        formData
      });
    }

    const cleanComponents = parseComponents(components);
    if (cleanComponents.some((component) =>
      !component.name || !Number.isInteger(component.qty) || component.qty < 1
    )) {
      const kits = await Kit.find().sort({ createdAt: -1 }).lean();
      return res.status(400).render("admin", {
        kits,
        error: "Each component must use Name | Quantity | Specification format.",
        formData
      });
    }

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    await Kit.create({
      name: cleanName,
      slug: `${slug}-${Date.now().toString(36)}`,
      tagline: cleanTagline,
      description: (description || "").trim(),
      price: numericPrice,
      category: (category || "IoT Kits").trim(),
      difficulty: difficulty || "Beginner",
      image_url: (image_url || "").trim() || undefined,
      stock_quantity: numericStock,
      in_stock: numericStock > 0,
      maxPurchaseQuantity: numericLimit,
      components: cleanComponents
    });

    res.redirect("/admin?created=1");
  } catch (error) {
    console.error("Admin shop bundle creation error:", error);
    const kits = await Kit.find().sort({ createdAt: -1 }).lean().catch((loadError) => {
      console.error("Admin shop reload error:", loadError);
      return [];
    });
    res.status(500).render("admin", {
      kits,
      error: "Unable to create this bundle. Check that its name is unique.",
      formData
    });
  }
};
