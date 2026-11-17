"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { testsApi, type Test, type TestQuestion, CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/api/tests";

export default function TakeTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    testsApi
      .get(id)
      .then((data) => {
        // Already submitted, so show the results instead
        if (data.status === "COMPLETED") {
          router.replace(`/tests/${id}/results`);
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
    return <PageLoader text="Loading test..." />;
  }

  const question = test.questions[current];
  const answeredCount = test.questions.filter((q) => (answers[q.id] ?? []).some((a) => a.trim())).length;

  const setAnswer = (questionId: string, value: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleOption = (questionId: string, option: string, checked: boolean) => {
    const selected = answers[questionId] ?? [];
    setAnswer(questionId, checked ? [...selected, option] : selected.filter((o) => o !== option));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = test.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? [] }));
      await testsApi.submit(test.id, payload);
      router.push(`/tests/${test.id}/results`);
    } catch (err: any) {
      setError(err.message || "Could not submit the test");
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{CATEGORY_LABELS[test.category]}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{test.mode === "ASSESSMENT" ? "Assessment" : "Practice"}</Badge>
              <Badge variant="outline">{DIFFICULTY_LABELS[test.difficulty]}</Badge>
            </div>
          </div>
          <Button onClick={() => setShowSubmitDialog(true)} disabled={submitting}>
            Submit test
          </Button>
        </div>

        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Question {current + 1} of {test.totalQuestions}
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <Progress value={(answeredCount / test.totalQuestions) * 100} className="h-2" />
        </div>

        {/* Question */}
        <Card className="p-6">
          <p className="text-xs text-muted-foreground mb-2">
            {question.type === "MULTI_CHOICE" ? "Select all that apply" : question.type === "SHORT_TEXT" ? "Type your answer" : "Select one"}
          </p>
          <h2 className="text-lg font-medium mb-6">{question.text}</h2>
          <AnswerInput
            question={question}
            value={answers[question.id] ?? []}
            onSingle={(option) => setAnswer(question.id, [option])}
            onToggle={(option, checked) => toggleOption(question.id, option, checked)}
            onText={(text) => setAnswer(question.id, [text])}
          />
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrent(current - 1)} disabled={current === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          <div className="flex flex-wrap justify-center gap-1">
            {test.questions.map((q, index) => {
              const isAnswered = (answers[q.id] ?? []).some((a) => a.trim());
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`w-8 h-8 rounded text-xs font-medium border ${
                    index === current
                      ? "border-primary bg-primary text-primary-foreground"
                      : isAnswered
                      ? "border-primary/50 bg-primary/10"
                      : "border-border"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrent(current + 1)}
            disabled={current === test.questions.length - 1}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit test?</AlertDialogTitle>
            <AlertDialogDescription>
              You answered {answeredCount} of {test.totalQuestions} questions.
              {answeredCount < test.totalQuestions && " Unanswered questions count as wrong."} You can't change your
              answers after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Keep going</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitting ? "Grading..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

// Radio buttons, checkboxes or a text box, depending on the question type
function AnswerInput({
  question,
  value,
  onSingle,
  onToggle,
  onText,
}: {
  question: TestQuestion;
  value: string[];
  onSingle: (option: string) => void;
  onToggle: (option: string, checked: boolean) => void;
  onText: (text: string) => void;
}) {
  if (question.type === "SHORT_TEXT") {
    return <Input value={value[0] ?? ""} onChange={(e) => onText(e.target.value)} placeholder="Your answer" />;
  }

  if (question.type === "MULTI_CHOICE") {
    return (
      <div className="space-y-3">
        {question.options.map((option, i) => (
          <div key={option} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Checkbox
              id={`${question.id}-${i}`}
              checked={value.includes(option)}
              onCheckedChange={(checked) => onToggle(option, checked === true)}
            />
            <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer font-normal">
              {option}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup value={value[0] ?? ""} onValueChange={onSingle} className="space-y-3">
      {question.options.map((option, i) => (
        <div key={option} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <RadioGroupItem value={option} id={`${question.id}-${i}`} />
          <Label htmlFor={`${question.id}-${i}`} className="flex-1 cursor-pointer font-normal">
            {option}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
