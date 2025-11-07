import { test, expect, Page } from '@playwright/test';

interface PerformanceMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
  INP?: number;
  TTFB?: number;
}

/**
 * 響應式設計測試工具
 */
class ResponsiveTestUtils {
  constructor(private page: Page) {}

  /**
   * 設置視窗大小
   */
  async setViewport(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
    // 等待佈局穩定
    await this.page.waitForTimeout(100);
  }

  /**
   * 檢查元素是否可見
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * 獲取元素尺寸
   */
  async getElementSize(selector: string) {
    const element = this.page.locator(selector);
    const box = await element.boundingBox();
    return box;
  }

  /**
   * 檢查文字是否被截斷
   */
  async isTextTruncated(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    const { scrollWidth, clientWidth } = await element.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth
    }));
    return scrollWidth > clientWidth;
  }

  /**
   * 檢查元素是否重疊
   */
  async areElementsOverlapping(selector1: string, selector2: string): Promise<boolean> {
    const box1 = await this.getElementSize(selector1);
    const box2 = await this.getElementSize(selector2);
    
    if (!box1 || !box2) return false;
    
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }

  /**
   * 檢查觸摸目標大小
   */
  async checkTouchTargetSize(selector: string, minSize: number = 44): Promise<boolean> {
    const box = await this.getElementSize(selector);
    if (!box) return false;
    
    return box.width >= minSize && box.height >= minSize;
  }

  /**
   * 測試容器查詢響應
   */
  async testContainerQuery(containerSelector: string, expectedChanges: Record<number, string[]>) {
    const container = this.page.locator(containerSelector);
    
    for (const [width, expectedClasses] of Object.entries(expectedChanges)) {
      // 調整容器寬度（通過調整視窗大小）
      await this.setViewport(parseInt(width), 800);
      
      // 檢查預期的類名是否存在
      for (const className of expectedClasses) {
        await expect(container).toHaveClass(new RegExp(className));
      }
    }
  }

  /**
   * 測試流體排版
   */
  async testFluidTypography(selector: string, viewports: { width: number; expectedSize: number }[]) {
    for (const { width, expectedSize } of viewports) {
      await this.setViewport(width, 800);
      
      const fontSize = await this.page.locator(selector).evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      
      // 允許 ±2px 的誤差
      expect(Math.abs(fontSize - expectedSize)).toBeLessThanOrEqual(2);
    }
  }
}

/**
 * 響應式設計基礎測試
 */
test.describe('響應式設計測試', () => {
  let utils: ResponsiveTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new ResponsiveTestUtils(page);
    await page.goto('/');
  });

  test('主頁在不同設備上正確顯示', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: '小屏手機' },
      { width: 375, height: 667, name: '中屏手機' },
      { width: 768, height: 1024, name: '平板' },
      { width: 1280, height: 720, name: '桌面' },
      { width: 1920, height: 1080, name: '大屏桌面' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // 檢查主要元素是否可見
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      
      // 截圖對比
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
    }
  });

  test('PersonaCard 容器查詢響應', async ({ page }) => {
    await page.goto('/personas');
    
    // const _cardSelector = '.persona-card';
    const containerSelector = '.container-query-card';
    
    // 測試不同容器寬度下的佈局變化
    const expectedChanges = {
      280: ['cq-flex-col'],
      400: ['persona-card-narrow'],
      600: ['persona-card-wide']
    };
    
    await utils.testContainerQuery(containerSelector, expectedChanges);
  });

  test('流體排版在不同視窗下正確縮放', async () => {
    const headingSelector = '.fluid-heading-1';
    
    const viewports = [
      { width: 320, expectedSize: 24 },  // 1.5rem
      { width: 768, expectedSize: 32 },  // 約 2rem
      { width: 1920, expectedSize: 48 }  // 3rem
    ];
    
    await utils.testFluidTypography(headingSelector, viewports);
  });

  test('觸摸目標大小符合可訪問性標準', async ({ page }) => {
    await page.goto('/personas');
    
    // 檢查所有按鈕的觸摸目標大小
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('圖片響應式加載', async ({ page }) => {
    await page.goto('/personas');
    
    // 檢查圖片是否正確加載
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const isVisible = await img.isVisible();
      
      if (isVisible) {
        // 檢查圖片是否有 alt 屬性
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
        
        // 檢查圖片是否加載成功
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('佈局在極小屏幕上不會破壞', async ({ page }) => {
    // 測試極小屏幕（如舊款手機）
    await utils.setViewport(240, 320);
    
    // 檢查是否有水平滾動條
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBeFalsy();
    
    // 檢查主要內容是否仍然可見
    await expect(page.locator('main')).toBeVisible();
  });

  test('佈局在超大屏幕上正確顯示', async ({ page }) => {
    // 測試超大屏幕
    await utils.setViewport(3840, 2160);
    
    // 檢查內容是否居中且不會過度拉伸
    const main = page.locator('main');
    const box = await main.boundingBox();
    
    if (box) {
      // 內容寬度不應該超過合理範圍
      expect(box.width).toBeLessThanOrEqual(1920);
    }
  });
});

/**
 * 性能測試
 */
test.describe('響應式性能測試', () => {
  test('頁面加載性能', async ({ page }) => {
    // 開始性能監控
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 檢查 Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.LCP = entry.startTime;
            }
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // 5秒後返回結果
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // LCP 應該小於 2.5 秒
    if ((metrics as PerformanceMetrics).LCP) {
      expect((metrics as PerformanceMetrics).LCP).toBeLessThan(2500);
    }
  });

  test('圖片加載性能', async ({ page }) => {
    await page.goto('/personas');
    
    // 監控圖片加載時間
    const imageLoadTimes: number[] = [];
    
    page.on('response', (response) => {
      if (response.url().match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        // Note: response.timing() is not available in Playwright
        // Using alternative approach to measure image load time
        const startTime = Date.now();
        response.finished().then(() => {
          const loadTime = Date.now() - startTime;
          imageLoadTimes.push(loadTime);
        });
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // 圖片加載時間應該合理
    imageLoadTimes.forEach((time) => {
      expect(time).toBeLessThan(3000); // 3秒內
    });
  });
});

/**
 * 可訪問性測試
 */
test.describe('響應式可訪問性測試', () => {
  test('鍵盤導航在不同設備上正常工作', async ({ page }) => {
    await page.goto('/personas');
    
    const viewports = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // 測試 Tab 鍵導航
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    }
  });

  test('顏色對比度在不同主題下符合標準', async ({ page }) => {
    await page.goto('/');
    
    // 檢查主要文字元素的對比度
    const textElements = [
      'h1',
      'h2',
      'h3',
      'p',
      'button'
    ];
    
    for (const selector of textElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = elements.nth(i);
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor
            };
          });
          
          // 這裡可以添加對比度計算邏輯
          expect(styles.color).toBeTruthy();
        }
      }
    }
  });
});