const Kit = require("../models/kitsSchema");

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
  {
    id: "7",
    slug: "ky-038-microphone-sound-sensor",
    name: "KY-038 Microphone Sound Sensor Module",
    tagline: "High-sensitivity voice & acoustic detection for IoT triggers",
    price: 2.40,
    compare_at_price: null,
    category: "Sensors & Modules",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
    rating: 4.8,
    review_count: 142,
    in_stock: true,
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
    review_count: 360,
    in_stock: true,
  },
  {
    id: "9",
    slug: "resistor-pack-100pcs",
    name: "Metal Film Resistor Assortment (100 pcs)",
    tagline: "10Ω to 1MΩ 1/4W precision resistors (220Ω, 1kΩ, 10kΩ included)",
    price: 2.20,
    compare_at_price: null,
    category: "Displays & Power",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
    rating: 4.9,
    review_count: 420,
    in_stock: true,
  },
  {
    id: "10",
    slug: "active-piezo-buzzer-5v",
    name: "5V Active Buzzer Module",
    tagline: "Continuous audible alert & tone notification module",
    price: 1.20,
    compare_at_price: null,
    category: "Buzzers & Audio",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
    rating: 4.7,
    review_count: 195,
    in_stock: true,
  },
  {
    id: "11",
    slug: "dht11-temperature-humidity-sensor",
    name: "DHT11 Temp & Humidity Sensor",
    tagline: "Digital environmental monitoring module for ESP32",
    price: 2.75,
    compare_at_price: null,
    category: "Sensors & Modules",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    rating: 4.7,
    review_count: 288,
    in_stock: true,
  },
  {
    id: "12",
    slug: "ssd1306-oled-display-096",
    name: "0.96\" I2C OLED Display (SSD1306)",
    tagline: "128x64 blue OLED screen for real-time IoT readouts",
    price: 4.80,
    compare_at_price: null,
    category: "Displays & Power",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
    rating: 4.8,
    review_count: 310,
    in_stock: true,
  },
  {
    id: "13",
    slug: "esp32-weather-station-iot-kit",
    name: "ESP32 Weather Station IoT Kit",
    tagline: "Complete bundle with ESP32, DHT11 temp/humidity, OLED display & breadboard",
    price: 34.50,
    compare_at_price: 39.99,
    category: "IoT Kits",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    rating: 4.9,
    review_count: 148,
    in_stock: true,
  },
  {
    id: "14",
    slug: "smart-radar-ultrasonic-iot-kit",
    name: "Ultrasonic Radar & Distance Sensing IoT Kit",
    tagline: "HC-SR04 sonar module, SG90 micro servo, ESP8266 & Packet Tracer topology",
    price: 24.99,
    compare_at_price: 29.50,
    category: "IoT Kits",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600",
    rating: 4.8,
    review_count: 96,
    in_stock: true,
  },
  {
    id: "15",
    slug: "acoustic-alarm-piezo-iot-kit",
    name: "Acoustic Alarm & Sound Triggered IoT Kit",
    tagline: "KY-038 microphone sensor, 5V active buzzer, ESP32 and telemetry scripts",
    price: 21.00,
    compare_at_price: 25.00,
    category: "IoT Kits",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
    rating: 4.9,
    review_count: 82,
    in_stock: true,
  },
  {
    id: "16",
    slug: "arduino-uno-r3-compatible-board",
    name: "Arduino Uno R3 Compatible Board",
    tagline: "Reliable ATmega328P board for beginner projects",
    price: 18.99,
    compare_at_price: null,
    category: "Microcontrollers",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600",
    rating: 4.8,
    review_count: 276,
    in_stock: true,
  },
  {
    id: "17",
    slug: "raspberry-pi-pico-w",
    name: "Raspberry Pi Pico W",
    tagline: "Compact RP2040 microcontroller with WiFi",
    price: 8.50,
    compare_at_price: null,
    category: "Microcontrollers",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    rating: 4.9,
    review_count: 198,
    in_stock: true,
  },
  {
    id: "18",
    slug: "mpu6050-gyroscope-accelerometer",
    name: "MPU6050 Gyroscope & Accelerometer",
    tagline: "Six-axis motion tracking module for robotics",
    price: 4.25,
    compare_at_price: null,
    category: "Sensors & Modules",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600",
    rating: 4.7,
    review_count: 164,
    in_stock: true,
  },
  {
    id: "19",
    slug: "pir-motion-sensor-hc-sr501",
    name: "HC-SR501 PIR Motion Sensor",
    tagline: "Adjustable infrared motion detection for automation",
    price: 2.85,
    compare_at_price: null,
    category: "Sensors & Modules",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    rating: 4.6,
    review_count: 231,
    in_stock: true,
  },
  {
    id: "20",
    slug: "neopixel-rgb-led-ring-16",
    name: "NeoPixel RGB LED Ring (16 LEDs)",
    tagline: "Individually addressable colorful lighting module",
    price: 6.75,
    compare_at_price: null,
    category: "Displays & Power",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600",
    rating: 4.8,
    review_count: 118,
    in_stock: true,
  },
  {
    id: "21",
    slug: "l298n-motor-driver-module",
    name: "L298N Dual H-Bridge Motor Driver",
    tagline: "Control two DC motors with direction and speed",
    price: 5.50,
    compare_at_price: null,
    category: "Motors & Actuators",
    difficulty: "Intermediate",
    image_url: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600",
    rating: 4.6,
    review_count: 143,
    in_stock: true,
  },
  {
    id: "22",
    slug: "dc-geared-motor-pair",
    name: "TT DC Geared Motor Pair",
    tagline: "Low-voltage gear motors for small robot platforms",
    price: 7.25,
    compare_at_price: null,
    category: "Motors & Actuators",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600",
    rating: 4.5,
    review_count: 97,
    in_stock: true,
  },
  {
    id: "23",
    slug: "mb102-breadboard-power-supply",
    name: "MB102 Breadboard Power Supply",
    tagline: "Selectable 3.3V or 5V regulated breadboard power",
    price: 3.95,
    compare_at_price: null,
    category: "Displays & Power",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
    rating: 4.7,
    review_count: 185,
    in_stock: true,
  },
  {
    id: "24",
    slug: "active-passive-component-kit",
    name: "Active & Passive Component Starter Kit",
    tagline: "LEDs, capacitors, transistors and resistors for prototyping",
    price: 14.50,
    compare_at_price: 17.99,
    category: "Displays & Power",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
    rating: 4.8,
    review_count: 133,
    in_stock: true,
  },
  {
    id: "25",
    slug: "breadboard-prototyping-kit",
    name: "830-Point Breadboard Prototyping Kit",
    tagline: "Reusable solderless breadboard with jumper wires and rails",
    price: 9.99,
    compare_at_price: null,
    category: "IoT Kits",
    difficulty: "Beginner",
    image_url: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600",
    rating: 4.9,
    review_count: 207,
    in_stock: true,
  },
];

