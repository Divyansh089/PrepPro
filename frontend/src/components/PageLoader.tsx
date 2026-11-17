"use client";

import AppShell from "@/components/layout/AppShell";

// Full-page spinner shown while a page loads its data
export default function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{text}</p>
        </div>
      </div>
    </AppShell>
  );
}
