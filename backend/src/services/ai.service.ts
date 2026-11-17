import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { Category, Difficulty, Interview, InterviewMessage } from '@prisma/client';
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

// ---------- Interview ----------

const TYPE_LABELS = {
  TECHNICAL: 'technical (coding, data structures and algorithms, CS fundamentals)',
  BEHAVIORAL: 'behavioral (teamwork, conflicts, projects, motivation)',
  SYSTEM_DESIGN: 'system design',
  MIXED: 'mixed (technical and behavioral)',
};

function describeInterview(interview: Interview) {
  const company = interview.company ? ` at ${interview.company}` : '';
  return `a ${TYPE_LABELS[interview.type]} interview for a ${interview.level.toLowerCase()} ${interview.role} role${company}. The candidate codes in ${interview.language}.`;
}

// Turns the chat into plain text for the prompt
function formatTranscript(messages: InterviewMessage[]) {
  return messages
    .map((m) => {
      const who = m.sender === 'AI' ? 'Interviewer' : 'Candidate';
      const code = m.code ? `\n[Code in ${m.language ?? 'unknown'}]\n${m.code}` : '';
      return `${who}: ${m.content}${code}`;
    })
    .join('\n\n');
}

const replySchema = z.object({ reply: z.string().min(1) });

// The interviewer's next message. With no messages yet, it writes the intro and the first question.
export async function getInterviewerReply(interview: Interview, messages: InterviewMessage[]): Promise<string | null> {
  const task =
    messages.length === 0
      ? 'Start the interview: greet the candidate in one sentence, then ask the first question.'
      : `Here is the conversation so far:\n\n${formatTranscript(messages)}\n\nReply to the candidate's last message: react to it in 1-2 sentences (point out mistakes honestly), then ask the next question or a follow-up.`;

  const prompt = `You are a friendly but honest interviewer taking ${describeInterview(interview)}

${task}

Rules:
- Ask only one question at a time.
- Keep the whole reply under 120 words.
- For coding questions, give a small problem with an example input and output. The candidate can write and run code in an editor.
- Do not give away full answers.

Return a JSON object: { "reply": "your message" }`;

  const data = await askForJson(prompt);
  const result = replySchema.safeParse(data);

  return result.success ? (result.data as { reply: string }).reply : null;
}

const scoreSchema = z.object({
  overall: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
  feedback: z.string().min(1),
});

export type InterviewScores = {
  overall: number;
  technical: number;
  communication: number;
  problemSolving: number;
  feedback: string;
};

// Scores the whole interview from 0 to 100
export async function scoreInterview(interview: Interview, messages: InterviewMessage[]): Promise<InterviewScores | null> {
  const prompt = `You took ${describeInterview(interview)}

Full transcript:

${formatTranscript(messages)}

Score the candidate honestly from 0 to 100. Short or empty answers must get low scores.
Return a JSON object with:
- "overall", "technical", "communication", "problemSolving": whole numbers from 0 to 100
- "feedback": 3-4 sentences on what went well and what to improve`;

  const data = await askForJson(prompt);
  const result = scoreSchema.safeParse(data);

  if (!result.success) return null;

  const scores = result.data as InterviewScores;
  return {
    overall: Math.round(scores.overall),
    technical: Math.round(scores.technical),
    communication: Math.round(scores.communication),
    problemSolving: Math.round(scores.problemSolving),
    feedback: scores.feedback,
  };
}
