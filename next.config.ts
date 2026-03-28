import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Serverless function timeout optimization for Vercel */
  serverRuntimeConfig: {
    maxDuration: 60,
  },
  
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

  /* Experimental features for better performance */
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;
