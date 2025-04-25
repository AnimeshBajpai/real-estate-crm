import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't run ESLint during build, we'll handle linting separately
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
