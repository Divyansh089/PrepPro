"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { AuthUser, getAuthToken, setAuthUser, removeAuthToken, removeAuthUser } from '@/lib/auth';

// Loads the logged-in user from the backend.
// Sends the user to /login if there is no valid token,
// and to /complete-profile if their profile is not finished yet.
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!getAuthToken()) {
        router.push('/login');
        return;
      }

      try {
        const me = await authApi.me();
        setAuthUser(me);

        if (!me.isProfileComplete) {
          router.push('/complete-profile');
          return;
        }

        setUser(me);
      } catch (error) {
        console.error('Error checking auth:', error);
        removeAuthToken();
        removeAuthUser();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    removeAuthToken();
    removeAuthUser();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout };
}
