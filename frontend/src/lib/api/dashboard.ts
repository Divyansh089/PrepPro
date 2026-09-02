import { graphqlRequest } from './base';

export const dashboardApi = {
  async getSummary(_arg?: any) {
    const data = await graphqlRequest(`
      query GetDashboardSummary {
        dashboardSummary {
          user {
            id
            name
            email
            avatar
          }
          stats {
            rank
            totalScore
            testsCompleted
            questionsSolved
            studyHours
            accuracy
            avgTime
          }
          recentActivity
        }
      }
    `);

    return data.dashboardSummary;
  },

  async getLeaderboard(limit: number = 50) {
    const data = await graphqlRequest(`
      query GetLeaderboard($limit: Int) {
        leaderboard(limit: $limit) {
          id
          name
          avatar
          rank
          totalScore
          testsCompleted
          accuracy
          targetRole
          college
        }
      }
    `, { limit });

    return { top: data.leaderboard };
  }
};
