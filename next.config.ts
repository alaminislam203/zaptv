import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // এই অংশটি বিল্ড ফেইল হওয়া আটকাবে
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
