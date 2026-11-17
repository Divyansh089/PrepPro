"use client";

import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import TestStarter from "@/components/tests/TestStarter";
import TestHistory from "@/components/tests/TestHistory";
import { useAuth } from "@/hooks/useAuth";

export default function PracticePage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <AppShell>
      <div className="p-8 max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Practice</h1>
          <p className="text-muted-foreground text-lg">
            Untimed practice with explanations and feedback. Practice does not count for the leaderboard.
          </p>
        </div>

        <TestStarter mode="PRACTICE" />
        <TestHistory mode="PRACTICE" />
      </div>
    </AppShell>
  );
}
