"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { leaderboardApi, type Leaderboard, type LeaderboardEntry } from "@/lib/api/leaderboard";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
  return <span className="font-semibold text-muted-foreground">#{rank}</span>;
}

function UserAvatar({ entry, size = "w-10 h-10" }: { entry: LeaderboardEntry; size?: string }) {
  return (
    <Avatar className={size}>
      {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} alt={entry.name} />}
      <AvatarFallback>{initials(entry.name)}</AvatarFallback>
    </Avatar>
  );
}

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Leaderboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    leaderboardApi
      .get(50)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [user]);

  if (error) {
    return (
      <AppShell>
        <div className="p-8">
          <p className="text-red-500">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (authLoading || !user || !data) {
    return <PageLoader text="Loading leaderboard..." />;
  }

  const podium = data.top.slice(0, 3);

  return (
    <AppShell>
      <div className="p-8 max-w-5xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground text-lg">
            Points come from assessments and mock interviews. Practice tests don&apos;t count.
          </p>
        </div>

        {/* Your rank */}
        <Card className="p-6 bg-primary/5 border-primary/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{data.me.rank ? `#${data.me.rank}` : "—"}</div>
                <p className="text-sm text-muted-foreground">Your rank</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-2xl font-semibold">{data.me.points.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total points</p>
              </div>
            </div>
            {data.me.rank === null && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">Earn points to get a rank.</p>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" asChild>
                    <Link href="/tests">Take an assessment</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/interview">Mock interview</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {data.top.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No one has points yet. Finish an assessment to be the first!
          </Card>
        ) : (
          <>
            {/* Top 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {podium.map((entry) => (
                <Card
                  key={entry.id}
                  className={`p-6 text-center ${entry.id === user.id ? "border-primary" : ""}`}
                >
                  <div className="flex justify-center mb-3">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <div className="flex justify-center mb-3">
                    <UserAvatar entry={entry} size="w-16 h-16" />
                  </div>
                  <h3 className="font-semibold text-lg">{entry.name}</h3>
                  {entry.college && <p className="text-xs text-muted-foreground">{entry.college}</p>}
                  <p className="text-2xl font-bold mt-3">{entry.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </Card>
              ))}
            </div>

            {/* Full table */}
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold w-24">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top.map((entry) => {
                    const isMe = entry.id === user.id;
                    return (
                      <tr key={entry.id} className={`border-b border-border last:border-0 ${isMe ? "bg-primary/10" : ""}`}>
                        <td className="px-6 py-3">
                          <RankIcon rank={entry.rank} />
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar entry={entry} />
                            <div>
                              <div className="font-medium">
                                {entry.name} {isMe && <Badge className="ml-1">You</Badge>}
                              </div>
                              {entry.college && <div className="text-xs text-muted-foreground">{entry.college}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">{entry.points.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
