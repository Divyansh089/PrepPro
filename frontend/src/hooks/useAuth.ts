"use client";

import { useState, useEffect } from 'react';
import { graphqlRequest } from '@/lib/api/base';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  isProfileComplete?: boolean;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const data = await graphqlRequest(`
          query GetMe {
            me {
              id
              email
              name
              avatar
              targetRole
            }
          }
        `);

        if (!data.me) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          router.push('/login');
          return;
        }

        const userData = { ...data.me, isProfileComplete: true };
        setUser(userData);
      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout };
}
