/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        http: false,
        https: false,
        net: false,
        tls: false,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
