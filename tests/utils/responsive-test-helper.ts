/**
 * 響應式設計測試工具
 * 提供自動化測試響應式設計的工具函數
 */

import { Page, expect } from '@playwright/test';

export interface ViewportConfig {
  width: number;
  height: number;
  name: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface ResponsiveTestConfig {
  viewports: ViewportConfig[];
  elements: string[];
  breakpoints: Record<string, number>;
  touchTargetMinSize: number;
}

/**
 * 預設的響應式測試配置
 */
export const defaultResponsiveConfig: ResponsiveTestConfig = {
  viewports: [
    { width: 320, height: 568, name: 'iPhone SE', deviceType: 'mobile' },
    { width: 375, height: 667, name: 'iPhone 8', deviceType: 'mobile' },
    { width: 414, height: 896, name: 'iPhone 11', deviceType: 'mobile' },
    { width: 768, height: 1024, name: 'iPad', deviceType: 'tablet' },
    { width: 1024, height: 1366, name: 'iPad Pro', deviceType: 'tablet' },
    { width: 1280, height: 720, name: 'Desktop Small', deviceType: 'desktop' },
    { width: 1920, height: 1080, name: 'Desktop Large', deviceType: 'desktop' },
    { width: 2560, height: 1440, name: 'Desktop XL', deviceType: 'desktop' }
  ],
  elements: ['header', 'main', 'nav', 'footer', '.card', '.button'],
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1280
  },
  touchTargetMinSize: 44
};

/**
 * 響應式測試工具類
 */
export class ResponsiveTestHelper {
  constructor(private page: Page, private config: ResponsiveTestConfig = defaultResponsiveConfig) {}

  /**
   * 測試所有視窗大小下的佈局
   */
  async testAllViewports(testCallback: (viewport: ViewportConfig) => Promise<void>) {
    for (const viewport of this.config.viewports) {
      await this.setViewport(viewport);
      await testCallback(viewport);
    }
  }

  /**
   * 設置視窗大小並等待佈局穩定
   */
  async setViewport(viewport: ViewportConfig) {
    await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
    await this.page.waitForTimeout(200); // 等待佈局穩定
  }

  /**
   * 檢查元素在當前視窗下是否可見
   */
  async checkElementVisibility(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * 檢查所有重要元素的可見性
   */
  async checkAllElementsVisibility(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const selector of this.config.elements) {
      results[selector] = await this.checkElementVisibility(selector);
    }
    
    return results;
  }

  /**
   * 檢查觸摸目標大小
   */
  async checkTouchTargets(): Promise<{ selector: string; width: number; height: number; isValid: boolean }[]> {
    const results = [];
    const touchElements = await this.page.locator('button, a, [role="button"], .touch-target').all();
    
    for (const element of touchElements) {
      const box = await element.boundingBox();
      if (box && await element.isVisible()) {
        const isValid = box.width >= this.config.touchTargetMinSize && 
                       box.height >= this.config.touchTargetMinSize;
        
        results.push({
          selector: await element.getAttribute('class') || 'unknown',
          width: box.width,
          height: box.height,
          isValid
        });
      }
    }
    
    return results;
  }

