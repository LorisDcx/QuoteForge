/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  // Désactiver le prérendu statique pour certaines pages
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/quotes': { page: '/quotes' },
      // Ne pas inclure /quotes/editor dans le prérendu statique
    };
  },
  // Configuration pour Netlify
  output: 'standalone',
};

module.exports = nextConfig;
