"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import StatsGrid from "@/components/dashboard/StatsGrid";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ClipboardCheck, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { dashboardApi, type ActivityItem, type Dashboard, type Insights } from "@/lib/api/dashboard";
import { CATEGORY_LABELS, type Category } from "@/lib/api/tests";

const ACTIVITY_LABELS = { PRACTICE: "Practice", ASSESSMENT: "Assessment", INTERVIEW: "Interview" };

function activityTitle(item: ActivityItem) {
  return item.type === "INTERVIEW" ? item.title : CATEGORY_LABELS[item.title as Category];
}

function activityLink(item: ActivityItem) {
  return item.type === "INTERVIEW" ? `/interview/${item.id}` : `/tests/${item.id}/results`;
}

const QUICK_ACTIONS = [
  { title: "Practice", text: "Untimed tests with explanations", href: "/practice", icon: BookOpen },
  { title: "Assessment", text: "Scored tests that earn points", href: "/tests", icon: ClipboardCheck },
  { title: "Mock interview", text: "Chat with an AI interviewer", href: "/interview", icon: MessageSquare },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([dashboardApi.get(), dashboardApi.getInsights()])
      .then(([dashboard, insightsData]) => {
        setStats(dashboard);
        setInsights(insightsData);
      })
      .catch((err) => setError(err.message));
  }, [user]);

  if (error) {
    return (
      <AppShell>
        <div className="p-8">
          <p className="text-red-500">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (authLoading || !user || !stats || !insights) {
    return <PageLoader text="Loading your dashboard..." />;
  }

  return (
    <AppShell>
      <div className="p-8 max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground text-lg">Your progress so far and what to do next.</p>
        </div>

        <StatsGrid stats={stats} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="p-5 h-full hover:border-primary transition-colors">
                <action.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-semibold">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.text}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent activity</h2>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing yet. Finish a test or an interview and it shows up here.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentActivity.map((item) => (
                  <Link
                    key={item.id}
                    href={activityLink(item)}
                    className="flex items-center justify-between py-3 hover:text-primary"
                  >
                    <div>
                      <p className="font-medium">{activityTitle(item)}</p>
                      <p className="text-xs text-muted-foreground">
                        {ACTIVITY_LABELS[item.type]} · {new Date(item.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.score}%</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Recommendations = weak categories */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-1">Recommended practice</h2>
            <p className="text-sm text-muted-foreground mb-4">Categories where your accuracy is 50% or less.</p>
            {insights.weaknesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {insights.categories.length === 0
                  ? "Take a few tests and we'll show the categories you should work on."
                  : "No weak categories right now. Nice work! Try a harder difficulty or a new category."}
              </p>
            ) : (
              <div className="space-y-3">
                {insights.weaknesses.map((category) => {
                  const accuracy = insights.categories.find((c) => c.category === category)?.accuracy ?? 0;
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{CATEGORY_LABELS[category]}</p>
                        <p className="text-xs text-muted-foreground">{accuracy}% accuracy</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/practice?category=${category}`}>Practice</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <Button variant="link" className="px-0 mt-4" asChild>
              <Link href="/insights">See all insights →</Link>
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
