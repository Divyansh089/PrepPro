"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthUser, getAuthToken, setAuthUser, removeAuthToken, removeAuthUser } from "@/lib/auth";
import { authApi } from "@/lib/api/auth";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Trophy,
  Briefcase,
  Calendar,
  GraduationCap,
  Mail,
  Edit,
  BookOpen,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
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
        setLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
        removeAuthToken();
        removeAuthUser();
        router.push('/login');
      }
    };

    loadUser();
  }, [router]);

  if (loading || !user) {
    return (
      <AppShell>
        <div className="p-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Profile Header */}
        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarFallback className="text-3xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-muted-foreground mb-4">@{user.email.split('@')[0]}</p>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{user.targetRole}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>{user.college} · Class of {user.gradYear}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined {joinDate}</span>
                  </div>
                </div>

                {user.bio && <p className="text-sm text-muted-foreground max-w-2xl">{user.bio}</p>}
              </div>
            </div>

            <Button size="sm" asChild>
              <Link href="/settings">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Points</span>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold">{user.totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">From assessments and mock interviews</p>
          </Card>

          <Card className="p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Your Activity</span>
              <BookOpen className="w-5 h-5 text-[#6633FF]" />
            </div>
            <p className="text-sm text-muted-foreground">
              Complete practice tests, assessments and mock interviews to see your stats and history here.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
