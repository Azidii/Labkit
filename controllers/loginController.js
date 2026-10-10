require("dotenv").config();
const User = require("../models/userSchema");

// GET /login - Render login page
exports.renderLogin = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("login", {
    error: req.query.error || null,
    success: req.query.success || null
  });
};

// POST /login - Authenticate user (Supports JSON fetch and form submit)
exports.login = async (req, res) => {
  const isJson = req.is("json") || req.headers.accept?.includes("application/json");
  const requestedReturnTo = req.body.returnTo || req.query.returnTo;
  const returnTo = typeof requestedReturnTo === "string" && requestedReturnTo.startsWith("/") &&
    !requestedReturnTo.startsWith("//") ? requestedReturnTo : null;

  try {
    const rawIdentifier = (req.body.email || req.body.username || req.body.identifier || "").trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      const msg = "Please enter your email/username and password.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("login", { error: msg, success: null });
    }

    const cleanId = rawIdentifier;
    const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const caseInsensitiveRegex = new RegExp(`^${escapedId}$`, "i");

    // Query user by email (case-insensitive) or by username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { username: cleanId },
        { username: cleanId.toLowerCase() },
        { username: { $regex: caseInsensitiveRegex } }
      ]
    });

    if (!user) {
      const msg = "Invalid email/username or password.";
      return isJson
        ? res.status(401).json({ success: false, error: msg })
        : res.status(401).render("login", { error: msg, success: null });
    }

    // Check if account only has Google OAuth
    if (!user.passwordHash && user.googleId) {
      const msg = "This account was registered with Google. Please use 'Continue with Google'.";
      return isJson
        ? res.status(400).json({ success: false, error: msg })
        : res.status(400).render("login", { error: msg, success: null });
    }

    // Verify password using schema instance method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const msg = "Invalid email/username or password.";
      return isJson
        ? res.status(401).json({ success: false, error: msg })
        : res.status(401).render("login", { error: msg, success: null });
    }

    // Establish user session
    req.session.user = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || ""
    };

    if (isJson) {
      return res.json({
        success: true,
        redirect: returnTo || "/success?type=login",
        user: req.session.user
      });
    }

    res.redirect(returnTo || "/success?type=login");
  } catch (error) {
    console.error("Login error:", error);
    const msg = "An unexpected error occurred during login. Please try again.";
    if (isJson) {
      return res.status(500).json({ success: false, error: msg });
    }
    res.status(500).render("login", { error: msg, success: null });
  }
};

// GET /login/google - Start Google OAuth flow
exports.startGoogleAuth = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret ||
    clientId === "your-google-client-id.apps.googleusercontent.com" ||
    clientSecret === "your-google-client-secret"
  ) {
    return res.redirect(
      "/login?error=" +
        encodeURIComponent(
          "Google OAuth is not configured yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env."
        )
    );
  }

  const redirectUri = `${req.protocol}://${req.get("host")}/login/google/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  req.session.oauthState = state;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  res.redirect(authUrl.toString());
};

// GET /login/google/callback - Handle Google OAuth callback
exports.handleGoogleCallback = async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(
        `/login?error=${encodeURIComponent("Google sign-in was canceled: " + error)}`
      );
    }

    if (!code) {
      return res.redirect(
        `/login?error=${encodeURIComponent("Authorization code missing from Google.")}`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get("host")}/login/google/callback`;

    // Exchange authorization code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData);
      return res.redirect(
        `/login?error=${encodeURIComponent(
          tokenData.error_description || "Failed to exchange token with Google."
        )}`
      );
    }

    // Retrieve Google user profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileResponse.json();
    if (!profile || !profile.email) {
      return res.redirect(
        `/login?error=${encodeURIComponent("Unable to retrieve email from Google profile.")}`
      );
    }

    const email = profile.email.toLowerCase().trim();

    // Find or create user adhering to userSchema
    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email }]
    });

    if (!user) {
      let baseUsername = (email.split("@")[0] || "user")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        firstName: profile.given_name || profile.name || "Google",
        lastName: profile.family_name || "User",
        email,
        username,
        googleId: profile.sub,
        avatar: profile.picture || "",
        role: "user"
      });
    } else {
      let modified = false;
      if (!user.googleId) {
        user.googleId = profile.sub;
        modified = true;
      }
      if (profile.picture && !user.avatar) {
        user.avatar = profile.picture;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    // Save session
    req.session.user = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || ""
    };

    res.redirect("/success?type=google");
  } catch (err) {
    console.error("Google OAuth Error:", err);
    res.redirect(
      `/login?error=${encodeURIComponent(err.message || "Failed to sign in with Google.")}`
    );
  }
};

// GET /login/logout - Sign out user
exports.logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
      res.redirect("/login");
    });
  } else {
    res.redirect("/login");
  }
};
