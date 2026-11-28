import type { NextConfig } from "next";

// Backend (FastAPI + Socket.IO) mà Next dev server proxy tới, để chỉ cần 1 tunnel ngrok (port 3000).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || "http://localhost:5000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Socket.IO gọi "/socket.io/?EIO=4..." — không để Next redirect bỏ dấu "/" cuối.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${BACKEND_ORIGIN}/:path*` },
      { source: "/socket.io/:path*", destination: `${BACKEND_ORIGIN}/socket.io/:path*` },
    ];
  },
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
