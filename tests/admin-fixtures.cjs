process.env.JWT_SECRET = 'labkit-admin-regression-tests-only';
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('node:path');
const Item = require('../models/itemSchema');
const Kit = require('../models/kitsSchema');
const User = require('../models/userSchema');

const adminId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const userId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const removedId = 'cccccccccccccccccccccccc';
const token = (id, role) => jwt.sign({ userId: id, role }, process.env.JWT_SECRET, { algorithm: 'HS256' });
const cookies = {
  admin: `token=${token(adminId, 'admin')}`,
  user: `token=${token(userId, 'user')}`,
  staleAdmin: `token=${token(userId, 'admin')}`,
  removedAdmin: `token=${token(removedId, 'admin')}`
};

function matches(doc, filter) {
  if (!filter || !Object.keys(filter).length) return true;
  if (filter.$or) return filter.$or.some((part) => matches(doc, part));
  return Object.entries(filter).every(([key, value]) => value?.$regex !== undefined
    ? new RegExp(value.$regex, value.$options).test(String(doc[key] || '')) : String(doc[key]) === String(value));
}
function sorted(rows, sort) {
  return [...rows].sort((a, b) => {
    for (const [field, direction] of Object.entries(sort)) {
      if (a[field] < b[field]) return -direction;
      if (a[field] > b[field]) return direction;
    }
    return 0;
  });
}
function query(rows, single = false) {
  let selection;
  let result = rows;
  const q = {
    select(value) { selection = value.split(/\s+/); return q; },
    sort(value) { result = sorted(result, value); return q; },
    skip(value) { result = result.slice(value); return q; },
    limit(value) { result = result.slice(0, value); return q; },
    lean() {
      const selected = selection ? result.map((row) => Object.fromEntries(['_id', ...selection].filter((field) => row[field] !== undefined).map((field) => [field, row[field]]))) : result;
      return Promise.resolve(single ? selected[0] || null : selected);
    },
    then(resolve, reject) { return Promise.resolve(single ? result[0] || null : result).then(resolve, reject); }
  };
  return q;
}

function createFixtureApp() {
  const state = { items: [], kits: [], users: [], calls: [], failCatalog: false, failIdentity: false };
  const names = ['ESP32 Development Board', 'DHT22 Temperature Sensor', 'OLED Display', 'Active Piezo Buzzer', 'Jumper Wires', 'IoT Starter Kit'];
  state.reset = () => {
    state.items = []; state.kits = []; state.calls = []; state.failCatalog = false; state.failIdentity = false;
    state.users = [
      { _id: adminId, firstName: 'LabKit', lastName: 'Admin', username: 'admin', email: 'admin@example.test', role: 'admin', createdAt: new Date('2026-01-01') },
      { _id: userId, firstName: 'Catalog', lastName: 'Customer', username: 'customer', email: 'customer@example.test', role: 'user', createdAt: new Date('2026-01-02') }
    ];
    for (let i = 0; i < 173; i++) {
      const row = {
        _id: (i + 1).toString(16).padStart(24, '0'),
        name: `${names[i % names.length]} ${String(i + 1).padStart(3, '0')}`,
        slug: `product-${i + 1}`, category: i % 3 === 0 ? 'Microcontrollers' : 'Sensors & Modules',
        tagline: 'Bench-tested hardware', description: 'Full editing description',
        price: 50 + i, stockQuantity: i % 16, maxPurchaseQuantity: 10,
        difficulty: 'Beginner', createdAt: new Date(2026, 0, 1, 0, i),
        imageUrl: 'data:image/png;base64,' + 'A'.repeat(4096),
        components: [{ name: 'Board', qty: 1 }], features: ['Tested'], privateField: 'not-for-client'
      };
      row.save = async () => row;
      (i % 2 ? state.kits : state.items).push(row);
    }
  };
  state.reset();
  const rowsFor = (model) => model === Item ? state.items : state.kits;
  for (const model of [Item, Kit]) {
    model.countDocuments = async (filter) => {
      state.calls.push({ op: 'count', model: model.modelName, filter });
      if (state.failCatalog) throw new Error('Simulated catalog outage');
      return rowsFor(model).filter((row) => matches(row, filter)).length;
    };
    model.findById = (id) => query(rowsFor(model).filter((row) => String(row._id) === String(id)), true);
    model.findByIdAndDelete = async (id) => {
      const key = model === Item ? 'items' : 'kits';
      const index = state[key].findIndex((row) => row._id === id);
      return index < 0 ? null : state[key].splice(index, 1)[0];
    };
    model.create = async (fields) => {
      const row = { ...fields, _id: 'dddddddddddddddddddddddd', createdAt: new Date() };
      state.items.push(row); return row;
    };
  }
  Item.aggregate = (pipeline) => ({ option: async () => {
    state.calls.push({ op: 'aggregate', pipeline });
    if (state.failCatalog) throw new Error('Simulated catalog outage');
    const projected = (rows, part, type) => rows.filter((row) => matches(row, part)).map((row) => {
      const fields = Object.keys(pipeline[1].$project);
      return Object.fromEntries(fields.map((field) => [field, field === 'productType' ? type : row[field]]));
    });
    const union = pipeline.find((part) => part.$unionWith).$unionWith;
    const combined = [...projected(state.items, pipeline[0].$match, 'item'), ...projected(state.kits, union.pipeline[0].$match, 'kit')];
    const sort = pipeline.find((part) => part.$sort).$sort;
    const skip = pipeline.find((part) => part.$skip !== undefined).$skip;
    const limit = pipeline.find((part) => part.$limit).$limit;
    return sorted(combined, sort).slice(skip, skip + limit);
  } });
  User.countDocuments = async () => state.users.length;
  User.findOne = (filter) => {
    if (state.failIdentity) return { lean: async () => { throw new Error('Simulated identity outage'); } };
    return query(state.users.filter((row) => matches(row, filter)), true);
  };
  User.find = (...args) => { state.calls.push({ op: 'usersFind' }); return query(state.users).select(args[1]); };
  User.findByIdAndDelete = async (id) => { state.users = state.users.filter((row) => row._id !== id); };

  const app = express();
  app.set('view engine', 'ejs'); app.set('views', path.join(__dirname, '../views'));
  app.use(express.urlencoded({ extended: false })); app.use(express.json()); app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('/__preview', (req, res) => {
    res.cookie('token', token(adminId, 'admin'), { httpOnly: true, sameSite: 'lax' });
    res.redirect('/admin');
  });
  app.use('/admin', require('../routes/adminRoute'));
  app.get('/login', (req, res) => res.status(401).send('Sign in required'));
  return { app, state, cookies, models: { Item, Kit, User } };
}

module.exports = { createFixtureApp, cookies, matches };
if (require.main === module) {
  const { app } = createFixtureApp();
  app.listen(4317, '127.0.0.1', () => console.log('Fixture admin preview: http://127.0.0.1:4317/__preview (173 sample products; no database connection)'));
}
