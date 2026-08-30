export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    bio: String
    college: String
    gradYear: String
    targetRole: String
    rank: Int
    totalScore: Int
    testsCompleted: Int
    questionsSolved: Int
    studyHours: Float
    accuracy: Float
    avgTime: String
    createdAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type UserProfile {
    id: ID!
    role: String
    experienceLevel: String
    targetCompany: String
    preferredLanguage: String
    interviewType: String
  }

  type Question {
    id: ID!
    title: String!
    description: String!
    type: String!
    difficulty: String!
    category: String
    tags: [String!]
    companies: [String!]
    roles: [String!]
    timeLimit: Int
  }

  type Message {
    id: ID
    role: String!
    content: String!
    timestamp: String!
    questionId: String
  }

  type ScoreBreakdown {
    overallScore: Int!
    technicalScore: Int
    communicationScore: Int
    problemSolvingScore: Int
    feedback: String
  }

  type InterviewSession {
    id: ID!
    userId: String!
    status: String!
    currentPhase: String
    currentQuestionIndex: Int
    score: ScoreBreakdown
    createdAt: String
  }

  type PracticeQuestion {
    id: ID!
    title: String!
    description: String!
    difficulty: String!
    category: String!
    tags: [String!]
    sampleInput: String
    sampleOutput: String
  }

  type PracticeSession {
    id: ID!
    questions: [PracticeQuestion!]!
  }

  type AssessmentQuestion {
    id: ID!
    text: String!
    options: [String!]!
    category: String
  }

  type AssessmentTrack {
    id: ID!
    title: String!
    description: String!
    durationMinutes: Int!
    questionCount: Int!
  }

  type AssessmentSession {
    id: ID!
    trackId: String!
    questions: [AssessmentQuestion!]!
  }

  type LeaderboardEntry {
    id: ID!
    name: String!
    avatar: String
    rank: Int!
    totalScore: Int!
    testsCompleted: Int!
    accuracy: Float!
    targetRole: String
    college: String
  }

  type DashboardSummary {
    user: User
    stats: UserStats
    recentActivity: [String!]
  }

  type UserStats {
    rank: Int
    totalScore: Int
    testsCompleted: Int
    questionsSolved: Int
    studyHours: Float
    accuracy: Float
    avgTime: String
  }

  type InsightsData {
    readinessScore: Int!
    strengths: [String!]!
    weaknesses: [String!]!
    recommendedTopics: [String!]!
  }

  type Query {
    me: User
    user(id: ID!): User
    leaderboard(limit: Int): [LeaderboardEntry!]!
    dashboardSummary: DashboardSummary!
    insightsData: InsightsData!
    interviewSession(id: ID!): InterviewSession
    interviewHistory: [InterviewSession!]!
    practiceQuestions(category: String, difficulty: String, limit: Int): [PracticeQuestion!]!
    assessmentTracks: [AssessmentTrack!]!
    assessmentSession(id: ID!): AssessmentSession
  }

  type Mutation {
    signup(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProfile(name: String, bio: String, college: String, gradYear: String, targetRole: String): User!
    createInterviewSession(role: String, experienceLevel: String, targetCompany: String, interviewType: String, questionCount: Int): InterviewSession!
    submitInterviewAnswer(sessionId: ID!, content: String!, code: String, language: String): Message!
    completeInterviewSession(sessionId: ID!): ScoreBreakdown!
    generatePracticeSession(category: String, difficulty: String, count: Int): PracticeSession!
    generateAssessmentSession(trackId: String!): AssessmentSession!
  }
`;
