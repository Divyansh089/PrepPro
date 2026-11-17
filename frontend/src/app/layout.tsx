import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrepPro - Placement and Interview Prep",
  description: "Practice tests, scored assessments, AI mock interviews and a leaderboard to get you ready for placements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
