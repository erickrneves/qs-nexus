/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployments
  experimental: {
    serverComponentsExternalPackages: ['drizzle-orm', 'postgres'],
  },
}

export default nextConfig
