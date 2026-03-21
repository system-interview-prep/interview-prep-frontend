import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false, // Disable double-invoke in dev (Socket.IO join/leave noise)
};

export default nextConfig;
