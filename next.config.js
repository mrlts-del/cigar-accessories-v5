// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
  },
  images: {
    domains: ['res.cloudinary.com']
  }
};

module.exports = nextConfig;