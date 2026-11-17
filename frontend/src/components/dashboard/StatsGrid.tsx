"use client";

import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, Target, MessageSquare, Percent } from "lucide-react";
import type { Dashboard } from "@/lib/api/dashboard";

// The 5 headline numbers. Used on the dashboard and the profile page.
export default function StatsGrid({ stats }: { stats: Dashboard }) {
  const cards = [
    { label: "Total points", value: stats.totalPoints.toLocaleString(), icon: Trophy },
    { label: "Rank", value: stats.rank ? `#${stats.rank}` : "—", icon: TrendingUp },
    { label: "Tests completed", value: stats.testsCompleted, icon: Target },
    { label: "Interviews completed", value: stats.interviewsCompleted, icon: MessageSquare },
    { label: "Average score", value: `${stats.avgScore}%`, icon: Percent },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{card.label}</span>
            <card.icon className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold">{card.value}</div>
        </Card>
      ))}
    </div>
  );
}
