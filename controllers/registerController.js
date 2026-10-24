const User = require("../models/userSchema");

// GET /register - Display registration page
exports.renderRegister = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("register", {
    error: req.query.error || null,
    formData: {}
  });
};

// GET /register/google - Shortcut to Google OAuth
exports.redirectToGoogle = (req, res) => {
  res.redirect("/login/google");
};

// POST /register - Handle new user registration (Supports fetch JSON and form submit)
exports.register = async (req, res) => {
  const isJson = req.is("json") || req.headers.accept?.includes("application/json");
  const firstName = String(req.body?.firstName || "").trim();
  const lastName = String(req.body?.lastName || "").trim();
  const username = String(req.body?.username || "").trim();
  const email = String(req.body?.email || "").toLowerCase().trim();
  const password = String(req.body?.password || "");
  const confirmPassword = String(req.body?.confirmPassword || "");
  const formData = { firstName, lastName, username, email };

  try {
    // 1. Validate required inputs
    if (!firstName || !lastName || !username || !email || !password) {
      const msg = "All fields are required.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("register", { error: msg, formData });
    }

    // 2. Validate password length
    if (password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("register", { error: msg, formData });
    }

    // 3. Confirm password match
    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("register", { error: msg, formData });
    }

    // 4. Validate username format
    const cleanUsername = username;
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      const msg = "Username must be 3-30 characters (letters, numbers, underscores only).";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("register", { error: msg, formData });
    }

    // 5. Check if email already registered
    const cleanEmail = email;
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      const msg = "An account with this email already exists.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("register", { error: msg, formData });
    }

    // 6. Check if username is already taken
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      const msg = "This username is already taken. Please choose another.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("register", { error: msg, formData });
    }

    // 7. Hash password using schema static method
    const passwordHash = await User.hashPassword(password);

    // 8. Create user document adhering to userSchema (role strictly enforced)
    const newUser = await User.create({
      firstName,
      lastName,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: "user"
    });

    // 9. User created successfully. Do not auto-login; user proceeds to Login Page to log in.
    if (isJson) {
      return res.status(201).json({
        success: true,
        redirect: "/success?type=register",
        email: newUser.email
      });
    }

    res.redirect("/success?type=register");
  } catch (error) {
    console.error("Registration error:", error);
    const msg = "Failed to create account. Please try again.";
    if (isJson) {
      return res.status(500).json({ success: false, error: msg });
    }
    res.status(500).render("register", { error: msg, formData });
  }
};
