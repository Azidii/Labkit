const Kit = require("../models/kitsSchema");
const Item = require("../models/itemSchema");

// GET /shop - Display shop catalog with filters
exports.renderShop = async (req, res) => {
  const category = typeof req.query?.category === "string" ? req.query.category.trim() : null;
  const difficulty = typeof req.query?.difficulty === "string" ? req.query.difficulty.trim() : null;
  const sort = typeof req.query?.sort === "string" ? req.query.sort.trim() : null;
  const q = typeof req.query?.q === "string" ? req.query.q.trim() : null;

  let filtered = [];

  // 1. Fetch database items added using itemSchema
  try {
    const databaseItems = await Item.find().sort({ createdAt: -1 }).lean();

    const customItems = databaseItems.map((item) => {
      const stock = Math.max(0, Number(item.stockQuantity !== undefined ? item.stockQuantity : (item.stock || 0)));
      return {
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
        stockQuantity: stock,
        stock: stock,
        in_stock: stock > 0,
        maxPurchaseQuantity: stock,
        productType: "item"
      };
    });
    filtered = filtered.concat(customItems);
  } catch (error) {
    console.error("Shop custom items load error:", error);
  }

  // 2. Fetch database kits if any exist in the database
  try {
    const databaseKits = await Kit.find().sort({ createdAt: -1 }).lean();
    const customProducts = databaseKits.map((kit) => {
      const stock = Math.max(0, Number(kit.stockQuantity !== undefined ? kit.stockQuantity : (kit.stock_quantity !== undefined ? kit.stock_quantity : 0)));
      return {
        ...kit,
        id: String(kit._id),
        image_url: kit.image_url || kit.imageUrl,
        review_count: kit.review_count || 0,
        stockQuantity: stock,
        stock: stock,
        in_stock: stock > 0,
        maxPurchaseQuantity: stock,
        productType: "kit"
      };
    });
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
