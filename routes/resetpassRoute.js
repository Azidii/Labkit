const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("resetpass");
});

router.post("/", (req, res) => {
  res.redirect("/login");
});

module.exports = router;
