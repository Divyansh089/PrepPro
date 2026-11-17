"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Interview } from "@/lib/api/interview";

// Score report for a finished interview
export default function InterviewScore({ interview }: { interview: Interview }) {
  const scores = [
    { label: "Technical", value: interview.technicalScore ?? 0 },
    { label: "Communication", value: interview.communicationScore ?? 0 },
    { label: "Problem solving", value: interview.problemSolvingScore ?? 0 },
  ];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Interview report</h2>
          <p className="text-sm text-muted-foreground mt-1">+{interview.overallScore ?? 0} points added to your total.</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold">{interview.overallScore ?? 0}%</div>
          <p className="text-sm text-muted-foreground">Overall</p>
        </div>
      </div>

      <div className="space-y-3">
        {scores.map((score) => (
          <div key={score.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{score.label}</span>
              <span>{score.value}%</span>
            </div>
            <Progress value={score.value} className="h-2" />
          </div>
        ))}
      </div>

      {interview.feedback && <p className="text-sm text-muted-foreground leading-relaxed">{interview.feedback}</p>}

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/interview">New interview</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </Card>
  );
}
