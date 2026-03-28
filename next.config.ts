import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Webpack config for pdfjs-dist */
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      zlib: false,
    };
    return config;
  },

  /* Turbopack config (empty to acknowledge migration) */
  turbopack: {},

  /* Experimental features for better performance */
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;
