import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Untuk development, disable optimization
    unoptimized: process.env.NODE_ENV == 'development',
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apollo-umbrose-nonadjunctively.ngrok-free.dev',
        // pathname: '/storage/**', // HAPUS pathname spesifik
        pathname: '/**', // PAKAI /** untuk semua path
      },
      {
        protocol: 'https',
        hostname: '*.ngrok-free.dev', // GANTI dari ** ke *
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ngrok.io',
        pathname: '/**',
      },
      // Tambahkan untuk local development juga
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.104.nip.io',
        pathname: '/**',
      },
    ],
    
    // Optional: tambahkan konfigurasi lain
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',

    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  compress: true,

  swcMinify: true,

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            
            // Vendor chunk (node_modules)
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            
            // Common chunk (shared code)
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            
            // UI components chunk
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Tambahkan untuk debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  experimental: {
    // ✅ Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@/components/ui',
      '@/hooks',
    ],
    
    // ✅ Enable turbopack (faster builds)
    // turbo: {},
  },
};

export default nextConfig;