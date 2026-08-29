import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { User, CreateUserInput, LoginInput, UserResponse, ProfileCompletionInput } from '../models/User';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name }: CreateUserInput = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: Omit<User, '_id'> = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      rank: 0,
      totalScore: 0,
      testsCompleted: 0,
      questionsSolved: 0,
      studyHours: 0,
      accuracy: 0,
      avgTime: 0,
      isProfileComplete: false,
      skills: [],
      achievements: [],
      activityData: [],
    };

    const result = await usersCollection.insertOne(newUser as User);

    const token = jwt.sign(
      { userId: result.insertedId.toString(), email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse: UserResponse = {
      id: result.insertedId.toString(),
      email: newUser.email,
      name: newUser.name,
      rank: newUser.rank,
      totalScore: newUser.totalScore,
      testsCompleted: newUser.testsCompleted,
      questionsSolved: newUser.questionsSolved,
      studyHours: newUser.studyHours,
      accuracy: newUser.accuracy,
      avgTime: newUser.avgTime,
      isProfileComplete: newUser.isProfileComplete,
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginInput = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id?.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
      avgTime: user.avgTime,
      avatar: user.avatar,
      bio: user.bio,
      college: user.college,
      gradYear: user.gradYear,
      targetRole: user.targetRole,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      location: user.location,
      company: user.company,
      isProfileComplete: user.isProfileComplete,
    };

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      avgTime: user.avgTime,
      avatar: user.avatar,
      bio: user.bio,
      college: user.college,
      gradYear: user.gradYear,
      targetRole: user.targetRole,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      location: user.location,
      company: user.company,
      isProfileComplete: user.isProfileComplete,
    };

    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, bio, college, gradYear, targetRole, linkedin, github, portfolio, location, company }: ProfileCompletionInput = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const updateData: Partial<User> = {
      name,
      bio,
      college,
      gradYear,
      targetRole,
      linkedin,
      github,
      portfolio,
      location,
      company,
      isProfileComplete: true,
      updatedAt: new Date(),
    };

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(req.userId) });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse: UserResponse = {
      id: updatedUser._id?.toString() || '',
      email: updatedUser.email,
      name: updatedUser.name,
      rank: updatedUser.rank,
      totalScore: updatedUser.totalScore,
      testsCompleted: updatedUser.testsCompleted,
      questionsSolved: updatedUser.questionsSolved,
      studyHours: updatedUser.studyHours,
      accuracy: updatedUser.accuracy,
      avgTime: updatedUser.avgTime,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      college: updatedUser.college,
      gradYear: updatedUser.gradYear,
      targetRole: updatedUser.targetRole,
      linkedin: updatedUser.linkedin,
      github: updatedUser.github,
      portfolio: updatedUser.portfolio,
      location: updatedUser.location,
      company: updatedUser.company,
      isProfileComplete: updatedUser.isProfileComplete,
    };

    res.status(200).json({
      message: 'Profile completed successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await usersCollection.updateOne(
      { _id: new ObjectId(req.userId) },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        } 
      }
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
