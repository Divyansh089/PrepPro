"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { interviewApi, type Interview, TYPE_LABELS } from "@/lib/api/interview";

const PAGE_SIZE = 10;

// The user's past interviews, newest first
export default function InterviewHistory() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    interviewApi
      .list(page, PAGE_SIZE)
      .then((data) => {
        setInterviews(data.interviews);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">History</h2>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && interviews.length === 0 && (
        <p className="text-sm text-muted-foreground">No interviews yet. Start one above!</p>
      )}

      <div className="divide-y divide-border">
        {interviews.map((interview) => {
          const isDone = interview.status === "COMPLETED";
          return (
            <div key={interview.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">
                  {interview.role}
                  {interview.company && <span className="text-muted-foreground"> at {interview.company}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[interview.type]} · {new Date(interview.startedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isDone ? (
                  <Badge variant="secondary">{interview.overallScore}%</Badge>
                ) : (
                  <Badge variant="outline">In progress</Badge>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/interview/${interview.id}`}>{isDone ? "View report" : "Continue"}</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}
