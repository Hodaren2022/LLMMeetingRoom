import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 支持的圖片格式
    formats: ['image/webp', 'image/avif'],
    
    // 允許的圖片域名 (使用新的 remotePatterns 配置)
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
    
    // 圖片尺寸配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 啟用圖片優化
    unoptimized: false,
    
    // 懶加載配置
    loader: 'default',
    
    // 圖片緩存配置
    minimumCacheTTL: 60,
    
    // 危險的允許 SVG
    dangerouslyAllowSVG: false,
    
    // 內容安全策略
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 實驗性功能
  experimental: {
    // 啟用 App Router 優化
    optimizePackageImports: ['lucide-react'],
  },
  
  // 編譯器優化
  compiler: {
    // 移除 console.log
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 性能優化
  poweredByHeader: false,
  compress: true,
  
  // 重定向配置
  async redirects() {
    return [];
  },
  
  // 頭部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
