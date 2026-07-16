/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.17.50.75"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
