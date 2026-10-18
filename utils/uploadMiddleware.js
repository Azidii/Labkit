const multer = require("multer");
const path = require("path");

// Memory storage engine: keeps uploaded file in memory buffer so it can be saved directly into MongoDB
const storage = multer.memoryStorage();

// File filter: only images
const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|webp|gif|svg)$/i;
  const isExtAllowed = allowed.test(path.extname(file.originalname).toLowerCase());
  const isMimeAllowed = file.mimetype.startsWith("image/");

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, WebP, GIF, SVG) are allowed."), false);
  }
};

const uploadItemImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter
});

const handleItemImageUpload = (req, res, next) => {
  uploadItemImage.single("itemImage")(req, res, (err) => {
    if (err) {
      req.uploadError = err.message;
    }
    next();
  });
};

module.exports = {
  uploadItemImage,
  handleItemImageUpload
};

