import { getDatabase } from '../../config/database';
import { User } from '../../models/User';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'preppro_jwt_secret_key_9f8d7c6b5a4e3f210192837465_prod';

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.userId) return null;
      const db = await getDatabase();
      const user = await db.collection<User>('users').findOne({ _id: new ObjectId(context.userId) });
      if (!user) return null;
      return {
        id: user._id.toString(),
        ...user,
      };
    },

    user: async (_: any, { id }: { id: string }) => {
      const db = await getDatabase();
      const user = await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
      if (!user) return null;
      return {
        id: user._id.toString(),
        ...user,
      };
    },

    dashboardSummary: async (_: any, __: any, context: any) => {
      let user = null;
      if (context.userId) {
        const db = await getDatabase();
        const found = await db.collection<User>('users').findOne({ _id: new ObjectId(context.userId) });
        if (found) {
          user = {
            id: found._id.toString(),
            ...found,
          };
        }
      }

      return {
        user,
        stats: {
          rank: user?.rank || 42,
          totalScore: user?.totalScore || 1850,
          testsCompleted: user?.testsCompleted || 12,
          questionsSolved: user?.questionsSolved || 84,
          studyHours: user?.studyHours || 28.5,
          accuracy: user?.accuracy || 88.5,
          avgTime: user?.avgTime || '1.8 min',
        },
        recentActivity: [
          'Completed System Design Mock Interview (Score: 92%)',
          'Solved 5 Binary Tree Practice Questions',
          'Achieved Rank #42 on Global Leaderboard',
        ],
      };
    },

    insightsData: async (_: any, __: any, context: any) => {
      return {
        readinessScore: 84,
        strengths: [
          'Data Structures & Algorithms',
          'System Architecture & Scalability',
          'Clear Technical Communication',
        ],
        weaknesses: [
          'Dynamic Programming Edge Cases',
          'Low-Level Thread Synchronization',
        ],
        recommendedTopics: [
          'Advanced Graph Algorithms (Dijkstra/A*)',
          'Distributed Caching & Redis Partitioning',
          'Concurrency Models & Event Loops',
        ],
      };
    },

    leaderboard: async (_: any, { limit = 20 }: { limit?: number }) => {
      const db = await getDatabase();
      const users = await db
        .collection<User>('users')
        .find({})
        .sort({ totalScore: -1, rank: 1 })
        .limit(limit)
        .toArray();

      return users.map((u, idx) => ({
        id: u._id.toString(),
        name: u.name || 'Anonymous Candidate',
        avatar: u.avatar || '',
        rank: u.rank || idx + 1,
        totalScore: u.totalScore || 0,
        testsCompleted: u.testsCompleted || 0,
        accuracy: u.accuracy || 0,
        targetRole: u.targetRole || 'Software Engineer',
        college: u.college || '',
      }));
    },

    interviewSession: async (_: any, { id }: { id: string }) => {
      const db = await getDatabase();
      const session = await db.collection('interview_sessions').findOne({ _id: new ObjectId(id) });
      if (!session) return null;
      return {
        id: session._id.toString(),
        ...session,
      };
    },

    interviewHistory: async (_: any, __: any, context: any) => {
      if (!context.userId) return [];
      const db = await getDatabase();
      const sessions = await db
        .collection('interview_sessions')
        .find({ userId: context.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      return sessions.map((s) => ({
        id: s._id.toString(),
        ...s,
      }));
    },

    practiceQuestions: async (_: any, { category, difficulty }: any) => {
      const query: any = {};
      if (category && category !== 'all') query.category = category;
      if (difficulty && difficulty !== 'all') query.difficulty = difficulty;

      const db = await getDatabase();
      const questions = await db.collection('questions').find(query).limit(20).toArray();

      return questions.map((q) => ({
        id: q._id.toString(),
        ...q,
      }));
    },

    assessmentTracks: async () => {
      return [
        {
          id: 'track-fe',
          title: 'Frontend Engineering Track',
          description: 'React, Next.js, HTML/CSS, and Web Performance',
          durationMinutes: 45,
          questionCount: 15,
        },
        {
          id: 'track-be',
          title: 'Backend Systems Track',
          description: 'Node.js, Express, Databases, and API Design',
          durationMinutes: 60,
          questionCount: 20,
        },
        {
          id: 'track-dsa',
          title: 'DSA & Algorithms Track',
          description: 'Data structures, Big-O, Dynamic Programming',
          durationMinutes: 45,
          questionCount: 10,
        },
      ];
    },
  },

  Mutation: {
    signup: async (_: any, { name, email, password }: any) => {
      const db = await getDatabase();
      const usersCollection = db.collection<User>('users');
      const existing = await usersCollection.findOne({ email });
      if (existing) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser: Omit<User, '_id'> = {
        name,
        email,
        password: hashedPassword,
        rank: 100,
        totalScore: 0,
        testsCompleted: 0,
        questionsSolved: 0,
        studyHours: 0,
        accuracy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser as any);
      const token = jwt.sign({ userId: result.insertedId.toString(), email }, JWT_SECRET, { expiresIn: '7d' });

      return {
        token,
        user: {
          id: result.insertedId.toString(),
          ...newUser,
        },
      };
    },

    login: async (_: any, { email, password }: any) => {
      const db = await getDatabase();
      const user = await db.collection<User>('users').findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new Error('Invalid email or password');
      }

      const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      return {
        token,
        user: {
          id: user._id.toString(),
          ...user,
        },
      };
    },

    updateProfile: async (_: any, args: any, context: any) => {
      if (!context.userId) throw new Error('Not authenticated');
      const db = await getDatabase();
      const result = await db.collection<User>('users').findOneAndUpdate(
        { _id: new ObjectId(context.userId) },
        { $set: { ...args, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!result) throw new Error('User not found');
      return {
        id: result._id.toString(),
        ...result,
      };
    },

    createInterviewSession: async (_: any, args: any, context: any) => {
      const db = await getDatabase();
      const session = {
        userId: context.userId || 'guest',
        status: 'active',
        currentPhase: 'intro',
        currentQuestionIndex: 0,
        config: args,
        createdAt: new Date(),
      };
      const result = await db.collection('interview_sessions').insertOne(session as any);
      return {
        id: result.insertedId.toString(),
        ...session,
      };
    },

    submitInterviewAnswer: async (_: any, { sessionId, content }: any) => {
      const responseMsg = {
        id: `msg-${Date.now()}`,
        role: 'interviewer',
        content: `Good answer! Regarding your point on "${content.slice(0, 30)}...", how would you handle high load or edge cases?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return responseMsg;
    },

    completeInterviewSession: async (_: any, { sessionId }: any) => {
      const breakdown = {
        overallScore: 88,
        technicalScore: 90,
        communicationScore: 85,
        problemSolvingScore: 89,
        feedback: 'Great performance! Clear explanations and fast code execution.',
      };

      const db = await getDatabase();
      await db.collection('interview_sessions').updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { status: 'completed', score: breakdown } }
      );

      return breakdown;
    },

    generatePracticeSession: async (_: any, { category, difficulty, count }: any) => {
      return {
        id: `practice-${Date.now()}`,
        questions: [
          {
            id: 'q-1',
            title: 'Two Sum Problem',
            description: 'Find two indices in array that add up to target.',
            difficulty: difficulty || 'Medium',
            category: category || 'Algorithms',
            tags: ['Array', 'Hash Table'],
            sampleInput: '[2,7,11,15], 9',
            sampleOutput: '[0,1]',
          },
        ],
      };
    },

    generateAssessmentSession: async (_: any, { trackId }: any) => {
      return {
        id: `assess-${Date.now()}`,
        trackId,
        questions: [
          {
            id: 'aq-1',
            text: 'What is the worst-case time complexity of QuickSort?',
            options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(1)'],
            category: 'Algorithms',
          },
        ],
      };
    },
  },
};
