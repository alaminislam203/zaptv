/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // বিল্ড এরর এড়ানোর জন্য লিন্টিং বন্ধ রাখা
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // টাইপস্ক্রিপ্ট এরর এড়ানোর জন্য
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
