import { api } from './base';

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  college: string | null;
  points: number;
};

export type Leaderboard = {
  top: LeaderboardEntry[];
  // rank is null until the user has earned some points
  me: { rank: number | null; points: number };
};

export const leaderboardApi = {
  get: (limit = 50) => api.get<Leaderboard>(`/leaderboard?limit=${limit}`),
};
