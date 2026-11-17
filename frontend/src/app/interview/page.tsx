"use client";

import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import InterviewSetup from "@/components/interview/InterviewSetup";
import InterviewHistory from "@/components/interview/InterviewHistory";
import { useAuth } from "@/hooks/useAuth";

export default function InterviewPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <AppShell>
      <div className="p-8 max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mock Interview</h1>
          <p className="text-muted-foreground text-lg">
            Chat with an AI interviewer, write and run code, and get a score at the end. Your score is added to your
            total points.
          </p>
        </div>

        <InterviewSetup defaultRole={user.targetRole ?? undefined} />
        <InterviewHistory />
      </div>
    </AppShell>
  );
}
