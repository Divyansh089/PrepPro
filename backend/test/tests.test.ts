import { api, createUser, correctAnswersFor } from './helpers';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// These use the seeded question bank (npm run db:seed), since Gemini is off in tests

async function startTest(token: string, mode: 'PRACTICE' | 'ASSESSMENT', count = 3) {
  const res = await api('POST', '/api/tests', {
    token,
    body: { mode, category: 'QUANT', difficulty: 'EASY', count },
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

test('a new test hides the correct answers', async () => {
  const { token } = await createUser();
  const created = await startTest(token, 'PRACTICE');

  assert.equal(created.status, 'IN_PROGRESS');
  assert.equal(created.questions.length, 3);
  for (const q of created.questions) {
    assert.equal(q.correctAnswer, undefined);
    assert.equal(q.explanation, undefined);
  }
});

test('all correct answers on an assessment give 100 and add 100 points', async () => {
  const { token } = await createUser();
  const created = await startTest(token, 'ASSESSMENT');

  const res = await api('POST', `/api/tests/${created.id}/submit`, {
    token,
    body: { answers: await correctAnswersFor(created.id) },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'COMPLETED');
  assert.equal(res.body.score, 100);
  assert.equal(res.body.correctCount, 3);
  assert.ok(res.body.questions[0].correctAnswer, 'answers are shown after submit');

  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.body.totalPoints, 100);
});

test('grading ignores case and extra spaces, and skipped questions are wrong', async () => {
  const { token } = await createUser();
  const created = await startTest(token, 'PRACTICE', 2);
  const [first] = await correctAnswersFor(created.id);

  const res = await api('POST', `/api/tests/${created.id}/submit`, {
    token,
    body: { answers: [{ questionId: first.questionId, answer: first.answer.map((a) => `  ${a.toUpperCase()} `) }] },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.correctCount, 1);
  assert.equal(res.body.score, 50);
});

test('practice tests give no points', async () => {
  const { token } = await createUser();
  const created = await startTest(token, 'PRACTICE');

  await api('POST', `/api/tests/${created.id}/submit`, {
    token,
    body: { answers: await correctAnswersFor(created.id) },
  });

  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.body.totalPoints, 0);
});

test('a test cannot be submitted twice, so points are not added twice', async () => {
  const { token } = await createUser();
  const created = await startTest(token, 'ASSESSMENT');
  const body = { answers: await correctAnswersFor(created.id) };

  assert.equal((await api('POST', `/api/tests/${created.id}/submit`, { token, body })).status, 200);
  assert.equal((await api('POST', `/api/tests/${created.id}/submit`, { token, body })).status, 400);

  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.body.totalPoints, 100);
});

test("another user's test gives 404", async () => {
  const owner = await createUser();
  const stranger = await createUser();
  const created = await startTest(owner.token, 'PRACTICE');

  assert.equal((await api('GET', `/api/tests/${created.id}`, { token: stranger.token })).status, 404);
  assert.equal(
    (await api('POST', `/api/tests/${created.id}/submit`, { token: stranger.token, body: { answers: [] } })).status,
    404
  );
});

test('list shows my tests and filters by mode', async () => {
  const { token } = await createUser();
  await startTest(token, 'PRACTICE');
  await startTest(token, 'ASSESSMENT');

  const all = await api('GET', '/api/tests', { token });
  assert.equal(all.body.total, 2);

  const practice = await api('GET', '/api/tests?mode=PRACTICE', { token });
  assert.equal(practice.body.total, 1);
  assert.equal(practice.body.tests[0].mode, 'PRACTICE');
});

test('bad test input gives 400', async () => {
  const { token } = await createUser();
  const res = await api('POST', '/api/tests', {
    token,
    body: { mode: 'PRACTICE', category: 'NOT_A_CATEGORY', difficulty: 'EASY', count: 100 },
  });
  assert.equal(res.status, 400);
});
