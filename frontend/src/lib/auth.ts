// The logged-in user, as returned by GET /api/auth/me
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  college: string | null;
  gradYear: number | null;
  targetRole: string | null;
  bio: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  isProfileComplete: boolean;
}

// Client-side auth utilities
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

export function setAuthUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user));
  }
}

export function getAuthUser(): any | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function removeAuthUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser');
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getAuthUser();
}

