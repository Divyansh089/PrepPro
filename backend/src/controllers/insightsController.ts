import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { User } from '../models/User';
import { AssessmentSession } from '../models/Assessment';
import { PracticeSession } from '../models/Practice';
import { InterviewSession } from '../models/Interview';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getInsightsOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = await getDatabase();

    const users = db.collection<User>('users');
    const assessments = db.collection<AssessmentSession>('assessmentSessions');

    const [user, assessmentHist] = await Promise.all([
      users.findOne({ _id: new ObjectId(userId) }),
      assessments
        .find({ userId, status: 'completed' }, { projection: { score: 1, accuracy: 1, topic: 1, updatedAt: 1, createdAt: 1 } })
        .sort({ updatedAt: -1 })
        .limit(20)
        .toArray()
    ]);

    const history = assessmentHist || [];

    const latest = history[0];
    const previous = history[1];
    const latestScore = latest?.score ?? 0;
    const improvement = previous ? (latestScore - (previous.score ?? 0)) : 0;
    const velocity = previous ? (((latestScore - (previous.score ?? 0)) / Math.max(1, previous.score ?? 1)) * 100) : 0;
    const avgScore = history.length ? Math.round(history.reduce((s, h) => s + (h.score ?? 0), 0) / history.length) : 0;
    const avgAcc = history.length ? (history.reduce((s, h) => s + (h.accuracy ?? 0), 0) / history.length) : 0;

    const targetScore = user?.goals?.targetScore ?? 0;
    const weeklyHours = user?.goals?.weeklyHours ?? 0;
    const predictedScore = Math.min(100, Math.max(0, Math.round(avgScore + Math.max(0, improvement * 1.5))));

    const progressSeries = history
      .slice()
      .reverse()
      .map((h, idx) => ({
        label: new Date(h.updatedAt || h.createdAt || new Date()).toISOString(),
        score: Math.round(h.score ?? 0),
        testsTaken: idx + 1,
        hoursStudied: Math.max(0, Math.round((h.accuracy ?? 0) * 20))
      }));

    const byTopic = new Map<string, { total: number; count: number }>();
    history.forEach(h => {
      const key = h.topic || 'unknown';
      const obj = byTopic.get(key) || { total: 0, count: 0 };
      obj.total += (h.score ?? 0);
      obj.count += 1;
      byTopic.set(key, obj);
    });
    const skillHeatmap = Array.from(byTopic.entries()).map(([topic, { total, count }]) => ({
      topic,
      score: count ? Math.round(total / count) : 0
    }));

    const weaknesses = skillHeatmap
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, 4)
      .map(w => ({
        area: w.topic,
        currentScore: w.score,
        attempts: history.filter(h => h.topic === w.topic).length,
        avgScore: w.score,
        improvement: 0,
        recommendation: `Practice more on ${w.topic} with focused drills`
      }));

    res.json({
      overview: {
        latestScore,
        improvement,
        velocity: Math.round(velocity),
        predictedScore,
        averageScore: avgScore,
        averageAccuracy: avgAcc
      },
      goals: { targetScore, weeklyHours },
      progressSeries,
      skillHeatmap,
      weaknesses
    });
  } catch (error) {
    console.error('Insights overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
