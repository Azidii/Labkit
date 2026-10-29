const Item = require("../models/itemSchema");
const Kit = require("../models/kitsSchema");

function escapeRegex(text) {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// GET /shop - Display shop catalog with server-side pagination, filters, and sorting
exports.renderShop = async (req, res) => {
  const category = typeof req.query?.category === "string" ? req.query.category.trim() : null;
  const difficulty = typeof req.query?.difficulty === "string" ? req.query.difficulty.trim() : null;
  const sort = typeof req.query?.sort === "string" ? req.query.sort.trim() : null;
  const q = typeof req.query?.q === "string" ? req.query.q.trim() : null;
  const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
  const limit = 12; // 12 products per shop page as requested

  const query = {};

  if (category && category !== "All") {
    query.category = { $regex: new RegExp("^" + escapeRegex(category) + "$", "i") };
  }

  if (difficulty && difficulty !== "All levels") {
    query.difficulty = { $regex: new RegExp("^" + escapeRegex(difficulty) + "$", "i") };
  }

  if (q && q.trim()) {
    const searchRegex = new RegExp(escapeRegex(q.trim()), "i");
    query.$or = [
      { name: searchRegex },
      { tagline: searchRegex },
      { description: searchRegex },
      { category: searchRegex }
    ];
  }

  let sortOption = { createdAt: -1, _id: 1 };
  if (sort === "price-asc") {
    sortOption = { price: 1, _id: 1 };
  } else if (sort === "price-desc") {
    sortOption = { price: -1, _id: 1 };
  } else if (sort === "rating") {
    sortOption = { rating: -1, _id: 1 };
  }

  let products = [];
  let totalCount = 0;
  let dbError = null;

  try {
    const projection = "name tagline description price compare_at_price category difficulty imageUrl rating review_count stockQuantity slug createdAt";

    const [count, items] = await Promise.all([
      Item.countDocuments(query),
      Item.find(query)
        .select(projection)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    totalCount = count;

    products = items.map((item) => {
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
        image_url: item.imageUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
        rating: item.rating || 5.0,
        review_count: item.review_count || 0,
        stockQuantity: stock,
        stock: stock,
        in_stock: stock > 0,
        maxPurchaseQuantity: stock,
        productType: "item"
      };
    });
  } catch (error) {
    console.error("Shop custom items load error:", error.message);
    dbError = "Unable to load shop catalog right now. Please check back shortly.";
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Set HTTP caching headers only for unauthenticated public requests
  const isAuth = Boolean((req.session && req.session.user) || req.cookies?.token);
  if (!isAuth && !dbError) {
    res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=300");
  } else {
    res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  }

  res.render("shop", {
    products,
    totalCount,
    currentPage: page,
    totalPages,
    activeCategory: category || "All",
    activeDifficulty: difficulty || "All levels",
    activeSort: sort || "featured",
    searchQuery: q || "",
    error: dbError,
    loading: false
  });
};

// GET /api/shop/suggestions - Lightweight search suggestions endpoint
exports.getSuggestions = async (req, res) => {
  const q = typeof req.query?.q === "string" ? req.query.q.trim() : "";
  if (!q || q.length < 1) {
    return res.json([]);
  }
  try {
    const searchRegex = new RegExp(escapeRegex(q), "i");
    const items = await Item.find({
      $or: [
        { name: searchRegex },
        { category: searchRegex },
        { tagline: searchRegex }
      ]
    })
      .select("name category")
      .limit(6)
      .lean();

    return res.json(items.map((item) => ({
      name: item.name,
      category: item.category
    })));
  } catch (err) {
    console.error("Suggestions error:", err.message);
    return res.json([]);
  }
};

