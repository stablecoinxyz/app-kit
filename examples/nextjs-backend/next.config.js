/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@stablecoin.xyz/react', '@stablecoin.xyz/core', 'viem'],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig; 