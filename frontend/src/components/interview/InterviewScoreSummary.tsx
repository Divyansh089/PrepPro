"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, CheckCircle2, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Metric {
  label: string;
  score: number;
}

interface InterviewScoreSummaryProps {
  overallScore: number;
  metrics: Metric[];
  feedback: string;
  strengths: string[];
  improvements: string[];
  onRestart: () => void;
}

export default function InterviewScoreSummary({
  overallScore,
  metrics,
  feedback,
  strengths,
  improvements,
  onRestart,
}: InterviewScoreSummaryProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 my-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
            <Trophy className="w-10 h-10 text-amber-800" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Interview Completed!</h2>
          <p className="text-gray-500 text-sm mt-1">Here is your AI-evaluated candidate scorecard</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-r from-[#6633FF] to-[#AA66FF] rounded-2xl p-6 text-white text-center mb-8 shadow-xl">
          <span className="text-xs uppercase font-semibold tracking-wider text-white/80">Overall Score</span>
          <div className="text-5xl font-extrabold mt-1">{overallScore}%</div>
          <p className="text-xs text-white/90 mt-2">
            {overallScore >= 80 ? "Strong Hire Recommendation" : overallScore >= 60 ? "Potential Hire — Needs Practice" : "Requires Preparation"}
          </p>
        </div>

        {/* Metric Bars */}
        <div className="space-y-4 mb-8">
          <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Category Performance Breakdown</h3>
          {metrics.map((m, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>{m.label}</span>
                <span>{m.score}%</span>
              </div>
              <Progress value={m.score} className="h-2 bg-gray-100" />
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="space-y-4 mb-8 text-sm">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="font-bold text-gray-900 mb-1">AI Evaluator Summary:</p>
            <p className="text-gray-600 leading-relaxed text-xs">{feedback}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {strengths.length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="font-bold text-emerald-800 mb-1">Key Strengths:</p>
                <ul className="list-disc pl-4 text-emerald-700 space-y-0.5">
                  {strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {improvements.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="font-bold text-amber-800 mb-1">Areas for Growth:</p>
                <ul className="list-disc pl-4 text-amber-700 space-y-0.5">
                  {improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onRestart}
            className="flex-1 border-gray-200 text-gray-700 font-bold"
          >
            Start New Session
          </Button>

          <Button
            asChild
            className="flex-1 bg-[#6633FF] hover:bg-[#5522EE] text-white font-bold gap-2"
          >
            <Link href="/insights">
              <BarChart3 className="w-4 h-4" />
              View Full Insights
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
