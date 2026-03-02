import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 한글 경로 문제로 Turbopack 대신 Webpack 사용
  // experimental: {
  //   turbo: false,
  // },
};

export default nextConfig;
