import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Web Vitals 監控配置
 */
export interface WebVitalsConfig {
  enableConsoleLogging?: boolean;
  enableAnalytics?: boolean;
  analyticsEndpoint?: string;
  thresholds?: {
      LCP?: number;
      INP?: number;
      CLS?: number;
      FCP?: number;
      TTFB?: number;
    };
}

/**
 * 性能指標數據
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * Web Vitals 監控器
 */
export class WebVitalsMonitor {
  private config: WebVitalsConfig;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(config: WebVitalsConfig = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableAnalytics: false,
      thresholds: {
        LCP: 2500,  // 2.5s
        INP: 200,   // 200ms
        CLS: 0.1,   // 0.1
        FCP: 1800,  // 1.8s
        TTFB: 800   // 800ms
      },
      ...config
    };

    this.initializeMonitoring();
  }

  /**
   * 初始化性能監控
   */
  private initializeMonitoring(): void {
    // 監控 Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    
    // 監控其他重要指標
    onFCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // 自定義性能監控
    this.setupCustomObservers();
  }

  /**
   * 設置自定義性能觀察器
   */
  private setupCustomObservers(): void {
    // 監控長任務
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleLongTask(entry as PerformanceEntry);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch {
        console.warn('Long task observer not supported');
      }

      // 監控導航時間
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch {
        console.warn('Navigation observer not supported');
      }

      // 監控資源加載
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleResourceTiming(entry as PerformanceResourceTiming);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch {
        console.warn('Resource observer not supported');
      }
    }
  }

  /**
   * 處理 Web Vitals 指標
   */
  private handleMetric(metric: Metric): void {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.set(metric.name, performanceMetric);

    if (this.config.enableConsoleLogging) {
      this.logMetric(performanceMetric);
    }

    if (this.config.enableAnalytics) {
      this.sendToAnalytics(performanceMetric);
    }

    // 檢查性能警告
    this.checkPerformanceWarnings(performanceMetric);
  }

  /**
   * 處理長任務
   */
  private handleLongTask(entry: PerformanceEntry): void {
    const duration = entry.duration;
    if (duration > 50) { // 超過 50ms 的任務
      const metric: PerformanceMetric = {
        name: 'Long Task',
        value: duration,
        rating: duration > 100 ? 'poor' : 'needs-improvement',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      if (this.config.enableConsoleLogging) {
        console.warn(`Long task detected: ${duration}ms`);
      }

      this.metrics.set(`longtask-${entry.startTime}`, metric);
    }
  }

  /**
   * 處理導航時間
   */
  private handleNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connection': entry.connectEnd - entry.connectStart,
      'Request': entry.responseStart - entry.requestStart,
      'Response': entry.responseEnd - entry.responseStart,
      'DOM Processing': entry.domComplete - entry.domContentLoadedEventStart
    };

    for (const [name, value] of Object.entries(metrics)) {
      const metric: PerformanceMetric = {
        name,
        value,
        rating: this.getRating(name, value),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      this.metrics.set(name.toLowerCase().replace(' ', '-'), metric);
    }
  }

  /**
   * 處理資源加載時間
   */
  private handleResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    
    // 只監控較慢的資源
    if (duration > 1000) {
      const metric: PerformanceMetric = {
        name: 'Slow Resource',
        value: duration,
        rating: duration > 3000 ? 'poor' : 'needs-improvement',
        timestamp: Date.now(),
        url: entry.name,
        userAgent: navigator.userAgent
      };

      this.metrics.set(`resource-${entry.startTime}`, metric);
    }
  }

  /**
   * 獲取性能評級
   */
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    
    switch (metricName) {
      case 'LCP':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'INP':
        return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
      case 'CLS':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'FCP':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'TTFB':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  }

  /**
   * 記錄指標
   */
  private logMetric(metric: PerformanceMetric): void {
    const color = metric.rating === 'good' ? 'green' : 
                  metric.rating === 'needs-improvement' ? 'orange' : 'red';
    
    console.log(
      `%c${metric.name}: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }

  /**
   * 發送到分析服務
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    if (!this.config.analyticsEndpoint) return;

    fetch(this.config.analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    }).catch(error => {
      console.error('Failed to send metric to analytics:', error);
    });
  }

  /**
   * 檢查性能警告
   */
  private checkPerformanceWarnings(metric: PerformanceMetric): void {
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name} performance detected: ${metric.value}ms`);
      
      // 提供優化建議
      this.provideOptimizationSuggestions(metric.name);
    }
  }

  /**
   * 提供優化建議
   */
  private provideOptimizationSuggestions(metricName: string): void {
    const suggestions: Record<string, string[]> = {
      'LCP': [
        '優化圖片大小和格式',
        '使用 CDN 加速資源加載',
        '減少關鍵渲染路徑中的資源',
        '使用 preload 預加載重要資源'
      ],
      'INP': [
        '減少 JavaScript 執行時間',
        '使用 Web Workers 處理重計算',
        '優化事件處理器',
        '延遲載入非關鍵 JavaScript',
        '避免長時間運行的任務',
        '優化第三方腳本'
      ],
      'CLS': [
        '為圖片和廣告設置尺寸屬性',
        '避免在現有內容上方插入內容',
        '使用 transform 動畫而非改變佈局屬性',
        '預留動態內容空間'
      ]
    };

    const metricSuggestions = suggestions[metricName];
    if (metricSuggestions) {
      console.group(`${metricName} 優化建議:`);
      metricSuggestions.forEach(suggestion => {
        console.log(`• ${suggestion}`);
      });
      console.groupEnd();
    }
  }

  /**
   * 獲取所有指標
   */
  public getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  /**
   * 獲取特定指標
   */
  public getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * 生成性能報告
   */
  public generateReport(): {
    coreWebVitals: Record<string, PerformanceMetric>;
    otherMetrics: Record<string, PerformanceMetric>;
    summary: {
      totalMetrics: number;
      goodMetrics: number;
      needsImprovementMetrics: number;
      poorMetrics: number;
    };
  } {
    const coreWebVitals: Record<string, PerformanceMetric> = {};
    const otherMetrics: Record<string, PerformanceMetric> = {};
    
    let goodCount = 0;
    let needsImprovementCount = 0;
    let poorCount = 0;

    for (const [name, metric] of this.metrics) {
      if (['LCP', 'INP', 'CLS'].includes(metric.name)) {
        coreWebVitals[name] = metric;
      } else {
        otherMetrics[name] = metric;
      }

      switch (metric.rating) {
        case 'good':
          goodCount++;
          break;
        case 'needs-improvement':
          needsImprovementCount++;
          break;
        case 'poor':
          poorCount++;
          break;
      }
    }

    return {
      coreWebVitals,
      otherMetrics,
      summary: {
        totalMetrics: this.metrics.size,
        goodMetrics: goodCount,
        needsImprovementMetrics: needsImprovementCount,
        poorMetrics: poorCount
      }
    };
  }

  /**
   * 清理監控器
   */
  public cleanup(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.metrics.clear();
  }
}

/**
 * 全局 Web Vitals 監控實例
 */
let globalMonitor: WebVitalsMonitor | null = null;

/**
 * 初始化 Web Vitals 監控
 */
export const initWebVitalsMonitoring = (config?: WebVitalsConfig): WebVitalsMonitor => {
  if (globalMonitor) {
    globalMonitor.cleanup();
  }
  
  globalMonitor = new WebVitalsMonitor(config);
  return globalMonitor;
};

/**
 * 獲取全局監控實例
 */
export const getWebVitalsMonitor = (): WebVitalsMonitor | null => {
  return globalMonitor;
};

const webVitalsExports = {
  WebVitalsMonitor,
  initWebVitalsMonitoring,
  getWebVitalsMonitor
};

export default webVitalsExports;