"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play } from "lucide-react";
import { type Language, type RunResult, LANGUAGE_LABELS } from "@/lib/api/interview";

export const STARTER_CODE: Record<Language, string> = {
  javascript: `// Read input with: require("fs").readFileSync(0, "utf8")
function solve() {
  console.log("Hello");
}

solve();
`,
  python: `# Read input with: input()
def solve():
    print("Hello")

solve()
`,
  java: `// The class must be called Main
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello" << endl;
    return 0;
}
`,
};

// Monaco uses slightly different language names
const MONACO_LANGUAGE: Record<Language, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
};

type Props = {
  code: string;
  language: Language;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: Language) => void;
  onRun: (stdin: string) => Promise<RunResult>;
};

// Code editor with a "Run" button. Runs are not saved.
export default function CodePanel({ code, language, onCodeChange, onLanguageChange, onRun }: Props) {
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");

  const handleRun = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      setResult(await onRun(stdin));
    } catch (err: any) {
      setError(err.message || "Could not run the code");
    } finally {
      setRunning(false);
    }
  };

  const failed = result && result.status !== "Accepted";

  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-3">
      <div className="flex items-center justify-between gap-2">
        <Select value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
          <SelectTrigger className="w-40">
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
        <Button size="sm" onClick={handleRun} disabled={running || !code.trim()}>
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {running ? "Running..." : "Run"}
        </Button>
      </div>

      <div className="flex-1 min-h-[250px] rounded-md overflow-hidden border border-border">
        <Editor
          height="100%"
          theme="vs-dark"
          language={MONACO_LANGUAGE[language]}
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
        />
      </div>

      <Textarea
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder="Input (stdin), optional"
        rows={2}
        className="resize-none font-mono text-xs"
      />

      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs font-mono h-36 overflow-auto">
        {!result && !error && <p className="text-muted-foreground">Output will appear here.</p>}
        {error && <p className="text-red-500">{error}</p>}
        {result && (
          <>
            <p className={failed ? "text-red-500" : "text-green-500"}>
              {result.status}
              {result.time !== null && <span className="text-muted-foreground"> · {result.time}s</span>}
            </p>
            {result.stdout && <pre className="whitespace-pre-wrap mt-2">{result.stdout}</pre>}
            {result.stderr && <pre className="whitespace-pre-wrap mt-2 text-red-400">{result.stderr}</pre>}
          </>
        )}
      </div>
    </div>
  );
}
