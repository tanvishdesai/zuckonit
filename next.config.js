/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cloud.appwrite.io'],
    formats: ['image/webp', 'image/avif']
  },
  // Optimize for production
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Handle build errors gracefully
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  experimental: {
    optimizeCss: true
  }
}

module.exports = nextConfig
