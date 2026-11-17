"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Brain, Loader2, Send, User } from "lucide-react";
import type { InterviewMessage } from "@/lib/api/interview";

type Props = {
  messages: InterviewMessage[];
  // Not passed for a finished interview, which makes the chat read-only
  onSend?: (content: string, attachCode: boolean) => Promise<void>;
  sending?: boolean;
};

export default function InterviewChat({ messages, onSend, sending }: Props) {
  const [text, setText] = useState("");
  const [attachCode, setAttachCode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view (not for a finished interview, where the report is shown first)
  useEffect(() => {
    if (onSend) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, onSend]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!onSend || !text.trim() || sending) return;

    const content = text;
    setText("");
    try {
      await onSend(content, attachCode);
      setAttachCode(false);
    } catch {
      setText(content); // give the text back so it is not lost
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAi = m.sender === "AI";
          return (
            <div key={m.id} className={`flex gap-3 max-w-[90%] ${isAi ? "" : "ml-auto flex-row-reverse"}`}>
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                {isAi ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`rounded-lg p-3 text-sm ${isAi ? "bg-muted" : "bg-primary/15"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
                {m.code && (
                  <pre className="mt-2 p-2 rounded bg-background text-xs overflow-x-auto">
                    <code>{m.code}</code>
                  </pre>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Interviewer is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {onSend && (
        <form onSubmit={handleSubmit} className="border-t border-border p-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer... (Enter to send, Shift+Enter for a new line)"
            rows={3}
            maxLength={5000}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="attach-code" checked={attachCode} onCheckedChange={(c) => setAttachCode(c === true)} />
              <Label htmlFor="attach-code" className="text-sm font-normal cursor-pointer">
                Send my code with this answer
              </Label>
            </div>
            <Button type="submit" size="sm" disabled={!text.trim() || sending}>
              <Send className="w-4 h-4 mr-2" /> Send
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
