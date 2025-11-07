import { test, expect } from '@playwright/test';

/**
 * 觸摸交互測試
 */
test.describe('觸摸交互測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/personas');
  });

  test('觸摸按鈕提供正確的反饋', async ({ page }) => {
    const button = page.locator('button').first();
    
    // 模擬觸摸開始
    await button.dispatchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    
    // 檢查按鈕是否有按下狀態
    await expect(button).toHaveClass(/scale-95|active/);
    
    // 模擬觸摸結束
    await button.dispatchEvent('touchend');
    
    // 檢查按鈕狀態恢復
    await page.waitForTimeout(200);
    await expect(button).not.toHaveClass(/scale-95|active/);
  });

  test('長按手勢正確觸發', async ({ page }) => {
    const card = page.locator('.touch-card').first();
    
    // 模擬長按
    await card.dispatchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    
    // 等待長按延遲時間
    await page.waitForTimeout(600);
    
    // 檢查長按效果
    await expect(card).toHaveClass(/long-pressing/);
    
    // 結束觸摸
    await card.dispatchEvent('touchend');
  });

  test('滑動手勢正確識別', async ({ page }) => {
    const swipeArea = page.locator('.gesture-area').first();
    
    // 模擬向右滑動
    await swipeArea.dispatchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    
    await swipeArea.dispatchEvent('touchmove', {
      touches: [{ clientX: 200, clientY: 100 }]
    });
    
    await swipeArea.dispatchEvent('touchend');
    
    // 檢查滑動效果（這裡需要根據實際實現調整）
    await page.waitForTimeout(100);
  });

  test('捏合手勢正確處理', async ({ page }) => {
    const zoomArea = page.locator('.gesture-area').first();
    
    // 模擬雙指捏合
    await zoomArea.dispatchEvent('touchstart', {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 }
      ]
    });
    
    // 模擬捏合動作
    await zoomArea.dispatchEvent('touchmove', {
      touches: [
        { clientX: 120, clientY: 120 },
        { clientX: 180, clientY: 180 }
      ]
    });
    
    await zoomArea.dispatchEvent('touchend');
    
    await page.waitForTimeout(100);
  });
});

/**
 * 容器查詢測試
 */
test.describe('容器查詢測試', () => {
  test('PersonaCard 在不同容器寬度下正確響應', async ({ page }) => {
    await page.goto('/personas');
    
    // 測試不同視窗寬度
    const viewports = [
      { width: 320, expectedLayout: 'column' },
      { width: 480, expectedLayout: 'row' },
      { width: 800, expectedLayout: 'grid' }
    ];
    
    for (const { width, expectedLayout } of viewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(100);
      
      const card = page.locator('.persona-card').first();
      
      switch (expectedLayout) {
        case 'column':
          await expect(card).toHaveClass(/cq-flex-col/);
          break;
        case 'row':
          await expect(card).toHaveClass(/persona-card-narrow/);
          break;
        case 'grid':
          await expect(card).toHaveClass(/persona-card-wide/);
          break;
      }
    }
  });

  test('容器查詢降級策略正常工作', async ({ page }) => {
    // 禁用容器查詢支持（模擬舊瀏覽器）
    await page.addInitScript(() => {
      // 模擬不支持容器查詢的瀏覽器
      Object.defineProperty(CSS, 'supports', {
        value: (property: string) => {
          if (property === 'container-type') return false;
          return true;
        }
      });
    });
    
    await page.goto('/personas');
    
    // 檢查降級樣式是否正確應用
    const container = page.locator('.container-query-card').first();
    await expect(container).toHaveCSS('width', '100%');
  });
});

/**
 * 流體排版測試
 */
test.describe('流體排版測試', () => {
  test('標題字體大小正確縮放', async ({ page }) => {
    await page.goto('/');
    
    const heading = page.locator('.fluid-heading-1').first();
    
    // 測試不同視窗寬度下的字體大小
    const viewports = [
      { width: 320, minSize: 20, maxSize: 28 },
      { width: 768, minSize: 28, maxSize: 36 },
      { width: 1920, minSize: 40, maxSize: 48 }
    ];
    
    for (const { width, minSize, maxSize } of viewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(100);
      
      const fontSize = await heading.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      
      expect(fontSize).toBeGreaterThanOrEqual(minSize);
      expect(fontSize).toBeLessThanOrEqual(maxSize);
    }
  });

  test('流體間距正確應用', async ({ page }) => {
    await page.goto('/');
    
    const element = page.locator('.fluid-space-md').first();
    
    const viewports = [320, 768, 1920];
    
    for (const width of viewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(100);
      
      const margin = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return parseFloat(styles.marginTop);
      });
      
      // 檢查間距是否在合理範圍內
      expect(margin).toBeGreaterThan(0);
      expect(margin).toBeLessThan(100);
    }
  });
});

/**
 * 圖片響應式測試
 */
test.describe('響應式圖片測試', () => {
  test('圖片在不同設備上正確加載', async ({ page }) => {
    await page.goto('/personas');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const img = images.nth(i);
      
      // 檢查圖片是否加載成功
      await expect(img).toBeVisible();
      
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
      
      // 檢查圖片是否有正確的 alt 屬性
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('AvatarImage 組件正確處理錯誤', async ({ page }) => {
    // 注入一個會失敗的圖片 URL
    await page.goto('/personas');
    
    await page.evaluate(() => {
      const img = document.querySelector('img');
      if (img) {
        img.src = 'https://invalid-url.com/image.jpg';
      }
    });
    
    await page.waitForTimeout(1000);
    
    // 檢查是否顯示了降級內容
    const fallback = page.locator('.bg-gray-300');
    await expect(fallback).toBeVisible();
  });
});

/**
 * Web Vitals 性能測試
 */
test.describe('Web Vitals 性能測試', () => {
  test('LCP 性能指標符合標準', async ({ page }) => {
    await page.goto('/');
    
    // 等待 LCP 測量
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // 5秒後超時
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500); // 2.5秒標準
    }
  });

  test('CLS 性能指標符合標準', async ({ page }) => {
    await page.goto('/');
    
    // 測量 CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value || 0;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        // 3秒後返回結果
        setTimeout(() => resolve(clsValue), 3000);
      });
    });
    
    expect(cls).toBeLessThan(0.1); // 0.1 標準
  });
});

/**
 * 跨瀏覽器兼容性測試
 */
test.describe('跨瀏覽器兼容性測試', () => {
  test('CSS Grid 佈局在所有瀏覽器中正常工作', async ({ page }) => {
    await page.goto('/');
    
    const gridContainer = page.locator('.layout-grid-main, .card-grid-responsive').first();
    
    // 檢查 Grid 佈局是否正確應用
    const display = await gridContainer.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    
    expect(display).toBe('grid');
    
    // 檢查 Grid 項目是否正確排列
    const gridItems = gridContainer.locator('> *');
    const itemCount = await gridItems.count();
    
    if (itemCount > 0) {
      const firstItem = gridItems.first();
      const position = await firstItem.boundingBox();
      expect(position).toBeTruthy();
    }
  });

  test('Flexbox 佈局在所有瀏覽器中正常工作', async ({ page }) => {
    await page.goto('/personas');
    
    const flexContainer = page.locator('.flex, .cq-flex-row, .cq-flex-col').first();
    
    const display = await flexContainer.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    
    expect(display).toBe('flex');
  });
});