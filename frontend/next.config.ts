import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Untuk development, disable optimization
    unoptimized: true, // GANTI INI dari conditional ke true
    
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
  },
  
  // Tambahkan untuk debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Experimental features untuk image
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;