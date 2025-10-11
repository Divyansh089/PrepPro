import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Ensure output file tracing root is the project directory.
  // Using '../../' causes Next to trace files outside the project which can
  // produce duplicated paths on Vercel (e.g. /vercel/path0/vercel/path0/.next/...).
  outputFileTracingRoot: path.resolve(__dirname),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable custom Turbopack loader in dev to avoid Windows chunk errors
  turbopack: undefined
};

export default nextConfig;
