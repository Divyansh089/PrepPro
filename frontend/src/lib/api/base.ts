// Shared API base URL for frontend code
// Normalize env value and ensure it ends with /api
const RAW = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TRIMMED = RAW.replace(/\/+$/, '');
export const API_BASE_URL = /\/api$/i.test(TRIMMED) ? TRIMMED : `${TRIMMED}/api`;
