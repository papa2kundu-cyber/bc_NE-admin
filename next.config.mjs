/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'brightocityinterior.com',
        port: '',
        pathname: '/backend/storage/**',
      },
    ],
  },
};

export default nextConfig;
