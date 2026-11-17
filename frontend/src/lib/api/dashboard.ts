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
  }
};
