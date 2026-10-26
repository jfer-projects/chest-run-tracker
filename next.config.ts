import type { NextConfig } from 'next';

// GitHub Pages serves the site from /chest-run-tracker/; local dev stays at the root.
const basePath = process.env.PAGES === 'true' ? '/chest-run-tracker' : '';

const nextConfig: NextConfig = {
  // Dev server uses its own folder so it never clashes with `next build` (used for Pages and Android).
  distDir: process.env.DEV_DIST || '.next',
  output: 'export',
  trailingSlash: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true },
};

export default nextConfig;
