import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Keep file tracing inside the frontend folder (avoids duplicated paths on Vercel)
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
