const express = require('express');
const path = require('path');
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

const dashboardRoute = require('./routes/dashboardRoute');
const loginRoute = require('./routes/loginRoute');
const registerRoute = require('./routes/registerRoute');
const resetpassRoute = require('./routes/resetpassRoute');
const shopRoute = require('./routes/shopRoute');
const checkoutRoute = require('./routes/checkoutRoute');

app.use('/', dashboardRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/resetpass', resetpassRoute);
app.use('/shop', shopRoute);
app.use('/checkout', checkoutRoute);

app.listen(PORT, () => {
  console.log(`Labkit server running at http://localhost:${PORT}`);
});
