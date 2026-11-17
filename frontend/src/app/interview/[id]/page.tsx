"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import InterviewChat from "@/components/interview/InterviewChat";
import CodePanel, { STARTER_CODE } from "@/components/interview/CodePanel";
import InterviewScore from "@/components/interview/InterviewScore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { interviewApi, type InterviewWithMessages, type Language, LEVEL_LABELS, TYPE_LABELS } from "@/lib/api/interview";

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [interview, setInterview] = useState<InterviewWithMessages | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("javascript");
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!user) return;

    interviewApi
      .get(id)
      .then((data) => {
        setInterview(data);
        setLanguage(data.language);
        setCode(STARTER_CODE[data.language]);
      })
      .catch((err) => setError(err.message));
  }, [id, user]);

  if (error) {
    return (
      <AppShell>
        <div className="p-8">
          <p className="text-red-500">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (authLoading || !interview) {
    return <PageLoader text="Loading interview..." />;
  }

  const handleSend = async (content: string, attachCode: boolean) => {
    setSending(true);
    try {
      const { userMessage, aiMessage } = await interviewApi.sendMessage(interview.id, {
        content,
        ...(attachCode && { code, language }),
      });
      setInterview((prev) => prev && { ...prev, messages: [...prev.messages, userMessage, aiMessage] });
    } catch (err: any) {
      alert(err.message || "Could not send the message");
      throw err; // lets the chat put the text back
    } finally {
      setSending(false);
    }
  };

  // Swap in the new starter code, but only if the user has not written anything yet
  const handleLanguageChange = (newLanguage: Language) => {
    if (code === STARTER_CODE[language]) {
      setCode(STARTER_CODE[newLanguage]);
    }
    setLanguage(newLanguage);
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      const ended = await interviewApi.end(interview.id);
      setInterview({ ...ended, messages: interview.messages });
      setShowEndDialog(false);
    } catch (err: any) {
      alert(err.message || "Could not end the interview");
    } finally {
      setEnding(false);
    }
  };

  const header = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">
          {interview.role}
          {interview.company && <span className="text-muted-foreground"> at {interview.company}</span>}
        </h1>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{TYPE_LABELS[interview.type]}</Badge>
          <Badge variant="outline">{LEVEL_LABELS[interview.level]}</Badge>
        </div>
      </div>
      {interview.status === "IN_PROGRESS" && (
        <Button variant="destructive" onClick={() => setShowEndDialog(true)}>
          End interview
        </Button>
      )}
    </div>
  );

  // Finished: report + the whole chat, read-only
  if (interview.status === "COMPLETED") {
    return (
      <AppShell>
        <div className="p-8 max-w-4xl space-y-6">
          {header}
          <InterviewScore interview={interview} />
          <Card>
            <h2 className="text-xl font-semibold px-4 pt-4">Transcript</h2>
            <InterviewChat messages={interview.messages} />
          </Card>
        </div>
      </AppShell>
    );
  }

  const userAnswers = interview.messages.filter((m) => m.sender === "USER").length;

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-64px)] p-6 gap-4">
        {header}

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto lg:overflow-hidden">
          <Card className="min-h-[500px] lg:min-h-0 overflow-hidden">
            <InterviewChat messages={interview.messages} onSend={handleSend} sending={sending} />
          </Card>
          <Card className="min-h-[500px] lg:min-h-0 overflow-hidden">
            <CodePanel
              code={code}
              language={language}
              onCodeChange={setCode}
              onLanguageChange={handleLanguageChange}
              onRun={(stdin) => interviewApi.runCode(interview.id, { code, language, stdin })}
            />
          </Card>
        </div>
      </div>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End the interview?</AlertDialogTitle>
            <AlertDialogDescription>
              You answered {userAnswers} {userAnswers === 1 ? "question" : "questions"}. The AI will score the whole
              interview, and you can't send more answers after this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ending}>Keep going</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleEnd();
              }}
              disabled={ending}
            >
              {ending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ending ? "Scoring..." : "End and get score"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
