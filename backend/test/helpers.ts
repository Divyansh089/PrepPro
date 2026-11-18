// Shared setup for the API tests.
// Tests run against a real PostgreSQL + Redis (docker compose locally, service containers in CI).

import './setup-env';
import { after, before } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { redis } from '../src/config/redis';

let server: Server;
let baseUrl = '';
const createdUserIds: string[] = [];

// Start the app on a random free port before the tests, and clean everything up after
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  // Deleting a user also deletes their tests and interviews (onDelete: Cascade)
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await redis.zrem('leaderboard', ...createdUserIds).catch(() => {});
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
  redis.disconnect();
});

// Small fetch wrapper: returns the status and the JSON body
export async function api(method: string, path: string, options: { token?: string; body?: unknown } = {}) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token && { Authorization: `Bearer ${options.token}` }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// Signs up a fresh user with a unique email. It is deleted after the tests.
export async function createUser(name = 'Test User') {
  const email = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'password123';
  const res = await api('POST', '/api/auth/signup', { body: { name, email, password } });

  if (res.status !== 201) {
    throw new Error(`Signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  createdUserIds.push(res.body.user.id);
  return { token: res.body.token as string, user: res.body.user, email, password };
}

// The correct answers for a test, read straight from the database
export async function correctAnswersFor(testId: string) {
  const questions = await prisma.testQuestion.findMany({
    where: { testId },
    include: { question: true },
  });
  return questions.map((tq) => ({ questionId: tq.questionId, answer: tq.question.correctAnswer }));
}