  /**
   * 檢查文字是否被截斷
   */
  async checkTextOverflow(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    
    try {
      const { scrollWidth, clientWidth } = await element.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      }));
      
      return scrollWidth > clientWidth;
    } catch {
      return false;
    }
  }

  /**
   * 檢查元素是否重疊
   */
  async checkElementOverlap(selector1: string, selector2: string): Promise<boolean> {
    const element1 = this.page.locator(selector1);
    const element2 = this.page.locator(selector2);
    
    const box1 = await element1.boundingBox();
    const box2 = await element2.boundingBox();
    
    if (!box1 || !box2) return false;
    
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }

  /**
   * 檢查是否有水平滾動條
   */
  async hasHorizontalScroll(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
  }

  /**
   * 測試容器查詢響應
   */
  async testContainerQueries(containerSelector: string, expectedBehaviors: Record<number, string[]>) {
    for (const [width, expectedClasses] of Object.entries(expectedBehaviors)) {
      await this.page.setViewportSize({ width: parseInt(width), height: 800 });
      await this.page.waitForTimeout(100);
      
      const container = this.page.locator(containerSelector);
      
      for (const className of expectedClasses) {
        await expect(container).toHaveClass(new RegExp(className));
      }
    }
  }

  /**
   * 測試流體排版
   */
  async testFluidTypography(selector: string, expectedSizes: Record<number, { min: number; max: number }>) {
    for (const [width, { min, max }] of Object.entries(expectedSizes)) {
      await this.page.setViewportSize({ width: parseInt(width), height: 800 });
      await this.page.waitForTimeout(100);
      
      const fontSize = await this.page.locator(selector).evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      
      expect(fontSize).toBeGreaterThanOrEqual(min);
      expect(fontSize).toBeLessThanOrEqual(max);
    }
  }

  /**
   * 生成響應式測試報告
   */
  async generateReport(): Promise<{
    viewport: ViewportConfig;
    visibility: Record<string, boolean>;
    touchTargets: { valid: number; invalid: number; details: unknown[] };
    hasHorizontalScroll: boolean;
    textOverflows: string[];
  }[]> {
    const reports = [];
    
    for (const viewport of this.config.viewports) {
      await this.setViewport(viewport);
      
      const visibility = await this.checkAllElementsVisibility();
      const touchTargets = await this.checkTouchTargets();
      const hasHorizontalScroll = await this.hasHorizontalScroll();
      
      // 檢查文字溢出
      const textOverflows = [];
      for (const selector of ['h1', 'h2', 'h3', 'p', '.text-content']) {
        if (await this.checkTextOverflow(selector)) {
          textOverflows.push(selector);
        }
      }
      
      reports.push({
        viewport,
        visibility,
        touchTargets: {
          valid: touchTargets.filter(t => t.isValid).length,
          invalid: touchTargets.filter(t => !t.isValid).length,
          details: touchTargets.filter(t => !t.isValid)
        },
        hasHorizontalScroll,
        textOverflows
      });
    }
    
    return reports;
  }

  /**
   * 截圖對比測試
   */
  async takeResponsiveScreenshots(name: string): Promise<void> {
    for (const viewport of this.config.viewports) {
      await this.setViewport(viewport);
      await expect(this.page).toHaveScreenshot(`${name}-${viewport.name}.png`);
    }
  }

  /**
   * 測試性能指標
   */
  async measurePerformance(): Promise<{
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  }> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: Record<string, unknown> = {};
        let metricsCollected = 0;
        const totalMetrics = 3; // LCP, FID, CLS
        
        const checkComplete = () => {
          metricsCollected++;
          if (metricsCollected >= totalMetrics) {
            resolve(metrics);
          }
        };
        
        // 測量 LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
          checkComplete();
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // 測量 FID
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          metrics.fid = entries[0].processingStart - entries[0].startTime;
          checkComplete();
        }).observe({ entryTypes: ['first-input'] });
        
        // 測量 CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value || 0;
            }
          }
          metrics.cls = clsValue;
          checkComplete();
        }).observe({ entryTypes: ['layout-shift'] });
        
        // 5秒後超時
        setTimeout(() => resolve(metrics), 5000);
      });
    });
  }
}

/**
 * 快速響應式測試函數
 */
export async function quickResponsiveTest(
  page: Page, 
  url: string, 
  options: Partial<ResponsiveTestConfig> = {}
): Promise<void> {
  const config = { ...defaultResponsiveConfig, ...options };
  const helper = new ResponsiveTestHelper(page, config);
  
  await page.goto(url);
  
  await helper.testAllViewports(async (viewport) => {
    // 檢查基本可見性
    // const _visibility = await helper.checkAllElementsVisibility();
    
    // 檢查是否有水平滾動
    const hasHorizontalScroll = await helper.hasHorizontalScroll();
    expect(hasHorizontalScroll).toBeFalsy();
    
    // 檢查觸摸目標（僅在移動設備上）
    if (viewport.deviceType === 'mobile') {
      const touchTargets = await helper.checkTouchTargets();
      const invalidTargets = touchTargets.filter(t => !t.isValid);
      
      if (invalidTargets.length > 0) {
        console.warn(`Invalid touch targets found on ${viewport.name}:`, invalidTargets);
      }
    }
  });
}

export default ResponsiveTestHelper;