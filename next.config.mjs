/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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
