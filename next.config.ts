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
  async redirects() {
    return [
      {
        source: "/admin/job_descriptions",
        destination: "/admin/job-descriptions",
        permanent: false,
      },
      {
        source: "/admin/job_descriptions/:path*",
        destination: "/admin/job-descriptions/:path*",
        permanent: false,
      },
      {
        source: "/admin/job-description",
        destination: "/admin/job-descriptions",
        permanent: false,
      },
      {
        source: "/admin/job-description/:path*",
        destination: "/admin/job-descriptions/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