const philippineRetailPrices = {
  "raspberry-pi-4-model-b-4gb": [10450, null],
  "esp32-devkit-v1-wroom32": [350, null],
  "hc-sr04-ultrasonic-sensor": [85, null],
  "orange-pi-5-8gb": [13900, null],
  "piezo-buzzer-12v": [25, null],
  "sg90-micro-servo": [120, null],
  "ky-038-microphone-sound-sensor": [65, null],
  "jumper-wires-40pin-mf": [45, null],
  "resistor-pack-100pcs": [85, null],
  "active-piezo-buzzer-5v": [20, null],
  "dht11-temperature-humidity-sensor": [45, null],
  "ssd1306-oled-display-096": [140, null],
  "esp32-weather-station-iot-kit": [1995, 2295],
  "smart-radar-ultrasonic-iot-kit": [1450, 1695],
  "acoustic-alarm-piezo-iot-kit": [1250, 1495],
  "arduino-uno-r3-compatible-board": [350, null],
  "raspberry-pi-pico-w": [550, null],
  "mpu6050-gyroscope-accelerometer": [95, null],
  "pir-motion-sensor-hc-sr501": [85, null],
  "neopixel-rgb-led-ring-16": [180, null],
  "l298n-motor-driver-module": [120, null],
  "dc-geared-motor-pair": [180, null],
  "mb102-breadboard-power-supply": [55, null],
  "active-passive-component-kit": [250, 299],
  "breadboard-prototyping-kit": [220, null]
};

parts.forEach((product) => {
  const prices = philippineRetailPrices[product.slug];
  if (prices) {
    product.price = prices[0];
    product.compare_at_price = prices[1];
  }
});

// GET /shop - Display shop catalog with filters
exports.renderShop = async (req, res) => {
  const { category, difficulty, sort, q } = req.query;

  let filtered = [...parts];
  try {
    const databaseKits = await Kit.find({ in_stock: true, stock_quantity: { $gt: 0 } }).lean();
    const customProducts = databaseKits.map((kit) => ({
      ...kit,
      id: String(kit._id),
      review_count: kit.review_count || 0,
      maxPurchaseQuantity: kit.maxPurchaseQuantity || 10
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
    filtered.sort((a, b) => b.rating - a.rating);
  }

  res.render("shop", {
    products: filtered,
    totalCount: filtered.length,
    activeCategory: category || "All",
    activeDifficulty: difficulty || "All levels",
    activeSort: sort || "rating",
    searchQuery: q || "",
    suggestionProductsJson: JSON.stringify(suggestionProducts).replace(/</g, "\\u003c"),
    loading: false
  });
};
