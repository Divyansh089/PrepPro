import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { Category, Difficulty } from '@prisma/client';
import { env } from '../config/env';

// No key = no AI. Every function below then returns null and the caller uses a fallback.
const ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

const TIMEOUT_MS = 20000;

const CATEGORY_LABELS: Record<Category, string> = {
  QUANT: 'quantitative aptitude',
  VERBAL: 'verbal ability',
  APTITUDE: 'logical aptitude',
  REASONING: 'logical reasoning and puzzles',
  CODING: 'coding and data structures & algorithms',
  DBMS: 'database management systems',
  OS: 'operating systems',
  NETWORKS: 'computer networks',
  CLOUD: 'cloud computing and DevOps',
  SYSTEM_DESIGN: 'system design',
};

const MAX_ATTEMPTS = 2;

// Gemini sometimes answers 503 (busy) or 429 (rate limit). These are worth one more try.
function isTemporaryError(err: any) {
  return err?.status === 503 || err?.status === 429;
}

// Sends a prompt to Gemini and parses the JSON answer.
// Returns null if there is no key, it times out, or the answer is not JSON.
async function askForJson(prompt: string): Promise<unknown | null> {
  if (!ai) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: env.geminiModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      });

      return JSON.parse(response.text ?? '');
    } catch (err: any) {
      console.error(`Gemini request failed (attempt ${attempt}):`, err.message);

      if (attempt < MAX_ATTEMPTS && isTemporaryError(err)) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      return null;
    }
  }

  return null;
}

// ---------- Questions ----------

const aiQuestionSchema = z.object({
  type: z.enum(['SINGLE_CHOICE', 'MULTI_CHOICE']),
  text: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctAnswer: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(1),
});

export type AiQuestion = {
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE';
  text: string;
  options: string[];
  correctAnswer: string[];
  explanation: string;
};

// Checks one question from the AI. Returns null if it is broken.
function checkQuestion(item: unknown): AiQuestion | null {
  const result = aiQuestionSchema.safeParse(item);
  if (!result.success) return null;

  const q = result.data as AiQuestion;
  const answersAreOptions = q.correctAnswer.every((answer) => q.options.includes(answer));
  const answerCountOk = q.type === 'SINGLE_CHOICE' ? q.correctAnswer.length === 1 : q.correctAnswer.length >= 2;

  return answersAreOptions && answerCountOk ? q : null;
}

export async function generateQuestions(
  category: Category,
  difficulty: Difficulty,
  count: number
): Promise<AiQuestion[] | null> {
  const prompt = `You are writing a placement test for engineering students.
Create ${count} ${difficulty.toLowerCase()} questions about ${CATEGORY_LABELS[category]}, like the ones asked in company hiring tests.

Return a JSON array. Each item must have exactly these fields:
- "type": "SINGLE_CHOICE" (one correct option) or "MULTI_CHOICE" (two or more correct options). Use mostly SINGLE_CHOICE.
- "text": the question
- "options": exactly 4 short answer options
- "correctAnswer": array of the correct options, copied exactly from "options"
- "explanation": why the answer is correct, max 2 sentences

Do not number the questions and do not use markdown.`;

  const data = await askForJson(prompt);
  if (!Array.isArray(data)) return null;

  const questions = data
    .map(checkQuestion)
    .filter((q): q is AiQuestion => q !== null)
    .slice(0, count);

  return questions.length > 0 ? questions : null;
}

// ---------- Feedback ----------

const feedbackSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type Feedback = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

type FeedbackInput = {
  category: Category;
  difficulty: Difficulty;
  score: number;
  wrongAnswers: Array<{ text: string; userAnswer: string[]; correctAnswer: string[] }>;
};

export async function generateFeedback(input: FeedbackInput): Promise<Feedback | null> {
  const mistakes = input.wrongAnswers
    .map(
      (q, i) =>
        `${i + 1}. ${q.text}\n   Student answered: ${q.userAnswer.join(', ') || '(skipped)'}\n   Correct: ${q.correctAnswer.join(', ')}`
    )
    .join('\n');

  const prompt = `A student finished a ${input.difficulty.toLowerCase()} test on ${CATEGORY_LABELS[input.category]} and scored ${input.score}%.

Questions they got wrong:
${mistakes || '(none, every answer was correct)'}

Give short, encouraging feedback as a JSON object with:
- "strengths": 1-2 points
- "weaknesses": 1-2 points about the concepts they missed
- "suggestions": 2 concrete things to practise next
Each point max 20 words.`;

  const data = await askForJson(prompt);
  const result = feedbackSchema.safeParse(data);

  return result.success ? (result.data as Feedback) : null;
}
