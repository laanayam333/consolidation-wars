/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    concurrentFeatures: true,
  },
  images: {
    domains: ['assets.vercel.com'],
  },
};

module.exports = nextConfig;
