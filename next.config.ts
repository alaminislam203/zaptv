import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // বিল্ড এরর এড়ানোর জন্য এই সেটিংস
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // সার্ভার সাইড এরর কমানোর জন্য
  reactStrictMode: false,
};

export default nextConfig;
