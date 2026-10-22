/**
 * Shipping Fee Calculator
 * Base Warehouse / Delivery Origin: Davao City, Philippines
 *
 * Distance-based Zones & Reasonable Rates:
 *   Domestic (Philippines):
 *     Zone 1 – Davao City (Local delivery)            ₱50.00
 *     Zone 2 – Davao Region (Nearby provinces)         ₱85.00
 *     Zone 3 – Rest of Mindanao                       ₱130.00
 *     Zone 4 – Visayas (Inter-island)                 ₱180.00
 *     Zone 5 – Metro Manila / NCR (Direct air hub)    ₱200.00
 *     Zone 6 – Luzon (Provincial long-haul)           ₱230.00
 *
 *   International (Outside Philippines):
 *     Zone 7A – Southeast Asia (ASEAN)                ₱650.00
 *     Zone 7B – East Asia & Asia-Pacific              ₱850.00
 *     Zone 7C – North America (US, Canada)           ₱1,250.00
 *     Zone 7D – Europe & United Kingdom              ₱1,450.00
 *     Zone 7E – Rest of the World                    ₱1,750.00
 */

// ---------------------------------------------------------------------------
// Domestic Philippine Regions
// ---------------------------------------------------------------------------

/** Davao Region provinces (Zone 2 – nearby) */
const DAVAO_REGION_PROVINCES = [
  "davao del sur",
  "davao del norte",
  "davao de oro",
  "davao de oro (formerly compostela valley)",
  "compostela valley",
  "davao occidental",
  "davao oriental"
];

/** Other Mindanao provinces (Zone 3) */
const MINDANAO_PROVINCES = [
  "agusan del norte",
  "agusan del sur",
  "basilan",
  "bukidnon",
  "camiguin",
  "cotabato",
  "cotabato (formerly north cotabato)",
  "north cotabato",
  "dinagat islands",
  "lanao del norte",
  "lanao del sur",
  "maguindanao",
  "maguindanao del norte",
  "maguindanao del sur",
  "misamis occidental",
  "misamis oriental",
  "sarangani",
  "south cotabato",
  "sultan kudarat",
  "sulu",
  "surigao del norte",
  "surigao del sur",
  "tawi-tawi",
  "zamboanga del norte",
  "zamboanga del sur",
  "zamboanga sibugay"
];

/** Visayas provinces (Zone 4) */
const VISAYAS_PROVINCES = [
  "aklan",
  "antique",
  "biliran",
  "bohol",
  "capiz",
  "cebu",
  "eastern samar",
  "guimaras",
  "iloilo",
  "leyte",
  "negros occidental",
  "negros oriental",
  "northern samar",
  "samar",
  "samar (formerly western samar)",
  "western samar",
  "siquijor",
  "southern leyte"
];

/** Metro Manila / NCR (Zone 5) */
const NCR_IDENTIFIERS = [
  "metro manila",
  "metro manila (ncr)",
  "ncr",
  "national capital region",
  "manila",
  "quezon city",
  "makati",
  "taguig",
  "pasig",
  "mandaluyong",
  "pasay",
  "paranaque",
  "las pinas",
  "muntinlupa",
  "marikina",
  "caloocan",
  "malabon",
  "navotas",
  "valenzuela",
  "san juan",
  "pateros"
];

// ---------------------------------------------------------------------------
// International Country Groupings
// ---------------------------------------------------------------------------

const SE_ASIA_COUNTRIES = [
  "singapore", "malaysia", "indonesia", "thailand", "vietnam",
  "brunei", "cambodia", "laos", "myanmar"
];

const ASIA_PACIFIC_COUNTRIES = [
  "japan", "south korea", "korea", "taiwan", "hong kong", "macau",
  "australia", "new zealand", "china"
];

const NORTH_AMERICA_COUNTRIES = [
  "united states", "united states of america", "usa", "us",
  "canada", "mexico"
];

const EUROPE_COUNTRIES = [
  "united kingdom", "uk", "great britain", "england", "scotland", "wales",
  "germany", "france", "italy", "spain", "netherlands", "switzerland",
  "sweden", "norway", "belgium", "austria", "poland", "ireland",
  "denmark", "finland", "portugal", "greece", "czech republic"
];

// ---------------------------------------------------------------------------
// Zone Definitions & Rates
// ---------------------------------------------------------------------------

const DOMESTIC_ZONES = {
  1: { baseFee: 50,  unitRate: 0,  label: "Davao City (Local Delivery)", description: "Local city delivery from Davao base" },
  2: { baseFee: 85,  unitRate: 3,  label: "Davao Region",                description: "Provinces within Davao region" },
  3: { baseFee: 130, unitRate: 5,  label: "Mindanao (Regional)",         description: "Regional transit across Mindanao" },
  4: { baseFee: 180, unitRate: 8,  label: "Visayas (Inter-island)",      description: "Inter-island sea/air transit" },
  5: { baseFee: 200, unitRate: 10, label: "Metro Manila (NCR)",          description: "Direct air freight to NCR hub" },
  6: { baseFee: 230, unitRate: 10, label: "Luzon (Provincial)",          description: "Long-haul provincial delivery" }
};

