require("dotenv").config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../utils/jwtConfig");
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

/**
 * processLogin:
 * Authenticate the user, create a JWT payload containing userId and role,
 * sign it with process.env.JWT_SECRET (1-day expiration), and set it in an httpOnly cookie.
 * Route logic: If the role is "admin", redirect to /admin/dashboard. Otherwise, redirect to /shop.
 */
exports.processLogin = async (req, res) => {
  const isJson = req.is("json") || req.headers.accept?.includes("application/json");
  const requestedReturnTo = req.body.returnTo || req.query.returnTo;
  const returnTo = typeof requestedReturnTo === "string" && requestedReturnTo.startsWith("/") &&
    !requestedReturnTo.startsWith("//") ? requestedReturnTo : null;

  try {
    const rawIdentifier = String(req.body?.email || req.body?.username || req.body?.identifier || "").trim();
    const password = String(req.body?.password || "");

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

    // Create JWT payload containing userId and role
    const payload = {
      userId: user._id,
      role: user.role
    };

    // Sign it with process.env.JWT_SECRET (1-day expiration, HS256)
    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1d"
    });

    // Set it in an httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Establish user session
    if (req.session) {
      req.session.user = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar || ""
      };
    }

    // Route logic: If the role is "admin", redirect to /admin. Otherwise, redirect to returnTo or /shop.
    const redirectUrl = user.role === "admin" ? "/admin" : (returnTo || "/shop");

    if (isJson) {
      return res.json({
        success: true,
        redirect: redirectUrl,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Login error:", error);
    const msg = "An unexpected error occurred during login. Please try again.";
    if (isJson) {
      return res.status(500).json({ success: false, error: msg });
    }
    return res.status(500).render("login", { error: msg, success: null });
  }
};

// Alias login to processLogin for full backwards compatibility
exports.login = exports.processLogin;

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
        role: "customer"
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

    // Create and set JWT token cookie
    const payload = {
      userId: user._id,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    });

    // Save session
    if (req.session) {
      req.session.user = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar || ""
      };
    }

    const redirectUrl = user.role === "admin" ? "/admin/dashboard" : "/shop";
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Google OAuth Error:", err);
    res.redirect(
      `/login?error=${encodeURIComponent(err.message || "Failed to sign in with Google.")}`
    );
  }
};

/**
 * Logout controller:
 * Clears the token cookie and redirects to /login.
 */
exports.logout = (req, res) => {
  const clearOpts = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
  res.clearCookie("token", clearOpts);
  if (req.session) {
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
      res.clearCookie("connect.sid", clearOpts);
      res.redirect("/login");
    });
  } else {
    res.clearCookie("connect.sid", clearOpts);
    res.redirect("/login");
  }
};
