import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',
  basePath: isProd ? '/hunt2026/mass_confusion' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
