/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Windows and OneDrive compatibility fixes
  // Increase timeout for file operations on network/synced drives
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Disable webpack file watching issues on OneDrive
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**', '**/dist/**'],
      };
      // Disable Webpack cache entirely in development to prevent OneDrive file locking/corruption
      config.cache = false;
    }
    // Prevent symlink issues on Windows
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
