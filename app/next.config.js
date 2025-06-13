const { i18n } = require("./next-i18next.config")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize for performance
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Enable experimental features
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
  // Configure webpack for module system
  webpack: (config, { isServer }) => {
    // Allow dynamic imports from modules directory
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }

    return config
  },
}

module.exports = nextConfig
