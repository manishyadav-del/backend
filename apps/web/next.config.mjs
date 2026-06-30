/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ahealthplace.com' },
      { protocol: 'https', hostname: 'earthbyhumans.s3-eu-central-2.ionoscloud.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Windows and OneDrive compatibility fixes
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'mysql2', 'grapesjs', 'grapesjs-blocks-basic', 'grapesjs-preset-webpage'],
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**', '**/dist/**'],
      };
      config.cache = false;
    }
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        fs: false,
        net: false,
        tls: false,
      },
    };
    return config;
  },
};

export default nextConfig;
