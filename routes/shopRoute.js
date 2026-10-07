const express = require("express");
const router = express.Router();

const bundles = [
  {
    id: "1",
    slug: "esp8266-climate-station",
    name: "ESP8266 + DHT11 Climate Station",
    tagline: "WiFi-enabled temp & humidity logger",
    price: 34.99,
    compare_at_price: 44.99,
    category: "IoT & WiFi",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    rating: 4.8,
    review_count: 126,
    digital_files: ["circuit-diagram.pdf", "topology.pkt", "firmware.zip"],
    in_stock: true,
  },
  {
    id: "2",
    slug: "ultrasonic-ranger-kit",
    name: "HC-SR04 Ultrasonic Ranger Kit",
    tagline: "Distance-measuring sensor bundle with driver board",
    price: 19.99,
    compare_at_price: null,
    category: "Sensor Systems",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600",
    rating: 4.5,
    review_count: 83,
    digital_files: ["circuit-diagram.pdf", "ranger-firmware.ino"],
    in_stock: true,
  },
  {
    id: "3",
    slug: "7400-logic-lab",
    name: "7400-Series Logic Lab",
    tagline: "Breadboard + IC kit for digital logic experiments",
    price: 27.49,
    compare_at_price: 34.99,
    category: "Digital Logic",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600",
    rating: 4.7,
    review_count: 64,
    digital_files: ["schematic.pdf", "timing-diagrams.pdf"],
    in_stock: true,
  },
  {
    id: "4",
    slug: "motor-driver-bundle",
    name: "DC Motor + L298N Driver Bundle",
    tagline: "Dual H-bridge motor control for robotics projects",
    price: 22.99,
    compare_at_price: 29.99,
    category: "Robotics & Motion",
    difficulty: "Advanced",
    image_url: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600",
    rating: 4.6,
    review_count: 91,
    digital_files: ["schematic.pdf", "motor-control.py"],
    in_stock: true,
  },
  {
    id: "5",
    slug: "esp32-ble-gateway",
    name: "ESP32 Bluetooth Mesh Gateway",
    tagline: "Dual-core microcontroller with onboard antenna",
    price: 39.99,
    compare_at_price: 49.99,
    category: "IoT & WiFi",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
    rating: 4.9,
    review_count: 142,
    digital_files: ["mesh-topology.pkt", "firmware.bin"],
    in_stock: true,
  },
  {
    id: "6",
    slug: "smart-home-sensor-pack",
    name: "Multi-Sensor Environmental Pack",
    tagline: "MQ-2 gas, PIR motion, and light sensors with breadboard",
    price: 31.50,
    compare_at_price: 38.00,
    category: "Sensor Systems",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
    rating: 4.4,
    review_count: 57,
    digital_files: ["circuit-diagram.pdf", "sensor-calibration.pdf"],
    in_stock: true,
  }
];

router.get("/", (req, res) => {
  const { category, difficulty, sort, q } = req.query;

  let filtered = [...bundles];

  if (category && category !== "All") {
    filtered = filtered.filter(
      (b) => b.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (difficulty && difficulty !== "All") {
    filtered = filtered.filter(
      (b) => b.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.tagline.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query)
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
    activeDifficulty: difficulty || "All",
    activeSort: sort || "featured",
    searchQuery: q || "",
    loading: false
  });
});

module.exports = router;
