import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { demoLogin, failSmoke, withSmokeApi } from './smoke-http.js';

withSmokeApi(async (request) => {
  const search = (q: string, filters = '') => request(`/products?q=${encodeURIComponent(q)}${filters}`);
  for (const [q, id] of [['sofa', 1], ['Moonlight', 1], ['Navone', 1]] as const) {
    assert((await search(q)).data.some((p: { id: number }) => p.id === id), q);
  }
  const vietnamese = await search('Ghế bành', '&limit=100');
  const unaccented = await search('ghe banh', '&limit=100');
  assert(vietnamese.data.some((p: { id: number }) => p.id === 3));
  assert.deepEqual(vietnamese.data.map((p: { id: number }) => p.id), unaccented.data.map((p: { id: number }) => p.id));
  assert.equal((await search('zzznosuchproductzzz')).meta.total, 0);
  assert.equal((await search("' OR 1=1 --")).meta.total, 0);
  assert.equal((await search('%_')).meta.total, 0);
  assert((await search('So')).data.some((p: { id: number }) => p.id === 1));
  const filtered = await search('sofa', '&brandId=1&categoryId=6&maxPrice=185000000');
  assert.deepEqual(filtered.data.map((p: { id: number }) => p.id), [1]);
  const page1 = await search('sofa', '&sort=name&order=asc&limit=1');
  const page2 = await search('sofa', '&sort=name&order=asc&limit=1&page=2');
  assert.equal(page1.meta.total, page2.meta.total);
  assert.equal(page2.data.length, 1);
  assert.notEqual(page1.data[0].id, page2.data[0].id);
  await request('/products?sort=name%3BSELECT%201', { status: 400 });
  console.log('PASS catalog FULLTEXT, short literal fallback, filters, sorting and pagination');

  await request('/auth/login', { method: 'POST', body: { email: 'admin@luxury.com', password: 'incorrect' }, status: 401 });
  const admin = await demoLogin(request, 'admin@luxury.com');
  const sales = await demoLogin(request, 'sales.nam@luxury.com');
  for (const name of ['hoa', 'minh', 'linh']) {
    assert.equal((await demoLogin(request, `sales.${name}@luxury.com`)).user.role, 'sales');
  }
  const customers = [];
  for (const [email, tier, discount] of [
    ['customer.silver@gmail.com', 'Silver', 0],
    ['tu.le@design.vn', 'Gold', 5],
    ['customer.black@gmail.com', 'Black', 10],
  ] as const) {
    const login = await demoLogin(request, email);
    assert.equal(login.user.customer.tier.name, tier);
    assert.equal(login.user.customer.tier.discountPct, discount);
    customers.push(login);
  }
  const token = admin.accessToken;
  const { data: draftProduct } = await request('/admin/products', {
    token, method: 'POST', status: 201, body: { name: 'Smoke Orchid Draft', brandId: 1, categoryId: 6 },
  });
  try {
    const adminCatalog = await request('/products?q=Orchid&includeInactive=true', { token });
    assert(adminCatalog.data.some((p: { id: number }) => p.id === draftProduct.id), 'Admin must see products before variants are created');
    const publicCatalog = await request('/products?q=Orchid&includeInactive=true');
    assert(!publicCatalog.data.some((p: { id: number }) => p.id === draftProduct.id));
  } finally {
    await request(`/admin/products/${draftProduct.id}`, { token, method: 'DELETE' });
  }
  await request('/admin/users', { status: 401 });
  await request('/admin/users', { token: sales.accessToken, status: 403 });
  await request('/admin/reviews', { token: customers[0].accessToken, status: 403 });
  const users = await request('/admin/users?role=sales&limit=1&page=2', { token });
  assert.equal(users.meta.page, 2);
  assert(users.meta.total >= 4);
  assert.equal(users.data.length, 1);
  assert.equal(users.data[0].role, 'sales');
  assert.equal(typeof users.data[0].isActive, 'boolean');
  assert(!Object.keys(users.data[0]).some((key) => key.toLowerCase().includes('password')));
  const newUser = { fullName: 'Smoke Sales', email: `smoke-${randomUUID()}@example.com`, role: 'sales', password: 'Sales smoke test only' };
  await request('/admin/users', { token, method: 'POST', body: { ...newUser, role: 'customer' }, status: 400 });
  const { data: created } = await request('/admin/users', { token, method: 'POST', body: newUser, status: 201 });
  try {
    const duplicate = await request('/admin/users', { token, method: 'POST', body: newUser, status: 409 });
    assert.equal(duplicate.error.code, 'DUPLICATE_EMAIL');
    const found = await request(`/admin/users?q=${encodeURIComponent(newUser.email)}&role=sales`, { token });
    assert.equal(found.meta.total, 1);
    assert.equal(found.data[0].id, created.id);
    const session = await demoLogin(request, newUser.email, newUser.password);
    const changeStatus = (id: number, isActive: boolean, status = 200) =>
      request(`/admin/users/${id}/status`, { token, method: 'PATCH', body: { isActive }, status });
    await changeStatus(admin.user.id, false, 409);
    await changeStatus(created.id, false);
    await request('/auth/login', { method: 'POST', body: { email: newUser.email, password: newUser.password }, status: 401 });
    await request('/auth/me', { token: session.accessToken, status: 401 });
    await changeStatus(created.id, true);
    await demoLogin(request, newUser.email, newUser.password);
  } finally {
    await pool.execute('DELETE FROM users WHERE id = ?', [created.id]);
  }
  console.log('PASS demo logins, role enforcement, A09 creation, duplicate protection and account lock/unlock');

  const { data: [review] } = await request('/admin/reviews?limit=1', { token });
  assert(review?.customerName && review?.productName);
  const reviewPage = await request(`/admin/reviews?limit=1&page=2&rating=${review.rating}`, { token });
  assert(reviewPage.meta.total > 1);
  assert.equal(reviewPage.data[0].rating, review.rating);
  const match = await request(`/admin/reviews?q=${encodeURIComponent(review.productName)}&rating=${review.rating}`, { token });
  assert(match.data.some((row: { id: number }) => row.id === review.id));
  const otherCustomer = customers.find(({ user }) => user.customer.id !== review.customerId);
  assert(otherCustomer);
  await request(`/reviews/item/${review.orderItemId}`, { token: otherCustomer.accessToken, status: 403 });
  await request(`/reviews/${review.id}`, { token: otherCustomer.accessToken, method: 'DELETE', status: 403 });
  await request(`/reviews/${review.id}junk`, { token, method: 'DELETE', status: 400 });
  await request(`/reviews/${review.id}`, { token, method: 'DELETE' });
  const after = await request(`/admin/reviews?q=${encodeURIComponent(review.productName)}&rating=${review.rating}`, { token });
  assert.equal(after.meta.total, match.meta.total - 1);
  assert(!after.data.some((row: { id: number }) => row.id === review.id));
  console.log('PASS A10 list, filter, pagination, ownership and Admin moderation');
}).catch(failSmoke);
