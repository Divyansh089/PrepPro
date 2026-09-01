import { graphqlRequest } from './base';

export const insightsApi = {
  async getOverview(_arg?: any) {
    const data = await graphqlRequest(`
      query GetInsightsData {
        insightsData {
          readinessScore
          strengths
          weaknesses
          recommendedTopics
        }
      }
    `);

    return data.insightsData;
  }
};
