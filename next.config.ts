import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false, // Disable double-invoke in dev (Socket.IO join/leave noise)
  turbopack: {
    resolveAlias: {
      "proxy-from-env": "./src/lib/proxyFromEnvShim.ts",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "proxy-from-env": require.resolve("./src/lib/proxyFromEnvShim.ts"),
    };
    return config;
  },
};

export default nextConfig;
