'use client';

import { useEffect } from 'react';
import { initWebVitalsMonitoring } from '@/utils/webVitalsMonitor';

/**
 * Web Vitals 監控組件
 * 在應用啟動時初始化性能監控
 */
export const WebVitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // 只在生產環境或明確啟用時運行
    const shouldMonitor = process.env.NODE_ENV === 'production' || 
                         process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS === 'true';

    if (shouldMonitor) {
      const monitor = initWebVitalsMonitoring({
        enableConsoleLogging: process.env.NODE_ENV === 'development',
        enableAnalytics: process.env.NODE_ENV === 'production',
        analyticsEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
        thresholds: {
          LCP: 2500,
          FID: 100,
          CLS: 0.1,
          FCP: 1800,
          TTFB: 800
        }
      });

      // 在開發環境中，5秒後生成報告
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const report = monitor.generateReport();
          console.group('📊 Web Vitals 性能報告');
          console.log('Core Web Vitals:', report.coreWebVitals);
          console.log('其他指標:', report.otherMetrics);
          console.log('總結:', report.summary);
          console.groupEnd();
        }, 5000);
      }

      // 清理函數
      return () => {
        monitor.cleanup();
      };
    }
  }, []);

  return <>{children}</>;
};

export default WebVitalsProvider;