"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, Target } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { dashboardApi, type Insights } from "@/lib/api/dashboard";
import { CATEGORY_LABELS, type Category } from "@/lib/api/tests";

// One series per chart, so one color: the brand purple
const SERIES_COLOR = "var(--chart-1)";
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
const GRID_COLOR = "var(--border)";
const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function CategoryList({ title, icon: Icon, items, empty }: { title: string; icon: typeof ThumbsUp; items: Category[]; empty: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((category) => (
            <li key={category} className="flex items-center justify-between text-sm">
              <span>{CATEGORY_LABELS[category]}</span>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/practice?category=${category}`}>Practice</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    dashboardApi
      .getInsights()
      .then(setInsights)
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

  if (authLoading || !user || !insights) {
    return <PageLoader text="Loading insights..." />;
  }

  const trend = insights.scoreTrend.map((t, index) => ({
    label: `#${index + 1}`,
    score: t.score,
    name: `${CATEGORY_LABELS[t.category]} (${t.mode === "ASSESSMENT" ? "assessment" : "practice"})`,
    date: new Date(t.completedAt).toLocaleDateString(),
  }));

  const accuracy = insights.categories.map((c) => ({
    name: CATEGORY_LABELS[c.category],
    accuracy: c.accuracy,
    tests: c.tests,
  }));

  const interviewScores = [
    { label: "Overall", value: insights.interviews.overall },
    { label: "Technical", value: insights.interviews.technical },
    { label: "Communication", value: insights.interviews.communication },
    { label: "Problem solving", value: insights.interviews.problemSolving },
  ];

  const hasTests = insights.categories.length > 0;

  return (
    <AppShell>
      <div className="p-8 max-w-6xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Insights</h1>
          <p className="text-muted-foreground text-lg">How you are doing, based on every test and interview you finished.</p>
        </div>

        {!hasTests && insights.interviews.completed === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No data yet. Finish a test or a mock interview to see your insights.</p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/practice">Start practising</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/interview">Mock interview</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CategoryList
                title="Strengths (70%+ accuracy)"
                icon={ThumbsUp}
                items={insights.strengths}
                empty="No strong categories yet."
              />
              <CategoryList
                title="To work on (50% or less)"
                icon={Target}
                items={insights.weaknesses}
                empty="No weak categories. Keep it up!"
              />
            </div>

            {hasTests && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score trend: change over time, so a line */}
                <Card className="p-6">
                  <h2 className="font-semibold mb-1">Score trend</h2>
                  <p className="text-xs text-muted-foreground mb-4">Your last {trend.length} tests, oldest first</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                      <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                        formatter={(value) => [`${value}%`, "Score"]}
                        labelFormatter={(_, payload) => {
                          const point = payload?.[0]?.payload;
                          return point ? `${point.name} · ${point.date}` : "";
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={SERIES_COLOR}
                        strokeWidth={2}
                        dot={{ r: 4, fill: SERIES_COLOR, strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Accuracy per category: comparing sizes, so bars */}
                <Card className="p-6">
                  <h2 className="font-semibold mb-1">Accuracy by category</h2>
                  <p className="text-xs text-muted-foreground mb-4">Correct answers out of all questions, per category</p>
                  <ResponsiveContainer width="100%" height={Math.max(120, accuracy.length * 40)}>
                    <BarChart data={accuracy} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="name" width={150} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                        formatter={(value, _, item) => [`${value}% over ${item.payload.tests} test(s)`, "Accuracy"]}
                      />
                      <Bar dataKey="accuracy" fill={SERIES_COLOR} radius={[0, 4, 4, 0]} barSize={18}>
                        <LabelList
                          dataKey="accuracy"
                          position="right"
                          formatter={(value) => `${value}%`}
                          style={{ fill: "var(--foreground)", fontSize: 12 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            {/* Interview averages */}
            <Card className="p-6">
              <h2 className="font-semibold mb-1">Mock interviews</h2>
              {insights.interviews.completed === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No interviews yet.{" "}
                  <Link href="/interview" className="text-primary hover:underline">
                    Start one
                  </Link>
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-4">
                    Average over {insights.interviews.completed}{" "}
                    {insights.interviews.completed === 1 ? "interview" : "interviews"}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {interviewScores.map((score) => (
                      <div key={score.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{score.label}</span>
                          <span className="font-medium">{score.value}%</span>
                        </div>
                        <Progress value={score.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
