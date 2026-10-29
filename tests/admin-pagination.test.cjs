const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createFixtureApp } = require('./admin-fixtures.cjs');
const { readState, searchFilter } = require('../services/adminCatalog');
const fixture = createFixtureApp();
let server, base;
before(async () => {
  server = await new Promise((resolve) => { const s = fixture.app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => fixture.state.reset());
const request = (route, { identity = 'admin', ...options } = {}) => fetch(base + route, {
  redirect: 'manual', ...options, headers: { ...(identity ? { Cookie: fixture.cookies[identity] } : {}), ...options.headers }
});
const post = (route, body) => request(route, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });
const rowCount = (html) => (html.match(/class="bundle-row"/g) || []).length;

test('limits the combined catalog to 12 globally sorted products with full totals', async () => {
  const response = await request('/admin'); const html = await response.text();
  assert.equal(response.status, 200); assert.equal(rowCount(html), 12);
  assert.match(html, /Showing 1–12 of 173 products/);
  const ids = [...html.matchAll(/class="bundle-row" data-id="([a-f0-9]+)"/g)].map((match) => parseInt(match[1], 16));
  assert.deepEqual(ids, Array.from({ length: 12 }, (_, i) => 173 - i));
  assert.match(html, /data-type="item"/); assert.match(html, /data-type="kit"/);
  assert.equal(/data:image|js-item-data|Full editing description|customer@example.test/.test(html), false);
  assert.equal(fixture.state.calls.filter((call) => call.op === 'usersFind').length, 0);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('paginates and clamps invalid or exhausted pages', async () => {
  let html = await (await request('/admin?page=2')).text();
  assert.match(html, /Showing 13–24 of 173/); assert.equal(rowCount(html), 12);
  html = await (await request('/admin?page=999999')).text();
  assert.match(html, /Showing 169–173 of 173/); assert.equal(rowCount(html), 5);
  html = await (await request('/admin?page=-1')).text(); assert.match(html, /Showing 1–12/);
  assert.deepEqual(readState({ page: ['2'], q: { $ne: '' } }), { q: '', page: 1, tab: 'products' });
  assert.equal(readState({ q: 'x'.repeat(500) }).q.length, 100);
});

test('finds off-page products and preserves the search in pagination links', async () => {
  let html = await (await request('/admin?q=' + encodeURIComponent('Development Board 001'))).text();
  assert.equal(html.includes('Development Board 001'), true);
  html = await (await request('/admin?q=ESP32&page=2')).text();
  assert.match(html, /Showing 13–24/); assert.match(html, /q=ESP32&amp;page=3/);
  assert.equal(rowCount(html), 12);
});

test('treats regex and HTML as literal search text and distinguishes no matches', async () => {
  assert.equal(searchFilter('.*').$or[0].name.$regex, '\\.\\*');
  const html = await (await request('/admin?q=' + encodeURIComponent('<script>.*'))).text();
  assert.match(html, /No matching products/); assert.equal(rowCount(html), 0);
  assert.doesNotMatch(html, /value="<script>/); assert.match(html, /&lt;script&gt;/);
});

test('loads editor details only on request and excludes unrelated fields', async () => {
  const product = fixture.state.kits[0];
  const response = await request(`/admin/products/kit/${product._id}`);
  const data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.description, 'Full editing description');
  assert.equal(data.privateField, undefined); assert.ok(data.imageUrl);
  assert.equal((await request('/admin/products/users/' + product._id)).status, 400);
  assert.equal((await request('/admin/products/item/not-an-id')).status, 400);
  assert.equal((await request('/admin/products/item/eeeeeeeeeeeeeeeeeeeeeeee')).status, 404);
});

test('rejects anonymous, ordinary, stale-role and deleted-account access over HTTP', async () => {
  for (const identity of [null, 'user', 'staleAdmin', 'removedAdmin']) {
    for (const route of ['/admin', '/admin?q=ESP32&page=2', '/admin/products/item/000000000000000000000001']) {
      const response = await request(route, { identity });
      assert.ok([302, 403].includes(response.status), `${identity}: ${route}`);
      assert.doesNotMatch(await response.text(), /Development Board|Full editing description/);
    }
  }
  fixture.state.failIdentity = true;
  assert.equal((await request('/admin')).status, 403);
});

test('non-admin mutations are refused without changing product data', async () => {
  for (const identity of [null, 'user', 'staleAdmin', 'removedAdmin']) {
    const before = JSON.stringify(fixture.state.items);
    for (const route of ['/admin/items', '/admin/items/000000000000000000000001/edit', '/admin/items/000000000000000000000001/delete']) {
      const response = await request(route, { identity, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'name=Changed' });
      assert.ok([302, 403].includes(response.status));
    }
    assert.equal(JSON.stringify(fixture.state.items), before);
  }
});

test('preserves search/page after editing and deleting and clamps a deleted last page', async () => {
  const product = fixture.state.items[0];
  const edited = await post(`/admin/items/${product._id}/edit`, { name: 'Updated board', description: 'Updated description', price: '95', stockQuantity: '7', q: 'board', page: '2' });
  assert.equal(edited.status, 302); assert.equal(edited.headers.get('location'), '/admin?tab=products&q=board&page=2&updated=1');
  const deleted = await post(`/admin/items/${product._id}/delete`, { q: 'board', page: '2' });
  assert.equal(deleted.headers.get('location'), '/admin?tab=products&q=board&page=2');
  fixture.state.items = fixture.state.items.slice(0, 13); fixture.state.kits = [];
  const last = fixture.state.items[12];
  await post(`/admin/items/${last._id}/delete`, { page: '2' });
  const html = await (await request('/admin?page=2')).text();
  assert.match(html, /Showing 1–12 of 12/); assert.equal(rowCount(html), 12);
});

test('validation failures retain 12 rows and the edit target instead of creating a product', async () => {
  const product = fixture.state.items[0];
  let response = await post(`/admin/items/${product._id}/edit`, { name: '', description: '', page: '2' });
  let html = await response.text();
  assert.equal(response.status, 400); assert.equal(rowCount(html), 12);
  assert.match(html, new RegExp(`action="/admin/items/${product._id}/edit"`));
  response = await post('/admin/items', { name: '', description: '', page: '2' });
  html = await response.text(); assert.equal(response.status, 400); assert.equal(rowCount(html), 12);
});

test('creates a product without losing search and returns to page one', async () => {
  const response = await post('/admin/items', { name: 'New board', description: 'A board', imageUrl: 'https://example.test/board.png', price: '120', stockQuantity: '5', page: '3', q: 'board' });
  assert.equal(response.status, 302); assert.equal(response.headers.get('location'), '/admin?tab=products&q=board&created=1');
  assert.equal(fixture.state.items.at(-1).name, 'New board');
});

test('upload validation also uses the bounded list and preserves the requested page', async () => {
  const body = new FormData();
  body.set('name', 'Invalid upload'); body.set('page', '2');
  body.set('itemImage', new Blob(['not an image'], { type: 'text/plain' }), 'notes.txt');
  const response = await request('/admin/items', { method: 'POST', body });
  const html = await response.text();
  assert.equal(response.status, 400); assert.equal(rowCount(html), 12);
  assert.equal(html.includes('Showing 13–24 of 173'), true);
  assert.equal(fixture.state.items.length + fixture.state.kits.length, 173);
});

test('empty catalogs and kits-only catalogs remain reachable without phantom rows', async () => {
  fixture.state.items = [];
  let html = await (await request('/admin?page=2')).text();
  assert.equal(rowCount(html), 12); assert.equal(html.includes('data-type="item"'), false);
  fixture.state.kits = [];
  html = await (await request('/admin')).text();
  assert.equal(rowCount(html), 0); assert.equal(html.includes('No products yet'), true);
});

test('stable ordering prevents duplicates across adjacent pages with equal timestamps', async () => {
  for (const row of [...fixture.state.items, ...fixture.state.kits]) row.createdAt = new Date('2026-01-01');
  const first = await (await request('/admin')).text();
  const second = await (await request('/admin?page=2')).text();
  const ids = (html) => [...html.matchAll(/class="bundle-row" data-id="([a-f0-9]+)"/g)].map((match) => parseInt(match[1], 16));
  assert.deepEqual(ids(first), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(ids(second), Array.from({ length: 12 }, (_, i) => i + 13));
});

test('loads Accounts separately and renders failures as failures, not empty catalogs', async () => {
  let response = await request('/admin?tab=accounts'); let html = await response.text();
  assert.equal(response.status, 200); assert.equal(rowCount(html), 0); assert.match(html, /admin@example.test/);
  assert.equal(fixture.state.calls.filter((call) => call.op === 'aggregate').length, 0);
  fixture.state.failCatalog = true;
  response = await request('/admin'); html = await response.text();
  assert.equal(response.status, 503); assert.match(html, /Catalog unavailable/); assert.doesNotMatch(html, /No products yet/);
});
