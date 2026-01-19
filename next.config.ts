import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'hunt2026';
const projectName = 'skilldrasil';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',
  // When deploying to GitHub Pages, the base path is /<repo-name>/<project-name>
  // if you are inside a monorepo structure being built to a specific subpath.
  // OR simply /<repo-name> if the project is the root.
  // Based on your request: cshabsin.github.io/hunt2026/skilldrasil
  basePath: isProd ? `/${repoName}/${projectName}` : '',
  // Images require unoptimized: true for static export unless using a custom loader
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
