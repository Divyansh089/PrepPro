"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import {
  testsApi,
  type Category,
  type CategoryInfo,
  type Difficulty,
  type TestMode,
  DIFFICULTY_LABELS,
} from "@/lib/api/tests";

const QUESTION_COUNTS = [5, 10, 15];

// Pick a category + difficulty + number of questions, then start a test.
// Used by both /practice and /tests.
export default function TestStarter({ mode }: { mode: TestMode }) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    testsApi
      .getCategories()
      .then((data) => {
        setCategories(data.categories);
        setDifficulties(data.difficulties);

        // Links like /practice?category=DBMS pick that category for you
        const fromUrl = new URLSearchParams(window.location.search).get("category");
        const match = data.categories.find((c) => c.id === fromUrl);
        if (match) setCategory(match.id);
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleStart = async () => {
    if (!category) return;
    setError("");
    setStarting(true);

    try {
      const test = await testsApi.create({ mode, category, difficulty, count });
      router.push(`/tests/${test.id}/take`);
    } catch (err: any) {
      setError(err.message || "Could not start the test");
      setStarting(false);
    }
  };

  const groups = ["Aptitude", "Technical"] as const;

  return (
    <Card className="p-6 space-y-6">
      {groups.map((group) => (
        <div key={group}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{group}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories
              .filter((c) => c.group === group)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  disabled={starting}
                  className={`rounded-lg border p-4 text-left text-sm font-medium transition-colors ${
                    category === c.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-8">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Difficulty</h3>
          <div className="flex gap-2">
            {difficulties.map((d) => (
              <Button
                key={d}
                type="button"
                size="sm"
                variant={difficulty === d ? "default" : "outline"}
                onClick={() => setDifficulty(d)}
                disabled={starting}
              >
                {DIFFICULTY_LABELS[d]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Questions</h3>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={count === n ? "default" : "outline"}
                onClick={() => setCount(n)}
                disabled={starting}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-4">
        <Button onClick={handleStart} disabled={!category || starting}>
          {starting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {starting ? "Generating questions..." : "Start"}
        </Button>
        {!category && <span className="text-sm text-muted-foreground">Pick a category to begin</span>}
      </div>
    </Card>
  );
}
