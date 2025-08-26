/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["cdn.builder.io"],
  },
  // Fix for HMR fetch issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Improve development server stability
  experimental: {
    webpackBuildWorker: true,
  },
};

module.exports = nextConfig;
