/**
 * Static export for GitHub Pages.
 *
 * basePath must match the repository name or every asset 404s under the Pages
 * subpath — a failure that does not reproduce in `next dev`, only in `pnpm preview`.
 * Set BASE_PATH="" locally to preview at the root.
 */
const basePath = process.env.BASE_PATH ?? '/rantai'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

module.exports = nextConfig
