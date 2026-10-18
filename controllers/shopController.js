const Kit = require("../models/kitsSchema");
const Item = require("../models/itemSchema");

// GET /shop - Display shop catalog with filters
exports.renderShop = async (req, res) => {
  const { category, difficulty, sort, q } = req.query;

  let filtered = [];

  // 1. Fetch database items added using itemSchema
  try {
    const databaseItems = await Item.find({
      $or: [
        { stockQuantity: { $gt: 0 } },
        { stock_quantity: { $gt: 0 } },
        { in_stock: true }
      ]
    }).sort({ createdAt: -1 }).lean();

    const customItems = databaseItems.map((item) => ({
      ...item,
      id: String(item._id),
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
      in_stock: (item.stockQuantity !== undefined ? item.stockQuantity > 0 : true),
      maxPurchaseQuantity: item.maxPurchaseQuantity || 10,
      productType: "item"
    }));
    filtered = filtered.concat(customItems);
  } catch (error) {
    console.error("Shop custom items load error:", error);
  }

  // 2. Fetch database kits if any exist in the database
  try {
    const databaseKits = await Kit.find({ in_stock: true, stock_quantity: { $gt: 0 } }).lean();
    const customProducts = databaseKits.map((kit) => ({
      ...kit,
      id: String(kit._id),
      image_url: kit.image_url || kit.imageUrl,
      review_count: kit.review_count || 0,
      maxPurchaseQuantity: kit.maxPurchaseQuantity || 10,
      productType: "kit"
    }));
    filtered = filtered.concat(customProducts);
  } catch (error) {
    console.error("Shop custom bundle load error:", error);
  }

  const suggestionProducts = filtered.map((product) => ({
    name: product.name || "",
    tagline: product.tagline || "",
    description: product.description || "",
    category: product.category || ""
  }));

  if (category && category !== "All") {
    filtered = filtered.filter(
      (p) => String(p.category || "").toLowerCase() === category.toLowerCase()
    );
  }

  if (difficulty && difficulty !== "All levels") {
    filtered = filtered.filter(
      (p) => String(p.difficulty || "").toLowerCase() === difficulty.toLowerCase()
    );
  }

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(query) ||
        String(p.tagline || "").toLowerCase().includes(query) ||
        String(p.description || "").toLowerCase().includes(query) ||
        String(p.category || "").toLowerCase().includes(query)
    );
  }

  if (sort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  res.render("shop", {
    products: filtered,
    totalCount: filtered.length,
    activeCategory: category || "All",
    activeDifficulty: difficulty || "All levels",
    activeSort: sort || "featured",
    searchQuery: q || "",
    suggestionProductsJson: JSON.stringify(suggestionProducts).replace(/</g, "\\u003c"),
    loading: false
  });
};
