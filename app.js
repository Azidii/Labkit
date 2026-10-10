require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/userSchema');
const connectDB = require('./database/mongo-dbconnect');

// Connect Database
connectDB().catch(err => console.error('Database initialization failed:', err.message));

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Express Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'labkit-session-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if running over HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Global middleware: authenticate via session or JWT token cookie, synchronize currentUser and userRole
app.use(async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.userRole = null;

  try {
    // 1. If active session already has user
    if (req.session && req.session.user) {
      res.locals.currentUser = req.session.user;
      res.locals.userRole = req.session.user.role || null;
      return next();
    }

    // 2. Otherwise check token cookie
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Restore user session from MongoDB
        const dbUser = await User.findById(decoded.userId).lean();
        if (dbUser) {
          req.session.user = {
            id: dbUser._id,
            firstName: dbUser.firstName || "",
            lastName: dbUser.lastName || "",
            username: dbUser.username || "",
            email: dbUser.email || "",
            role: dbUser.role || "customer",
            avatar: dbUser.avatar || ""
          };
          res.locals.currentUser = req.session.user;
          res.locals.userRole = req.session.user.role;
        } else {
          // Token user not found in DB: clear stale cookie
          res.clearCookie("token", { httpOnly: true, path: "/" });
          req.user = null;
        }
      } catch (err) {
        // Token invalid or expired: clear cookie
        res.clearCookie("token", { httpOnly: true, path: "/" });
        req.user = null;
      }
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
  }

  next();
});

const dashboardRoute = require('./routes/dashboardRoute');
const loginRoute = require('./routes/loginRoute');
const registerRoute = require('./routes/registerRoute');
const resetpassRoute = require('./routes/resetpassRoute');
const shopRoute = require('./routes/shopRoute');
const checkoutRoute = require('./routes/checkoutRoute');
const aboutRoute = require('./routes/aboutRoute');
const successAuthRoute = require('./routes/successAuthRoute');
const adminRoute = require('./routes/adminRoute');

app.use('/about', aboutRoute);
app.use('/how-it-works', aboutRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/success', successAuthRoute);
app.use('/admin', adminRoute);
app.use('/resetpass', resetpassRoute);
app.use('/shop', shopRoute);
app.use('/checkout', checkoutRoute);
app.use('/admin', adminRoute);
app.use('/', dashboardRoute);

// Convenience aliases for Google OAuth
app.get('/auth/google', (req, res) => res.redirect('/login/google'));
app.get('/auth/google/callback', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(`/login/google/callback${query ? '?' + query : ''}`);
});

app.listen(PORT, () => {
  console.log(`Labkit server running at http://localhost:${PORT}`);
});

module.exports = app;
