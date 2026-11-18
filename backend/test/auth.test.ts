import { api, createUser } from './helpers';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('GET /health returns ok', async () => {
  const res = await api('GET', '/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('signup returns a token and never the password', async () => {
  const { token, user } = await createUser('Asha');
  assert.ok(token);
  assert.equal(user.name, 'Asha');
  assert.equal(user.passwordHash, undefined);
});

test('signup with an email that is already used gives 409', async () => {
  const { email } = await createUser();
  const res = await api('POST', '/api/auth/signup', { body: { name: 'Other', email, password: 'password123' } });
  assert.equal(res.status, 409);
});

test('signup with bad input gives 400 with field errors', async () => {
  const res = await api('POST', '/api/auth/signup', { body: { name: 'A', email: 'not-an-email', password: '1' } });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length >= 3);
});

test('login works with the right password and fails with a wrong one', async () => {
  const { email, password } = await createUser();

  const ok = await api('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const wrong = await api('POST', '/api/auth/login', { body: { email, password: 'wrong-password' } });
  assert.equal(wrong.status, 401);
});

test('GET /auth/me needs a valid token', async () => {
  const { token, user } = await createUser();

  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.body.id, user.id);

  assert.equal((await api('GET', '/api/auth/me')).status, 401);
  assert.equal((await api('GET', '/api/auth/me', { token: 'forged.token.value' })).status, 401);
});

test('every protected endpoint gives 401 without a token', async () => {
  const endpoints = [
    ['PUT', '/api/users/me'],
    ['GET', '/api/tests'],
    ['POST', '/api/tests'],
    ['GET', '/api/interviews'],
    ['POST', '/api/interviews'],
    ['GET', '/api/dashboard'],
    ['GET', '/api/insights'],
    ['GET', '/api/leaderboard'],
  ];

  for (const [method, path] of endpoints) {
    const res = await api(method, path);
    assert.equal(res.status, 401, `${method} ${path}`);
  }
});

test('public profile does not show the email', async () => {
  const viewer = await createUser();
  const other = await createUser('Other Person');

  const res = await api('GET', `/api/users/${other.user.id}`, { token: viewer.token });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Other Person');
  assert.equal(res.body.email, undefined);
});
