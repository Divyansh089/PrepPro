"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ThumbsUp, Target, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { testsApi, type Test, CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/api/tests";

export default function TestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    testsApi
      .get(id)
      .then((data) => {
        // Not submitted yet, so go back to answering
        if (data.status !== "COMPLETED") {
          router.replace(`/tests/${id}/take`);
          return;
        }
        setTest(data);
      })
      .catch((err) => setError(err.message));
  }, [id, user, router]);

  if (error) {
    return (
      <AppShell>
        <div className="p-8">
          <p className="text-red-500">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (authLoading || !test) {
    return <PageLoader text="Loading results..." />;
  }

  const backLink = test.mode === "ASSESSMENT" ? "/tests" : "/practice";
  const feedbackSections = [
    { title: "Strengths", items: test.feedback?.strengths ?? [], icon: ThumbsUp, color: "text-green-500" },
    { title: "To work on", items: test.feedback?.weaknesses ?? [], icon: Target, color: "text-orange-500" },
    { title: "Next steps", items: test.feedback?.suggestions ?? [], icon: Lightbulb, color: "text-yellow-500" },
  ];

  return (
    <AppShell>
      <div className="p-8 max-w-4xl space-y-6">
        {/* Score */}
        <Card className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{CATEGORY_LABELS[test.category]}</h1>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{test.mode === "ASSESSMENT" ? "Assessment" : "Practice"}</Badge>
                <Badge variant="outline">{DIFFICULTY_LABELS[test.difficulty]}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{test.score}%</div>
              <p className="text-muted-foreground mt-1">
                {test.correctCount} of {test.totalQuestions} correct
              </p>
            </div>
          </div>
          <Progress value={test.score} className="h-2 mt-6" />
          {test.mode === "ASSESSMENT" && (
            <p className="text-sm text-muted-foreground mt-3">+{test.score} points added to your total.</p>
          )}
        </Card>

        {/* Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feedbackSections.map((section) => (
            <Card key={section.title} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <section.icon className={`w-4 h-4 ${section.color}`} />
                <h3 className="font-semibold">{section.title}</h3>
              </div>
              {section.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing here.</p>
              ) : (
                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>

        {/* Question review */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Review answers</h2>
          {test.questions.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start gap-3">
                {q.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="space-y-2">
                  <p className="font-medium">
                    {q.order}. {q.text}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Your answer: </span>
                    {q.userAnswer && q.userAnswer.length > 0 ? q.userAnswer.join(", ") : <em>skipped</em>}
                  </p>
                  {!q.isCorrect && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Correct answer: </span>
                      {q.correctAnswer?.join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{q.explanation}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link href={backLink}>Take another test</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
