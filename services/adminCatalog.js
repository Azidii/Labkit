const PAGE_SIZE = 12;
const SEARCH_LIMIT = 100;
const PAGE_LIMIT = 1000000;

function readState(input = {}) {
  const q = typeof input.q === "string" ? input.q.trim().slice(0, SEARCH_LIMIT) : "";
  const rawPage = typeof input.page === "string" ? input.page : "";
  const parsed = /^\d{1,7}$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    q,
    page: Math.max(1, Math.min(PAGE_LIMIT, parsed || 1)),
    tab: input.tab === "accounts" ? "accounts" : "products"
  };
}

function adminUrl(state, overrides = {}) {
  const merged = { ...state, ...overrides };
  const next = readState({ ...merged, page: String(merged.page ?? 1) });
  const params = new URLSearchParams({ tab: next.tab });
  if (next.q) params.set("q", next.q);
  if (next.page > 1) params.set("page", String(next.page));
  if (overrides.created === "1") params.set("created", "1");
  if (overrides.updated === "1") params.set("updated", "1");
  return `/admin?${params}`;
}

function searchFilter(q) {
  if (!q) return {};
  const literal = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    $or: ["name", "category", "slug", "tagline"].map((field) => ({
      [field]: { $regex: literal, $options: "i" }
    }))
  };
}

function pageLinks(page, totalPages) {
  return [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b);
}

function emptyListing(state) {
  return {
    products: [], users: [], productCount: 0, userCount: 0, matchedCount: 0,
    currentPage: 1, totalPages: 1, rangeStart: 0, rangeEnd: 0,
    searchQuery: state.q, activeTab: state.tab, pageNumbers: [1],
    listingError: false,
    listingUrl: (overrides = {}) => adminUrl(state, overrides)
  };
}

async function loadListing(models, state) {
  const { Item, Kit, User } = models;
  const filter = searchFilter(state.q);
  const [itemTotal, kitTotal, userCount, itemMatches, kitMatches] = await Promise.all([
    Item.countDocuments({}), Kit.countDocuments({}), User.countDocuments({}),
    state.q ? Item.countDocuments(filter) : Promise.resolve(null),
    state.q ? Kit.countDocuments(filter) : Promise.resolve(null)
  ]);
  const productCount = itemTotal + kitTotal;
  const matchedCount = state.tab === "accounts" ? userCount
    : state.q ? itemMatches + kitMatches : productCount;
  const totalPages = Math.max(1, Math.ceil(matchedCount / PAGE_SIZE));
  const currentPage = Math.min(state.page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  let products = [];
  let users = [];

  if (state.tab === "accounts") {
    users = await User.find({}, "firstName lastName username email role createdAt")
      .sort({ createdAt: -1, _id: 1 }).skip(offset).limit(PAGE_SIZE).lean();
  } else {
    const project = (type) => ({
      _id: 1, name: 1, category: 1, price: 1, difficulty: 1,
      stockQuantity: { $ifNull: ["$stockQuantity", { $ifNull: ["$stock_quantity", 0] }] },
      maxPurchaseQuantity: 1, createdAt: 1, productType: { $literal: type }
    });
    products = await Item.aggregate([
      { $match: filter },
      { $project: project("item") },
      { $unionWith: { coll: Kit.collection.name, pipeline: [
        { $match: filter }, { $project: project("kit") }
      ] } },
      { $sort: { createdAt: -1, _id: 1, productType: 1 } },
      { $skip: offset }, { $limit: PAGE_SIZE }
    ]).option({ maxTimeMS: 5000 });
  }

  const canonical = { ...state, page: String(currentPage) };
  return {
    products, users, productCount, userCount, matchedCount,
    currentPage, totalPages,
    rangeStart: matchedCount ? offset + 1 : 0,
    rangeEnd: Math.min(offset + PAGE_SIZE, matchedCount),
    searchQuery: state.q, activeTab: state.tab,
    pageNumbers: pageLinks(currentPage, totalPages), listingError: false,
    listingUrl: (overrides = {}) => adminUrl(canonical, overrides)
  };
}

module.exports = { PAGE_SIZE, SEARCH_LIMIT, readState, adminUrl, searchFilter, pageLinks, emptyListing, loadListing };
