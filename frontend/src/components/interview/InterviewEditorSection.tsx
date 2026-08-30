"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
}

interface InterviewEditorSectionProps {
  initialCode?: string;
  onExecuteCode: (code: string, language: string) => Promise<{
    passed: boolean;
    results?: TestResult[];
    output?: string;
  }>;
  hints?: string[];
}

export default function InterviewEditorSection({
  initialCode = "// Write your solution here\nfunction solution() {\n  return true;\n}",
  onExecuteCode,
  hints = [],
}: InterviewEditorSectionProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState("javascript");
  const [executing, setExecuting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [outputConsole, setOutputConsole] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);

  const handleRunCode = async (currentCode: string, currentLang: string) => {
    setExecuting(true);
    try {
      const res = await onExecuteCode(currentCode, currentLang);
      if (res.results) setTestResults(res.results);
      if (res.output) setOutputConsole(res.output);
    } catch (err) {
      setOutputConsole("Error executing code");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 space-y-3 overflow-y-auto">
      {/* Hints toggle */}
      {hints.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHints(!showHints)}
            className="h-8 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 gap-1"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showHints ? "Hide Hints" : "View Hints"}
          </Button>
        </div>
      )}

      {/* Hints panel */}
      {showHints && hints.length > 0 && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1 text-amber-400">
            <Lightbulb className="w-3.5 h-3.5" /> Interview Hints:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            {hints.map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Code Editor component */}
      <CodeEditor
        language={language}
        onLanguageChange={(newLang) => setLanguage(newLang)}
        onCodeChange={(newCode) => setCode(newCode)}
        onRunCode={(runCode, runLang) => handleRunCode(runCode, runLang)}
        initialCode={code}
        isRunning={executing}
        executionResult={
          outputConsole
            ? {
                success: true,
                output: outputConsole,
                testCasesPassed: testResults?.filter((t) => t.passed).length,
                totalTestCases: testResults?.length,
              }
            : undefined
        }
      />
    </div>
  );
}
