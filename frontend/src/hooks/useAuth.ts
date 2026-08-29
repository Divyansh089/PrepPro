"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api/base';
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

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        const userData = data.user;
        
        setUser(userData);

        // Check if profile is complete, redirect if not
        if (!userData.isProfileComplete) {
          router.push('/complete-profile');
          return;
        }
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
