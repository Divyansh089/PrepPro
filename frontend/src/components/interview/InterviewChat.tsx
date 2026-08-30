"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Mic, Send, Brain, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id?: string;
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
}

interface InterviewChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isEvaluating?: boolean;
}

export default function InterviewChat({ messages, onSendMessage, isEvaluating }: InterviewChatProps) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isEvaluating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isEvaluating) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const toggleSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#6633FF]" />
        <h3 className="font-bold text-gray-800 text-sm">Conversation Transcript</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex gap-3 max-w-[90%] ${msg.role === "candidate" ? "ml-auto flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "interviewer"
                  ? "bg-[#6633FF] text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {msg.role === "interviewer" ? <Brain className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "interviewer"
                  ? "bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-none"
                  : "bg-[#6633FF] text-white rounded-tr-none"
              }`}
            >
              <div className="font-semibold text-xs mb-1 opacity-70">
                {msg.role === "interviewer" ? "AI Interviewer" : "Candidate"} • {msg.timestamp}
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isEvaluating && (
          <div className="flex gap-3 items-center text-gray-500 text-xs italic">
            <div className="w-6 h-6 rounded-full bg-[#6633FF]/10 text-[#6633FF] flex items-center justify-center animate-spin">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span>AI is generating feedback...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 space-y-3">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your response here or click Mic for voice input..."
          rows={3}
          className="resize-none border-gray-200 focus:border-[#6633FF] text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleSpeechRecognition}
            className={`gap-1.5 text-xs ${isListening ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : ""}`}
          >
            <Mic className="w-3.5 h-3.5" />
            {isListening ? "Listening..." : "Voice Input"}
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={!inputText.trim() || isEvaluating}
            className="bg-[#6633FF] hover:bg-[#5522EE] text-white gap-1.5 text-xs font-semibold px-4"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Answer
          </Button>
        </div>
      </form>
    </div>
  );
}
