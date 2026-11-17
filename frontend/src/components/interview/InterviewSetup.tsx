"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  interviewApi,
  type InterviewType,
  type Language,
  type Level,
  LANGUAGE_LABELS,
  LEVEL_LABELS,
  TYPE_LABELS,
} from "@/lib/api/interview";

// Form to start a new interview. Opens the interview page when it is created.
export default function InterviewSetup({ defaultRole }: { defaultRole?: string }) {
  const router = useRouter();
  const [role, setRole] = useState(defaultRole || "Software Engineer");
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState<Level>("FRESHER");
  const [type, setType] = useState<InterviewType>("TECHNICAL");
  const [language, setLanguage] = useState<Language>("javascript");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStarting(true);
    try {
      const interview = await interviewApi.create({
        role,
        level,
        type,
        language,
        company: company.trim() || undefined,
      });
      router.push(`/interview/${interview.id}`);
    } catch (err: any) {
      setError(err.message || "Could not start the interview");
      setStarting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Start a new interview</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} minLength={2} maxLength={100} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company (optional)</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, TCS, Flipkart"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Experience level</Label>
            <Select value={level} onValueChange={(value) => setLevel(value as Level)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Interview type</Label>
            <Select value={type} onValueChange={(value) => setType(value as InterviewType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Coding language</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={starting}>
          {starting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {starting ? "Starting..." : "Start interview"}
        </Button>
      </form>
    </Card>
  );
}
