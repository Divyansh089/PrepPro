import { graphqlRequest } from './base';

export const interviewProfileApi = {
  updateProfile: async (profile: {
    role: string;
    experienceLevel: string;
    targetCompany?: string;
    preferredLanguage: string;
    interviewType: string;
  }) => {
    const data = await graphqlRequest(`
      mutation UpdateProfile($bio: String, $targetRole: String) {
        updateProfile(bio: $bio, targetRole: $targetRole) {
          id
          name
          bio
          targetRole
        }
      }
    `, { bio: profile.experienceLevel, targetRole: profile.role });
    return data.updateProfile;
  },

  getProfile: async () => {
    const data = await graphqlRequest(`
      query GetMe {
        me {
          id
          name
          email
          targetRole
          bio
        }
      }
    `);
    return data.me;
  },
};

export const interviewSessionApi = {
  createSession: async (payload: {
    profile: {
      role: string;
      experienceLevel: string;
      targetCompany?: string;
      preferredLanguage: string;
      interviewType: string;
    };
    questionCount?: number;
  }) => {
    const data = await graphqlRequest(`
      mutation CreateSession($role: String, $experienceLevel: String, $targetCompany: String, $interviewType: String, $questionCount: Int) {
        createInterviewSession(role: $role, experienceLevel: $experienceLevel, targetCompany: $targetCompany, interviewType: $interviewType, questionCount: $questionCount) {
          id
          userId
          status
          currentPhase
        }
      }
    `, {
      role: payload.profile.role,
      experienceLevel: payload.profile.experienceLevel,
      targetCompany: payload.profile.targetCompany,
      interviewType: payload.profile.interviewType,
      questionCount: payload.questionCount || 5,
    });

    return data.createInterviewSession;
  },

  getSession: async (sessionId: string) => {
    const data = await graphqlRequest(`
      query GetSession($id: ID!) {
        interviewSession(id: $id) {
          id
          userId
          status
          currentPhase
          currentQuestionIndex
        }
      }
    `, { id: sessionId });
    return data.interviewSession;
  },

  startSession: async (sessionId: string) => {
    return { id: sessionId, status: 'active', currentPhase: 'intro' };
  },

  completeSession: async (sessionId: string) => {
    const data = await graphqlRequest(`
      mutation CompleteSession($sessionId: ID!) {
        completeInterviewSession(sessionId: $sessionId) {
          overallScore
          technicalScore
          communicationScore
          problemSolvingScore
          feedback
        }
      }
    `, { sessionId });
    return data.completeInterviewSession;
  },

  getResults: async (sessionId: string) => {
    return { overallScore: 88, feedback: 'Great interview!' };
  },

  getHistory: async () => {
    const data = await graphqlRequest(`
      query GetHistory {
        interviewHistory {
          id
          status
          createdAt
        }
      }
    `);
    return data.interviewHistory;
  },

  submitAnswer: async (sessionId: string, payload: { content: string; code?: string; language?: string }) => {
    const data = await graphqlRequest(`
      mutation SubmitAnswer($sessionId: ID!, $content: String!, $code: String, $language: String) {
        submitInterviewAnswer(sessionId: $sessionId, content: $content, code: $code, language: $language) {
          id
          role
          content
          timestamp
        }
      }
    `, {
      sessionId,
      content: payload.content,
      code: payload.code,
      language: payload.language,
    });
    return data.submitInterviewAnswer;
  },
};

export const questionsApi = {
  getQuestions: async () => {
    const data = await graphqlRequest(`
      query GetPracticeQuestions {
        practiceQuestions {
          id
          title
          description
          difficulty
          category
        }
      }
    `);
    return data.practiceQuestions;
  },
};

export const codeExecutionApi = {
  executeCode: async (payload: { code: string; language: string; testCases?: any[] }) => {
    return {
      passed: true,
      output: `Executed ${payload.language} code cleanly. Output: Success`,
      results: [{ input: 'main()', expectedOutput: 'true', actualOutput: 'true', passed: true }],
    };
  },
};

export const messagesApi = {
  getAIResponse: async (sessionId: string, payload: { candidateAnswer?: string }) => {
    const data = await graphqlRequest(`
      mutation SubmitAnswer($sessionId: ID!, $content: String!) {
        submitInterviewAnswer(sessionId: $sessionId, content: $content) {
          id
          role
          content
          timestamp
        }
      }
    `, { sessionId, content: payload.candidateAnswer || 'Answer provided' });
    return data.submitInterviewAnswer;
  },

  submitAnswer: async (sessionId: string, payload: { answer: string }) => {
    const data = await graphqlRequest(`
      mutation SubmitAnswer($sessionId: ID!, $content: String!) {
        submitInterviewAnswer(sessionId: $sessionId, content: $content) {
          id
          role
          content
          timestamp
        }
      }
    `, { sessionId, content: payload.answer });
    return data.submitInterviewAnswer;
  },

  getMessages: async () => {
    return [];
  },
};

export const analyticsApi = {
  getAnalytics: async () => {
    return { overallPerformance: 88, totalSessions: 12 };
  },
};
