import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force rebuild - Version 2.0.0
  // Removed experimental.forceSwcTransforms for Turbopack compatibility
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
