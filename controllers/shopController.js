const parts = [
  {
    id: "1",
    slug: "raspberry-pi-4-model-b-4gb",
    name: "Raspberry Pi 4 Model B (4 GB)",
    tagline: "Quad-core SBC for full Linux projects",
    price: 55.00,
    compare_at_price: null,
    category: "Single-Board Computers",
    difficulty: "Single unit",
    image_url: "https://images.unsplash.com/photo-1629292923887-a803417bd405?w=600",
    rating: 4.9,
    review_count: 487,
    in_stock: true,
  },
  {
    id: "2",
    slug: "esp32-devkit-v1-wroom32",
    name: "ESP32 DevKit V1 (WROOM-32)",
    tagline: "Dual-core WiFi + Bluetooth dev board",
    price: 12.50,
    compare_at_price: null,
    category: "Microcontrollers",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    rating: 4.8,
    review_count: 214,
    in_stock: true,
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
    review_count: 312,
    in_stock: true,
  },
  {
    id: "4",
    slug: "orange-pi-5-8gb",
    name: "Orange Pi 5 (8 GB)",
    tagline: "RK3588S powerhouse for AI & media projects",
    price: 89.00,
    compare_at_price: null,
    category: "Single-Board Computers",
    difficulty: "Single unit",
    image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
    rating: 4.7,
    review_count: 156,
    in_stock: true,
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
    review_count: 180,
    in_stock: true,
  },
  {
    id: "6",
    slug: "sg90-micro-servo",
    name: "SG90 Micro Servo Motor",
    tagline: "180° rotation, lightweight actuator for robotics",
    price: 2.99,
    compare_at_price: null,
    category: "Motors & Actuators",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600",
    rating: 4.5,
    review_count: 245,
    in_stock: true,
  },
];

// GET /shop - Display shop catalog with filters
exports.renderShop = (req, res) => {
  const { category, difficulty, sort, q } = req.query;

  let filtered = [...parts];

  if (category && category !== "All") {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (difficulty && difficulty !== "All levels") {
    filtered = filtered.filter(
      (p) => p.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  if (sort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  res.render("shop", {
    products: filtered,
    totalCount: filtered.length,
    activeCategory: category || "All",
    activeDifficulty: difficulty || "All levels",
    activeSort: sort || "rating",
    searchQuery: q || "",
    loading: false
  });
};
