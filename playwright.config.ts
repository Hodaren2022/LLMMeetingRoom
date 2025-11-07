import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用於響應式設計測試和跨瀏覽器測試
 */
export default defineConfig({
  testDir: './tests',
  
  /* 並行運行測試 */
  fullyParallel: true,
  
  /* 在 CI 環境中禁止重試 */
  forbidOnly: !!process.env.CI,
  
  /* 在 CI 環境中重試失敗的測試 */
  retries: process.env.CI ? 2 : 0,
  
  /* 並行工作進程數量 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 測試報告配置 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  /* 全局測試配置 */
  use: {
    /* 基礎 URL */
    baseURL: 'http://localhost:3000',
    
    /* 收集失敗測試的追蹤信息 */
    trace: 'on-first-retry',
    
    /* 截圖配置 */
    screenshot: 'only-on-failure',
    
    /* 視頻錄製 */
    video: 'retain-on-failure',
  },

  /* 響應式測試項目配置 */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    /* 平板設備測試 */
    {
      name: 'iPad',
      use: { ...devices['iPad'] },
    },
    
    {
      name: 'iPad Pro',
      use: { ...devices['iPad Pro'] },
    },

    /* 移動設備測試 */
    {
      name: 'iPhone 12',
      use: { ...devices['iPhone 12'] },
    },
    
    {
      name: 'iPhone 12 Pro',
      use: { ...devices['iPhone 12 Pro'] },
    },
    
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    
    {
      name: 'Samsung Galaxy S21',
      use: { ...devices['Galaxy S III'] }, // 使用類似的設備配置
    },

    /* 自定義響應式斷點測試 */
    {
      name: 'Mobile Small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 }
      },
    },
    
    {
      name: 'Mobile Medium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 }
      },
    },
    
    {
      name: 'Mobile Large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 414, height: 896 }
      },
    },
    
    {
      name: 'Tablet Small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 }
      },
    },
    
    {
      name: 'Tablet Large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 1366 }
      },
    },
    
    {
      name: 'Desktop Small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    {
      name: 'Desktop Large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'Desktop XL',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 }
      },
    },
  ],

  /* 開發服務器配置 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});