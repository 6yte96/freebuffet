import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages (project pages).
 * Deployed at https://6yte96.github.io/freebuffet/
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "/freebuffet",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
