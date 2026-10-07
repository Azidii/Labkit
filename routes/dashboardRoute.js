const express = require("express");
const router = express.Router();

async function getFeaturedProducts() {
  return [
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
    },
  ];
}

router.get("/", async (req, res) => {
  const featured = await getFeaturedProducts();
  res.render("dashboard", { featured, loading: false });
});

module.exports = router;
