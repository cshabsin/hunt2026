import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'hunt2026';
const projectName = 'skilldrasil';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',
  basePath: isProd ? `/${repoName}/${projectName}` : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