const INTERNATIONAL_ZONES = {
  "int-sea":   { baseFee: 650,  unitRate: 25, label: "International (Southeast Asia)",   description: "Regional international courier" },
  "int-apac":  { baseFee: 850,  unitRate: 35, label: "International (Asia-Pacific)",     description: "Asia-Pacific express courier" },
  "int-na":    { baseFee: 1250, unitRate: 45, label: "International (North America)",    description: "North America air express" },
  "int-eu":    { baseFee: 1450, unitRate: 50, label: "International (Europe & UK)",     description: "Europe international courier" },
  "int-world": { baseFee: 1750, unitRate: 60, label: "International (Worldwide)",        description: "Worldwide standard international" }
};

// ---------------------------------------------------------------------------
// Zone Resolution
// ---------------------------------------------------------------------------

/**
 * Determine whether a destination is domestic Philippines or international,
 * and return the corresponding zone key.
 *
 * @param {string} province - Province or state
 * @param {string} city     - City or municipality
 * @param {string} country  - Country name (default: "Philippines")
 * @returns {{ isInternational: boolean, zoneKey: string|number }}
 */
function resolveZone(province = "", city = "", country = "Philippines") {
  const ctry = (country || "Philippines").trim().toLowerCase();
  const prov = (province || "").trim().toLowerCase();
  const cty  = (city || "").trim().toLowerCase();

  // 1. Check if outside Philippines
  if (ctry && ctry !== "philippines" && ctry !== "ph" && ctry !== "phil" && ctry !== "pilipinas") {
    if (SE_ASIA_COUNTRIES.includes(ctry)) {
      return { isInternational: true, zoneKey: "int-sea" };
    }
    if (ASIA_PACIFIC_COUNTRIES.includes(ctry)) {
      return { isInternational: true, zoneKey: "int-apac" };
    }
    if (NORTH_AMERICA_COUNTRIES.includes(ctry)) {
      return { isInternational: true, zoneKey: "int-na" };
    }
    if (EUROPE_COUNTRIES.includes(ctry)) {
      return { isInternational: true, zoneKey: "int-eu" };
    }
    return { isInternational: true, zoneKey: "int-world" };
  }

  // 2. Domestic Philippines – Check Davao City proper (Zone 1)
  const isDavaoCity =
    cty === "davao city" ||
    cty === "davao" ||
    (prov === "davao del sur" && cty.includes("davao")) ||
    (cty.includes("davao city"));

  if (isDavaoCity) {
    return { isInternational: false, zoneKey: 1 };
  }

  // 3. Davao Region (Zone 2)
  if (DAVAO_REGION_PROVINCES.includes(prov)) {
    return { isInternational: false, zoneKey: 2 };
  }

  // 4. Rest of Mindanao (Zone 3)
  if (MINDANAO_PROVINCES.includes(prov)) {
    return { isInternational: false, zoneKey: 3 };
  }

  // 5. Visayas (Zone 4)
  if (VISAYAS_PROVINCES.includes(prov)) {
    return { isInternational: false, zoneKey: 4 };
  }

  // 6. Metro Manila / NCR (Zone 5)
  if (NCR_IDENTIFIERS.includes(prov) || NCR_IDENTIFIERS.includes(cty)) {
    return { isInternational: false, zoneKey: 5 };
  }

  // 7. Default for other Philippine provinces: Luzon Provincial (Zone 6)
  return { isInternational: false, zoneKey: 6 };
}

/**
 * Calculate shipping fee based on location and total quantity.
 *
 * @param {string} province        - Billing province or state
 * @param {string} [city]          - Billing city or municipality
 * @param {number} [totalQuantity] - Total quantity of items in cart (default 1)
 * @param {string} [country]       - Country name (default "Philippines")
 * @returns {{ zone: string|number, label: string, description: string, fee: number, isInternational: boolean }}
 */
function calculateShippingFee(province = "", city = "", totalQuantity = 1, country = "Philippines") {
  const { isInternational, zoneKey } = resolveZone(province, city, country);

  const zoneInfo = isInternational
    ? INTERNATIONAL_ZONES[zoneKey]
    : DOMESTIC_ZONES[zoneKey];

  const qty = Math.max(1, Number(totalQuantity) || 1);

  // Reasonable scaling: for the first 5 units, baseFee applies.
  // Beyond 5 units, a modest unitRate applies per extra unit.
  const extraUnits = Math.max(0, qty - 5);
  const extraFee = extraUnits * (zoneInfo.unitRate || 0);

  const totalFee = Math.round((zoneInfo.baseFee + extraFee) * 100) / 100;

  return {
    zone: zoneKey,
    label: zoneInfo.label,
    description: zoneInfo.description,
    fee: totalFee,
    isInternational
  };
}

module.exports = {
  calculateShippingFee,
  resolveZone,
  DOMESTIC_ZONES,
  INTERNATIONAL_ZONES
};
