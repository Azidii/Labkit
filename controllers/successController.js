// GET /success - Render authentication success transition page
exports.renderSuccess = (req, res) => {
  const type = req.query.type || "login";
  const currentUser = (req.session && req.session.user) || null;
  res.render("success", {
    type,
    orderId: req.query.order || null,
    orderTotal: req.query.total || null,
    currentUser
  });
};
