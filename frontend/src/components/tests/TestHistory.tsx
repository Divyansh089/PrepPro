"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { testsApi, type TestMode, type TestSummary, CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/api/tests";

const PAGE_SIZE = 10;

// The user's past tests for one mode, newest first
export default function TestHistory({ mode }: { mode: TestMode }) {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    testsApi
      .list({ mode, page, limit: PAGE_SIZE })
      .then((data) => {
        setTests(data.tests);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mode, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">History</h2>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && tests.length === 0 && (
        <p className="text-sm text-muted-foreground">No tests yet. Start one above!</p>
      )}

      <div className="divide-y divide-border">
        {tests.map((test) => {
          const isDone = test.status === "COMPLETED";
          return (
            <div key={test.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{CATEGORY_LABELS[test.category]}</p>
                <p className="text-xs text-muted-foreground">
                  {DIFFICULTY_LABELS[test.difficulty]} · {test.totalQuestions} questions ·{" "}
                  {new Date(test.startedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isDone ? (
                  <Badge variant="secondary">
                    {test.score}% ({test.correctCount}/{test.totalQuestions})
                  </Badge>
                ) : (
                  <Badge variant="outline">In progress</Badge>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/tests/${test.id}/${isDone ? "results" : "take"}`}>
                    {isDone ? "View results" : "Continue"}
                  </Link>
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
