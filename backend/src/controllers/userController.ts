import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { User, UserStats, UserResponse } from '../models/User';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { 
      name, 
      bio, 
      college, 
      gradYear, 
      targetRole,
      avatar,
      skills,
      achievements,
      activityData 
    } = req.body;

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (college !== undefined) updateData.college = college;
    if (gradYear !== undefined) updateData.gradYear = gradYear;
    if (targetRole !== undefined) updateData.targetRole = targetRole;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (skills !== undefined) updateData.skills = skills;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (activityData !== undefined) updateData.activityData = activityData;

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userResponse: UserResponse = {
      id: result._id?.toString() || '',
      email: result.email,
      name: result.name,
      bio: result.bio,
      college: result.college,
      gradYear: result.gradYear,
      targetRole: result.targetRole,
      avatar: result.avatar,
    };

    res.status(200).json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { 
      rank, 
      totalScore, 
      testsCompleted, 
      questionsSolved, 
      studyHours, 
      accuracy, 
      avgTime 
    }: Partial<UserStats> = req.body;

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (rank !== undefined) updateData.rank = rank;
    if (totalScore !== undefined) updateData.totalScore = totalScore;
    if (testsCompleted !== undefined) updateData.testsCompleted = testsCompleted;
    if (questionsSolved !== undefined) updateData.questionsSolved = questionsSolved;
    if (studyHours !== undefined) updateData.studyHours = studyHours;
    if (accuracy !== undefined) updateData.accuracy = accuracy;
    if (avgTime !== undefined) updateData.avgTime = avgTime;

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Stats updated successfully',
      stats: {
        rank: result.rank,
        totalScore: result.totalScore,
        testsCompleted: result.testsCompleted,
        questionsSolved: result.questionsSolved,
        studyHours: result.studyHours,
        accuracy: result.accuracy,
        avgTime: result.avgTime,
      }
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userResponse: UserResponse = {
      id: user._id?.toString() || '',
      email: user.email,
      name: user.name,
      rank: user.rank,
      totalScore: user.totalScore,
      testsCompleted: user.testsCompleted,
      questionsSolved: user.questionsSolved,
      studyHours: user.studyHours,
      accuracy: user.accuracy,
      avatar: user.avatar,
      bio: user.bio,
      college: user.college,
    };

    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
