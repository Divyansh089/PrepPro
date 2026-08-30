"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Sparkles, Building2, Code2, Users } from "lucide-react";

interface InterviewSetupProps {
  onStartInterview: (config: {
    role: string;
    experienceLevel: string;
    targetCompany: string;
    interviewType: string;
    questionCount: number;
  }) => void;
  loading?: boolean;
}

export default function InterviewSetup({ onStartInterview, loading }: InterviewSetupProps) {
  const [role, setRole] = useState("Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [targetCompany, setTargetCompany] = useState("Google");
  const [interviewType, setInterviewType] = useState("technical");
  const [questionCount, setQuestionCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInterview({
      role,
      experienceLevel,
      targetCompany,
      interviewType,
      questionCount: Number(questionCount),
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#6633FF]/10 text-[#6633FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Interview Simulator</h1>
        <p className="text-gray-600">Configure your candidate role and start an adaptive AI-conducted interview.</p>
      </div>

      <Card className="p-8 border border-gray-100 shadow-xl rounded-2xl bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="font-semibold text-gray-700 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#6633FF]" />
                Target Role
              </Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, Fullstack Developer"
                className="h-12 border-gray-200 focus:border-[#6633FF]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceLevel" className="font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6633FF]" />
                Experience Level
              </Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger id="experienceLevel" className="h-12 border-gray-200">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresher">Fresher / Entry Level (0-2 yrs)</SelectItem>
                  <SelectItem value="mid">Mid Level (2-5 yrs)</SelectItem>
                  <SelectItem value="senior">Senior Level (5+ yrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#6633FF]" />
                Target Company
              </Label>
              <Input
                id="company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Amazon, Microsoft"
                className="h-12 border-gray-200 focus:border-[#6633FF]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewType" className="font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6633FF]" />
                Interview Type
              </Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger id="interviewType" className="h-12 border-gray-200">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical / Coding & DSA</SelectItem>
                  <SelectItem value="behavioral">Behavioral / Leadership</SelectItem>
                  <SelectItem value="system-design">System Design & Architecture</SelectItem>
                  <SelectItem value="mixed">Mixed Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount" className="font-semibold text-gray-700">
              Number of Questions ({questionCount})
            </Label>
            <Input
              id="questionCount"
              type="range"
              min={1}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="accent-[#6633FF]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-[#6633FF] to-[#AA66FF] text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-[1.01]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing Session...
              </div>
            ) : (
              "Start AI Interview Session"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
