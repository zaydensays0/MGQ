
import type {NextConfig} from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';

// Base Next.js config
const baseNextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

let finalConfig: NextConfig = baseNextConfig;

// Only apply PWA configuration for non-development environments
if (!isDevelopment) {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    // The 'disable' flag is effectively handled by this conditional block for development.
    // If you need to disable PWA for other specific non-dev scenarios, you might adjust logic here.
  });
  finalConfig = withPWA(baseNextConfig);
}

export default finalConfig;
