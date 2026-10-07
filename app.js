const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dashboardRoute = require('./routes/dashboardRoute');

app.use('/', dashboardRoute);

app.listen(PORT, () => {
  console.log(`Labkit server running at http://localhost:${PORT}`);
});
