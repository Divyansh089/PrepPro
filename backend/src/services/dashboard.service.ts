import { Category } from '@prisma/client';
import { prisma } from '../config/prisma';
import { cached } from '../utils/cache';
import { getUserRank } from './leaderboard.service';

const STRONG = 70; // average of 70 or more = strength
const WEAK = 50; // average of 50 or less = weakness

const round = (value: number | null) => (value === null ? 0 : Math.round(value));

// ---------- Dashboard ----------

async function buildDashboardStats(userId: string) {
  const [tests, interviews, recentTests, recentInterviews] = await Promise.all([
    prisma.test.aggregate({
      where: { userId, status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { score: true },
    }),
    prisma.interview.aggregate({
      where: { userId, status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { overallScore: true },
    }),
    prisma.test.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
    prisma.interview.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
  ]);

  // Average over every finished test and interview
  const finished = tests._count._all + interviews._count._all;
  const scoreSum = (tests._sum.score ?? 0) + (interviews._sum.overallScore ?? 0);

  // Mix the last tests and interviews, newest first
  const recentActivity = [
    ...recentTests.map((t) => ({
      type: t.mode, // PRACTICE or ASSESSMENT
      id: t.id,
      title: t.category as string,
      score: t.score,
      completedAt: t.completedAt!,
    })),
    ...recentInterviews.map((i) => ({
      type: 'INTERVIEW' as const,
      id: i.id,
      title: i.role,
      score: i.overallScore ?? 0,
      completedAt: i.completedAt!,
    })),
  ]
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, 5);

  return {
    testsCompleted: tests._count._all,
    interviewsCompleted: interviews._count._all,
    avgScore: finished === 0 ? 0 : Math.round(scoreSum / finished),
    recentActivity,
  };
}

// GET /api/dashboard
export async function getDashboard(userId: string) {
  const [stats, { rank, points }] = await Promise.all([
    cached(`dashboard:${userId}`, () => buildDashboardStats(userId)),
    // Not cached, so the rank is always up to date
    getUserRank(userId),
  ]);

  return { totalPoints: points, rank, ...stats };
}

// ---------- Insights ----------

async function buildInsights(userId: string) {
  const [byCategory, lastTests, interviews] = await Promise.all([
    prisma.test.groupBy({
      by: ['category'],
      where: { userId, status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { correctCount: true, totalQuestions: true },
    }),
    prisma.test.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
    prisma.interview.aggregate({
      where: { userId, status: 'COMPLETED' },
      _count: { _all: true },
      _avg: { overallScore: true, technicalScore: true, communicationScore: true, problemSolvingScore: true },
    }),
  ]);

  // Accuracy = correct answers / questions, over every finished test in that category
  const categories = byCategory
    .map((row) => ({
      category: row.category as Category,
      tests: row._count._all,
      accuracy: Math.round(((row._sum.correctCount ?? 0) / (row._sum.totalQuestions || 1)) * 100),
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  return {
    categories,
    strengths: categories.filter((c) => c.accuracy >= STRONG).map((c) => c.category),
    weaknesses: categories.filter((c) => c.accuracy <= WEAK).map((c) => c.category),
    // Oldest first, so it reads left to right on a chart
    scoreTrend: lastTests.reverse().map((t) => ({
      id: t.id,
      category: t.category,
      mode: t.mode,
      score: t.score,
      completedAt: t.completedAt,
    })),
    interviews: {
      completed: interviews._count._all,
      overall: round(interviews._avg.overallScore),
      technical: round(interviews._avg.technicalScore),
      communication: round(interviews._avg.communicationScore),
      problemSolving: round(interviews._avg.problemSolvingScore),
    },
  };
}

// GET /api/insights
export async function getInsights(userId: string) {
  return cached(`insights:${userId}`, () => buildInsights(userId));
}
