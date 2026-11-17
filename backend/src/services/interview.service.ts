import { Interview, InterviewMessage, InterviewType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { getInterviewerReply, scoreInterview, InterviewScores } from './ai.service';
import { runCode } from './code.service';
import { addPoints } from './leaderboard.service';
import { clearUserStats } from '../utils/cache';
import {
  CreateInterviewInput,
  SendMessageInput,
  RunCodeInput,
  ListInterviewsInput,
} from '../validators/interview.validator';

// How many recent messages the AI sees when it replies
const CONTEXT_MESSAGES = 20;

// ---------- Fallbacks (used when the AI is down) ----------

const FALLBACK_QUESTIONS: Record<InterviewType, string[]> = {
  TECHNICAL: [
    'Explain the difference between an array and a linked list. When would you use each?',
    'Write a function that checks if a string is a palindrome. What is its time complexity?',
    'How does a hash map work internally?',
    'Write a function that returns the two numbers in an array that add up to a target.',
    'What is the difference between a process and a thread?',
  ],
  BEHAVIORAL: [
    'Tell me about a project you are proud of. What was your role?',
    'Describe a time you disagreed with a teammate. How did you handle it?',
    'Tell me about a mistake you made and what you learned from it.',
    'How do you handle tight deadlines?',
    'Why do you want this role?',
  ],
  SYSTEM_DESIGN: [
    'How would you design a URL shortener like bit.ly?',
    'How would you store and serve images for a social media app?',
    'What is caching, and where would you add a cache in a web app?',
    'How would you design the backend for a simple chat app?',
    'What is the difference between SQL and NoSQL databases? When would you pick each?',
  ],
  MIXED: [
    'Tell me about yourself and a project you worked on recently.',
    'Explain the difference between a stack and a queue, with an example of each.',
    'Describe a time you had to learn something new quickly.',
    'Write a function that reverses a linked list.',
    'What would you do if you could not finish your task before a deadline?',
  ],
};

function fallbackReply(interview: Interview, aiMessageCount: number) {
  const questions = FALLBACK_QUESTIONS[interview.type];
  const question = questions[aiMessageCount % questions.length];

  if (aiMessageCount === 0) {
    return `Hi! Welcome to your ${interview.role} interview. Let's start. ${question}`;
  }
  return `Thanks for your answer. Next question: ${question}`;
}

// A basic score based on how many questions were answered
function fallbackScores(answerCount: number): InterviewScores {
  const score = Math.min(60, 20 + answerCount * 10);
  return {
    overall: score,
    technical: score,
    communication: score,
    problemSolving: score,
    feedback:
      'AI scoring was not available, so this is a basic score based on how many questions you answered. Try another interview later for detailed feedback.',
  };
}

// ---------- Helpers ----------

// 404 also hides other users' interviews
async function findUserInterview(userId: string, interviewId: string) {
  const interview = await prisma.interview.findFirst({ where: { id: interviewId, userId } });
  if (!interview) {
    throw new AppError(404, 'Interview not found');
  }
  return interview;
}

function checkInProgress(interview: Interview) {
  if (interview.status === 'COMPLETED') {
    throw new AppError(400, 'Interview has already ended');
  }
}

// The last few messages, oldest first
async function getRecentMessages(interviewId: string) {
  const messages = await prisma.interviewMessage.findMany({
    where: { interviewId },
    orderBy: { createdAt: 'desc' },
    take: CONTEXT_MESSAGES,
  });
  return messages.reverse();
}

// ---------- Endpoints ----------

export async function createInterview(userId: string, input: CreateInterviewInput) {
  const interview = await prisma.interview.create({
    data: {
      userId,
      role: input.role,
      level: input.level,
      type: input.type,
      language: input.language,
      company: input.company || null,
    },
  });

  const reply = (await getInterviewerReply(interview, [])) ?? fallbackReply(interview, 0);
  const firstMessage = await prisma.interviewMessage.create({
    data: { interviewId: interview.id, sender: 'AI', content: reply },
  });

  return { ...interview, messages: [firstMessage] };
}

export async function listInterviews(userId: string, query: ListInterviewsInput) {
  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.interview.count({ where: { userId } }),
  ]);

  return { interviews, page: query.page, limit: query.limit, total };
}

export async function getInterview(userId: string, interviewId: string) {
  const interview = await findUserInterview(userId, interviewId);
  const messages = await prisma.interviewMessage.findMany({
    where: { interviewId },
    orderBy: { createdAt: 'asc' },
  });

  return { ...interview, messages };
}

export async function sendMessage(userId: string, interviewId: string, input: SendMessageInput) {
  const interview = await findUserInterview(userId, interviewId);
  checkInProgress(interview);

  const userMessage = await prisma.interviewMessage.create({
    data: {
      interviewId,
      sender: 'USER',
      content: input.content,
      code: input.code?.trim() ? input.code : null,
      language: input.code?.trim() ? input.language ?? interview.language : null,
    },
  });

  const recent = await getRecentMessages(interviewId);
  let reply = await getInterviewerReply(interview, recent);

  if (!reply) {
    const aiMessageCount = await prisma.interviewMessage.count({ where: { interviewId, sender: 'AI' } });
    reply = fallbackReply(interview, aiMessageCount);
  }

  const aiMessage = await prisma.interviewMessage.create({
    data: { interviewId, sender: 'AI', content: reply },
  });

  return { userMessage, aiMessage };
}

export async function runInterviewCode(userId: string, interviewId: string, input: RunCodeInput) {
  const interview = await findUserInterview(userId, interviewId);
  checkInProgress(interview);

  return runCode(input);
}

export async function endInterview(userId: string, interviewId: string) {
  const interview = await findUserInterview(userId, interviewId);
  checkInProgress(interview);

  const messages: InterviewMessage[] = await prisma.interviewMessage.findMany({
    where: { interviewId },
    orderBy: { createdAt: 'asc' },
  });
  const answerCount = messages.filter((m) => m.sender === 'USER').length;

  // No answers means nothing to score, so skip the AI
  let scores: InterviewScores;
  if (answerCount === 0) {
    scores = { overall: 0, technical: 0, communication: 0, problemSolving: 0, feedback: 'You ended the interview without answering any questions.' };
  } else {
    scores = (await scoreInterview(interview, messages)) ?? fallbackScores(answerCount);
  }

  const ended = await prisma.$transaction(async (tx) => {
    // Only one request can move it out of IN_PROGRESS, so points are never added twice
    const { count } = await tx.interview.updateMany({
      where: { id: interviewId, status: 'IN_PROGRESS' },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        overallScore: scores.overall,
        technicalScore: scores.technical,
        communicationScore: scores.communication,
        problemSolvingScore: scores.problemSolving,
        feedback: scores.feedback,
      },
    });

    if (count === 0) {
      throw new AppError(400, 'Interview has already ended');
    }

    await tx.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: scores.overall } },
    });

    return tx.interview.findUnique({ where: { id: interviewId } });
  });

  // After the transaction, so Redis only changes once Postgres has the points
  await addPoints(userId, scores.overall);
  await clearUserStats(userId);

  return ended;
}
