import { Category, Difficulty, Prisma, Question } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import * as aiService from './ai.service';
import { CreateTestInput, SubmitTestInput, ListTestsInput } from '../validators/test.validator';

// ---------- Categories ----------

const CATEGORIES: Array<{ id: Category; label: string; group: 'Aptitude' | 'Technical' }> = [
  { id: 'QUANT', label: 'Quantitative Aptitude', group: 'Aptitude' },
  { id: 'VERBAL', label: 'Verbal Ability', group: 'Aptitude' },
  { id: 'APTITUDE', label: 'Logical Aptitude', group: 'Aptitude' },
  { id: 'REASONING', label: 'Reasoning & Puzzles', group: 'Aptitude' },
  { id: 'CODING', label: 'Coding & DSA', group: 'Technical' },
  { id: 'DBMS', label: 'Databases (DBMS)', group: 'Technical' },
  { id: 'OS', label: 'Operating Systems', group: 'Technical' },
  { id: 'NETWORKS', label: 'Computer Networks', group: 'Technical' },
  { id: 'CLOUD', label: 'Cloud & DevOps', group: 'Technical' },
  { id: 'SYSTEM_DESIGN', label: 'System Design', group: 'Technical' },
];

export function getCategories() {
  return {
    categories: CATEGORIES,
    difficulties: ['EASY', 'MEDIUM', 'HARD'] as Difficulty[],
  };
}

