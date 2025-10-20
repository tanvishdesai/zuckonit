/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cloud.appwrite.io'],
    formats: ['image/webp', 'image/avif']
  },
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Optimize for production
  poweredByHeader: false
}

module.exports = nextConfig
