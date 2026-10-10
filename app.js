require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
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

// Make currentUser available to all EJS templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  next();
});

const dashboardRoute = require('./routes/dashboardRoute');
const loginRoute = require('./routes/loginRoute');
const registerRoute = require('./routes/registerRoute');
const resetpassRoute = require('./routes/resetpassRoute');
const shopRoute = require('./routes/shopRoute');
const checkoutRoute = require('./routes/checkoutRoute');
const successAuthRoute = require('./routes/successAuthRoute');

app.use('/', dashboardRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/success', successAuthRoute);
app.use('/resetpass', resetpassRoute);
app.use('/shop', shopRoute);
app.use('/checkout', checkoutRoute);

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
