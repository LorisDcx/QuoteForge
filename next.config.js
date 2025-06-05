/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  // Configuration pour Netlify
  output: 'standalone',
  // Configuration pour le prérendu statique avec App Router
  generateBuildId: async () => {
    // Vous pouvez utiliser un ID de build fixe pour améliorer la mise en cache
    return 'quoteforge-build'
  },
};

module.exports = nextConfig;
