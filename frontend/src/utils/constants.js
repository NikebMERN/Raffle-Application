export const CLUB_NAME = import.meta.env.VITE_CLUB_NAME || 'SF Football Club';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const PRIZE_DISTRIBUTION = [
  { rank: 1, pct: 25 }, { rank: 2, pct: 20 }, { rank: 3, pct: 15 },
  { rank: 4, pct: 10 }, { rank: 5, pct: 8 }, { rank: 6, pct: 6 },
  { rank: 7, pct: 5 }, { rank: 8, pct: 4 }, { rank: 9, pct: 4 }, { rank: 10, pct: 3 },
];