// ---------- Helpers ----------

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Random questions from the seeded bank.
// Same difficulty first, then other difficulties of the same category if there are not enough.
async function pickBankQuestions(category: Category, difficulty: Difficulty, count: number): Promise<string[]> {
  const bank = await prisma.question.findMany({
    where: { category, source: 'BANK' },
    select: { id: true, difficulty: true },
  });

  const sameDifficulty = shuffle(bank.filter((q) => q.difficulty === difficulty));
  const otherDifficulty = shuffle(bank.filter((q) => q.difficulty !== difficulty));

  return [...sameDifficulty, ...otherDifficulty].slice(0, count).map((q) => q.id);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

// Order does not matter, case and extra spaces do not matter
function isAnswerCorrect(userAnswer: string[], correctAnswer: string[]) {
  const user = userAnswer.map(normalize).filter(Boolean).sort();
  const correct = correctAnswer.map(normalize).sort();

  return user.length === correct.length && user.every((answer, i) => answer === correct[i]);
}

function fallbackFeedback(score: number, wrongCount: number): aiService.Feedback {
  return {
    strengths: score >= 70 ? ['Good accuracy on this topic.'] : score > 0 ? ['You got some questions right, keep building on them.'] : [],
    weaknesses: wrongCount > 0 ? [`You missed ${wrongCount} question(s). Read the explanations below.`] : [],
    suggestions: [
      score >= 80 ? 'Try a harder difficulty next.' : 'Practise this topic again at the same difficulty.',
      'Review the explanations for every question you got wrong.',
    ],
  };
}

// ---------- Response shape ----------

const testWithQuestions = {
  questions: { include: { question: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.TestInclude;

type TestWithQuestions = Prisma.TestGetPayload<{ include: typeof testWithQuestions }>;

// Correct answers and explanations are only sent after the test is submitted
function toTestResponse(test: TestWithQuestions) {
  const isCompleted = test.status === 'COMPLETED';

  return {
    id: test.id,
    mode: test.mode,
    category: test.category,
    difficulty: test.difficulty,
    status: test.status,
    totalQuestions: test.totalQuestions,
    correctCount: test.correctCount,
    score: test.score,
    feedback: test.feedback as aiService.Feedback | null,
    startedAt: test.startedAt,
    completedAt: test.completedAt,
    questions: test.questions.map((tq) => ({
      id: tq.question.id,
      order: tq.order,
      type: tq.question.type,
      text: tq.question.text,
      options: tq.question.options,
      ...(isCompleted && {
        userAnswer: tq.userAnswer,
        isCorrect: tq.isCorrect,
        correctAnswer: tq.question.correctAnswer,
        explanation: tq.question.explanation,
      }),
    })),
  };
}

async function findUserTest(userId: string, testId: string): Promise<TestWithQuestions> {
  // Filtering by userId too means other users' tests look like they don't exist
  const test = await prisma.test.findFirst({
    where: { id: testId, userId },
    include: testWithQuestions,
  });

  if (!test) {
    throw new AppError(404, 'Test not found');
  }

  return test;
}

// ---------- Main functions ----------

export async function createTest(userId: string, data: CreateTestInput) {
  const { mode, category, difficulty, count } = data;
  let questionIds: string[] = [];

  // 1. Try the AI first and save its questions so they can be reused later
  const aiQuestions = await aiService.generateQuestions(category, difficulty, count);

  if (aiQuestions) {
    const saved = await prisma.$transaction(
      aiQuestions.map((q) => prisma.question.create({ data: { ...q, category, difficulty, source: 'AI' } }))
    );
    questionIds = saved.map((q) => q.id);
  }

  // 2. Fill up with bank questions if the AI failed or gave too few
  if (questionIds.length < count) {
    const bankIds = await pickBankQuestions(category, difficulty, count - questionIds.length);
    questionIds = [...questionIds, ...bankIds];
  }

  if (questionIds.length === 0) {
    throw new AppError(503, 'No questions available for this category right now. Please try again later.');
  }

  const test = await prisma.test.create({
    data: {
      userId,
      mode,
      category,
      difficulty,
      totalQuestions: questionIds.length,
      questions: {
        create: questionIds.map((questionId, index) => ({ questionId, order: index + 1 })),
      },
    },
    include: testWithQuestions,
  });

  return toTestResponse(test);
}

export async function getTest(userId: string, testId: string) {
  const test = await findUserTest(userId, testId);
  return toTestResponse(test);
}

export async function listTests(userId: string, query: ListTestsInput) {
  const where: Prisma.TestWhereInput = { userId, ...(query.mode && { mode: query.mode }) };

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.test.count({ where }),
  ]);

  return {
    tests: tests.map((test) => ({
      id: test.id,
      mode: test.mode,
      category: test.category,
      difficulty: test.difficulty,
      status: test.status,
      totalQuestions: test.totalQuestions,
      correctCount: test.correctCount,
      score: test.score,
      startedAt: test.startedAt,
      completedAt: test.completedAt,
    })),
    page: query.page,
    limit: query.limit,
    total,
  };
}

export async function submitTest(userId: string, testId: string, data: SubmitTestInput) {
  const test = await findUserTest(userId, testId);

  if (test.status === 'COMPLETED') {
    throw new AppError(400, 'Test already submitted');
  }

  // questionId -> answer. Questions the user skipped count as wrong.
  const answers = new Map(data.answers.map((a) => [a.questionId, a.answer]));

  const graded = test.questions.map((tq) => {
    const userAnswer = answers.get(tq.questionId) ?? [];
    return {
      testQuestionId: tq.id,
      question: tq.question as Question,
      userAnswer,
      isCorrect: isAnswerCorrect(userAnswer, tq.question.correctAnswer),
    };
  });

  const correctCount = graded.filter((g) => g.isCorrect).length;
  const score = Math.round((correctCount / test.totalQuestions) * 100);
  const wrong = graded.filter((g) => !g.isCorrect);

  const feedback =
    (await aiService.generateFeedback({
      category: test.category,
      difficulty: test.difficulty,
      score,
      wrongAnswers: wrong.map((g) => ({
        text: g.question.text,
        userAnswer: g.userAnswer,
        correctAnswer: g.question.correctAnswer,
      })),
    })) ?? fallbackFeedback(score, wrong.length);

  await prisma.$transaction(async (tx) => {
    // Only completes the test if it is still in progress.
    // This stops two submits at the same time from adding points twice.
    const updated = await tx.test.updateMany({
      where: { id: test.id, status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED', correctCount, score, feedback, completedAt: new Date() },
    });

    if (updated.count === 0) {
      throw new AppError(400, 'Test already submitted');
    }

    for (const g of graded) {
      await tx.testQuestion.update({
        where: { id: g.testQuestionId },
        data: { userAnswer: g.userAnswer, isCorrect: g.isCorrect },
      });
    }

    // Only assessments count for the leaderboard
    if (test.mode === 'ASSESSMENT') {
      await tx.user.update({
        where: { id: userId },
        data: { totalPoints: { increment: score } },
      });
    }
  });

  return getTest(userId, testId);
}
