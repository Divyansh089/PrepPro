import { api, createUser, correctAnswersFor } from './helpers';
import { test } from 'node:test';
import assert from 'node:assert/strict';

async function finishAssessment(token: string) {
  const created = await api('POST', '/api/tests', {
    token,
    body: { mode: 'ASSESSMENT', category: 'QUANT', difficulty: 'EASY', count: 2 },
  });
  await api('POST', `/api/tests/${created.body.id}/submit`, {
    token,
    body: { answers: await correctAnswersFor(created.body.id) },
  });
}

test('a new user has an empty dashboard', async () => {
  const { token } = await createUser();
  const res = await api('GET', '/api/dashboard', { token });

  assert.equal(res.status, 200);
  assert.equal(res.body.totalPoints, 0);
  assert.equal(res.body.testsCompleted, 0);
  assert.equal(res.body.interviewsCompleted, 0);
  assert.deepEqual(res.body.recentActivity, []);
});

test('the dashboard updates right after a test (cache is cleared)', async () => {
  const { token } = await createUser();
  await api('GET', '/api/dashboard', { token }); // fills the cache with zeros

  await finishAssessment(token);

  const res = await api('GET', '/api/dashboard', { token });
  assert.equal(res.body.totalPoints, 100);
  assert.equal(res.body.testsCompleted, 1);
  assert.equal(res.body.avgScore, 100);
  assert.equal(res.body.recentActivity.length, 1);
  assert.ok(res.body.rank >= 1);
});

test('insights show accuracy per category and strengths', async () => {
  const { token } = await createUser();
  await finishAssessment(token);

  const res = await api('GET', '/api/insights', { token });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.categories, [{ category: 'QUANT', tests: 1, accuracy: 100 }]);
  assert.deepEqual(res.body.strengths, ['QUANT']);
  assert.deepEqual(res.body.weaknesses, []);
  assert.equal(res.body.scoreTrend.length, 1);
});

test('the leaderboard ranks users by points', async () => {
  const leader = await createUser('Leader');
  const newbie = await createUser('Newbie');
  await finishAssessment(leader.token);

  const res = await api('GET', '/api/leaderboard?limit=100', { token: leader.token });
  assert.equal(res.status, 200);
  assert.equal(res.body.me.points, 100);

  const row = res.body.top.find((r: { id: string }) => r.id === leader.user.id);
  assert.ok(row, 'leader is on the board');
  assert.equal(row.points, 100);
  assert.equal(row.rank, res.body.me.rank);

  // Users with 0 points are not on the board
  const empty = await api('GET', '/api/leaderboard', { token: newbie.token });
  assert.equal(empty.body.top.some((r: { id: string }) => r.id === newbie.user.id), false);
});
