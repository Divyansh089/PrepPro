import { api, createUser } from './helpers';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Gemini is off in tests, so the built-in fallback questions and scores are used

async function startInterview(token: string) {
  const res = await api('POST', '/api/interviews', {
    token,
    body: { role: 'Backend Developer', level: 'FRESHER', type: 'TECHNICAL', language: 'javascript' },
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

test('a new interview starts with one AI message', async () => {
  const { token } = await createUser();
  const interview = await startInterview(token);

  assert.equal(interview.status, 'IN_PROGRESS');
  assert.equal(interview.messages.length, 1);
  assert.equal(interview.messages[0].sender, 'AI');
});

test('sending an answer saves it and returns the AI reply', async () => {
  const { token } = await createUser();
  const interview = await startInterview(token);

  const res = await api('POST', `/api/interviews/${interview.id}/messages`, {
    token,
    body: { content: 'I would use a hash map.', code: 'const m = new Map();', language: 'javascript' },
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.userMessage.sender, 'USER');
  assert.equal(res.body.userMessage.code, 'const m = new Map();');
  assert.equal(res.body.aiMessage.sender, 'AI');

  const full = await api('GET', `/api/interviews/${interview.id}`, { token });
  assert.equal(full.body.messages.length, 3);
});

test('ending an interview scores it and adds the points once', async () => {
  const { token } = await createUser();
  const interview = await startInterview(token);
  await api('POST', `/api/interviews/${interview.id}/messages`, { token, body: { content: 'My answer' } });

  const ended = await api('POST', `/api/interviews/${interview.id}/end`, { token });
  assert.equal(ended.status, 200);
  assert.equal(ended.body.status, 'COMPLETED');
  assert.ok(ended.body.overallScore > 0);

  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.body.totalPoints, ended.body.overallScore);

  // Already ended: no more messages, no second end
  assert.equal((await api('POST', `/api/interviews/${interview.id}/end`, { token })).status, 400);
  assert.equal(
    (await api('POST', `/api/interviews/${interview.id}/messages`, { token, body: { content: 'late' } })).status,
    400
  );
});

test('ending without answering gives a score of 0', async () => {
  const { token } = await createUser();
  const interview = await startInterview(token);

  const ended = await api('POST', `/api/interviews/${interview.id}/end`, { token });
  assert.equal(ended.body.overallScore, 0);
});

test("another user's interview gives 404", async () => {
  const owner = await createUser();
  const stranger = await createUser();
  const interview = await startInterview(owner.token);

  assert.equal((await api('GET', `/api/interviews/${interview.id}`, { token: stranger.token })).status, 404);
  assert.equal((await api('POST', `/api/interviews/${interview.id}/end`, { token: stranger.token })).status, 404);
});

test('bad interview input gives 400', async () => {
  const { token } = await createUser();
  const res = await api('POST', '/api/interviews', {
    token,
    body: { role: 'X', level: 'GOD', type: 'TECHNICAL', language: 'rust' },
  });
  assert.equal(res.status, 400);
});
