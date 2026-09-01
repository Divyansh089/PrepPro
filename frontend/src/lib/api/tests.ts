import { graphqlRequest } from './base';

export type AssessmentTrack = 'soft-skills' | 'technical-skills';
export type AssessmentTopic =
  | 'quant'
  | 'verbal'
  | 'aptitude'
  | 'coding'
  | 'cloud'
  | 'dbms'
  | 'operating-systems'
  | 'networks'
  | 'system-design';
export type AssessmentDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  answerType: 'single-choice' | 'multiple-choice' | 'short-text';
  options?: string[];
  tags: string[];
  estimatedTime: number;
  order: number;
  difficulty: AssessmentDifficulty;
};

export type AssessmentSummary = {
  strengths: string[];
  opportunities: string[];
  improvements: string[];
  suggestions: string[];
};

export type AssessmentResult = {
  questionId: string;
  prompt: string;
  answerType: AssessmentQuestion['answerType'];
  options?: string[];
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  explanation: string;
  tags: string[];
  order: number;
};

export type AssessmentEvaluation = {
  sessionId: string;
  track: AssessmentTrack;
  topic: AssessmentTopic;
  difficulty: AssessmentDifficulty;
  accuracy: number;
  score: number;
  summary: AssessmentSummary;
  results: AssessmentResult[];
  createdAt: string;
};

export type AssessmentTrackDefinition = {
  track: AssessmentTrack;
  label: string;
  description: string;
  topics: Array<{
    id: AssessmentTopic;
    label: string;
    description: string;
    difficulties: AssessmentDifficulty[];
  }>;
};

export const testsApi = {
  async getTracks(_arg?: any) {
    const data = await graphqlRequest(`
      query GetAssessmentTracks {
        assessmentTracks {
          id
          title
          description
          durationMinutes
          questionCount
        }
      }
    `);

    return {
      tracks: [
        {
          track: 'technical-skills' as AssessmentTrack,
          label: 'Technical Engineering Track',
          description: 'Software Architecture, Data Structures, and Coding Assessment',
          topics: [
            { id: 'coding' as AssessmentTopic, label: 'Algorithms & Coding', description: 'Data Structures & Algorithmic Problem Solving', difficulties: ['beginner', 'intermediate', 'advanced'] as AssessmentDifficulty[] },
            { id: 'system-design' as AssessmentTopic, label: 'System Design', description: 'Distributed Systems & Scalability', difficulties: ['intermediate', 'advanced'] as AssessmentDifficulty[] },
          ],
        },
      ],
    };
  },

  async generateSession(payload: {
    track: AssessmentTrack;
    topic: AssessmentTopic;
    difficulty: AssessmentDifficulty;
    count?: number;
  }) {
    const data = await graphqlRequest(`
      mutation GenerateAssessment($trackId: String!) {
        generateAssessmentSession(trackId: $trackId) {
          id
          trackId
          questions {
            id
            text
            options
            category
          }
        }
      }
    `, { trackId: payload.track });

    const session = data.generateAssessmentSession;
    return {
      sessionId: session.id,
      track: payload.track,
      topic: payload.topic,
      difficulty: payload.difficulty,
      status: 'active',
      questions: session.questions.map((q: any, idx: number) => ({
        id: q.id,
        prompt: q.text,
        answerType: 'single-choice' as const,
        options: q.options,
        tags: [q.category || 'Engineering'],
        estimatedTime: 60,
        order: idx + 1,
        difficulty: payload.difficulty,
      })),
    };
  },

  async getSession(sessionId: string) {
    return {
      sessionId,
      track: 'technical-skills' as AssessmentTrack,
      topic: 'coding' as AssessmentTopic,
      difficulty: 'intermediate' as AssessmentDifficulty,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q-1',
          prompt: 'What is the worst-case time complexity of QuickSort?',
          answerType: 'single-choice' as const,
          options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(1)'],
          tags: ['Algorithms'],
          estimatedTime: 60,
          order: 1,
          difficulty: 'intermediate' as AssessmentDifficulty,
        },
      ],
    };
  },

  async submitSession(sessionId: string, answers: Array<{ questionId: string; answer: string | string[] }>) {
    return {
      sessionId,
      track: 'technical-skills' as AssessmentTrack,
      topic: 'coding' as AssessmentTopic,
      difficulty: 'intermediate' as AssessmentDifficulty,
      accuracy: 92,
      score: 92,
      summary: {
        strengths: ['Great algorithmic efficiency'],
        opportunities: ['Review low-level dynamic programming'],
        improvements: ['Focus on space optimization'],
        suggestions: ['Practice hard DP problems'],
      },
      results: [],
      createdAt: new Date().toISOString(),
    };
  },

  async getHistory(_limit?: any) {
    return {
      history: [
        {
          sessionId: 'assess-prev-1',
          track: 'technical-skills' as AssessmentTrack,
          topic: 'coding' as AssessmentTopic,
          difficulty: 'intermediate' as AssessmentDifficulty,
          score: 92,
          accuracy: 92,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  },
};
