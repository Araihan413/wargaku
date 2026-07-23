import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /* config options here */
  allowedDevOrigins: [
    "192.168.10.34",
  ],
};

export default nextConfig;
