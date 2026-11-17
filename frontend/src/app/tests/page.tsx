"use client";

import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import TestStarter from "@/components/tests/TestStarter";
import TestHistory from "@/components/tests/TestHistory";
import { useAuth } from "@/hooks/useAuth";

export default function AssessmentsPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <AppShell>
      <div className="p-8 max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Assessments</h1>
          <p className="text-muted-foreground text-lg">
            Scored tests. Your score is added to your total points on the leaderboard.
          </p>
        </div>

        <TestStarter mode="ASSESSMENT" />
        <TestHistory mode="ASSESSMENT" />
      </div>
    </AppShell>
  );
}
