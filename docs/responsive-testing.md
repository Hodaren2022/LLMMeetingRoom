# 響應式設計測試指南

## 概述

本項目實現了全面的響應式設計測試系統，使用 Playwright 進行自動化測試，確保應用在各種設備和瀏覽器上都能正常工作。

## 測試類型

### 1. 響應式佈局測試
- **文件**: `tests/responsive.spec.ts`
- **功能**: 測試不同視窗大小下的佈局表現
- **覆蓋範圍**: 
  - 移動設備 (320px - 414px)
  - 平板設備 (768px - 1024px)
  - 桌面設備 (1280px - 2560px)

### 2. 觸摸交互測試
- **文件**: `tests/touch-interactions.spec.ts`
- **功能**: 測試觸摸手勢和交互反饋
- **測試項目**:
  - 觸摸按鈕反饋
  - 長按手勢
  - 滑動手勢
  - 捏合縮放

### 3. 容器查詢測試
- **功能**: 測試 CSS 容器查詢的響應式行為
- **測試組件**: PersonaCard, DebateRoom, Navigation

### 4. 流體排版測試
- **功能**: 驗證 CSS clamp() 函數的字體縮放
- **測試範圍**: 標題、正文、間距

### 5. 性能測試
- **指標**: Core Web Vitals (LCP, FID, CLS)
- **目標**: 
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

## 運行測試

### 基本命令

```bash
# 運行所有測試
npm run test

# 運行響應式測試
npm run test:responsive

# 運行觸摸交互測試
npm run test:touch

# 使用 UI 模式運行測試
npm run test:ui

# 查看測試報告
npm run test:report
```

### 高級選項

```bash
# 運行特定瀏覽器的測試
npx playwright test --project="Desktop Chrome"

# 運行特定設備的測試
npx playwright test --project="iPhone 12"

# 調試模式
npx playwright test --debug

# 生成測試代碼
npx playwright codegen localhost:3000
```

## 測試配置

### 支持的設備

| 設備類型 | 設備名稱 | 分辨率 |
|---------|---------|--------|
| 移動設備 | iPhone SE | 320×568 |
| 移動設備 | iPhone 12 | 390×844 |
| 移動設備 | Samsung Galaxy | 360×640 |
| 平板設備 | iPad | 768×1024 |
| 平板設備 | iPad Pro | 1024×1366 |
| 桌面設備 | Desktop Small | 1280×720 |
| 桌面設備 | Desktop Large | 1920×1080 |
| 桌面設備 | Desktop XL | 2560×1440 |

### 瀏覽器支持

- Chrome (桌面/移動)
- Firefox (桌面)
- Safari (桌面/移動)
- Edge (桌面)

## 測試工具

### ResponsiveTestHelper

位於 `tests/utils/responsive-test-helper.ts`，提供以下功能：

```typescript
// 創建測試助手
const helper = new ResponsiveTestHelper(page);

// 測試所有視窗大小
await helper.testAllViewports(async (viewport) => {
  // 測試邏輯
});

// 檢查觸摸目標大小
const touchTargets = await helper.checkTouchTargets();

// 檢查文字溢出
const hasOverflow = await helper.checkTextOverflow('.text-content');

// 生成測試報告
const report = await helper.generateReport();
```

### 快速測試函數

```typescript
import { quickResponsiveTest } from './utils/responsive-test-helper';

test('快速響應式測試', async ({ page }) => {
  await quickResponsiveTest(page, '/');
});
```

## 測試最佳實踐

### 1. 觸摸目標大小
- 最小尺寸: 44×44px
- 推薦尺寸: 56×56px
- 重要按鈕: 64×64px

### 2. 文字可讀性
- 最小字體: 12px
- 行高比例: 1.4-1.6
- 對比度: 4.5:1 (普通文字)

### 3. 佈局穩定性
- 避免佈局偏移 (CLS)
- 預留動態內容空間
- 使用骨架屏

### 4. 性能優化
- 圖片懶加載
- 關鍵資源預加載
- 代碼分割

## 故障排除

### 常見問題

1. **測試超時**
   ```bash
   # 增加超時時間
   npx playwright test --timeout=60000
   ```

2. **截圖差異**
   ```bash
   # 更新基準截圖
   npx playwright test --update-snapshots
   ```

3. **設備模擬問題**
   ```bash
   # 檢查設備配置
   npx playwright show-trace trace.zip
   ```

### 調試技巧

1. **使用調試模式**
   ```bash
   npx playwright test --debug tests/responsive.spec.ts
   ```

2. **查看測試執行過程**
   ```bash
   npx playwright test --headed
   ```

3. **生成詳細報告**
   ```bash
   npx playwright test --reporter=html
   ```

## CI/CD 集成

### GitHub Actions 配置

```yaml
name: Responsive Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## 測試報告

測試完成後，可以在以下位置查看報告：

- HTML 報告: `playwright-report/index.html`
- JSON 結果: `test-results/results.json`
- JUnit 報告: `test-results/junit.xml`
- 截圖: `test-results/screenshots/`
- 視頻: `test-results/videos/`

## 持續改進

### 監控指標

1. **測試覆蓋率**: 目標 >90%
2. **測試執行時間**: 目標 <5分鐘
3. **失敗率**: 目標 <5%

### 定期檢查

- 每週檢查測試結果
- 每月更新設備配置
- 每季度評估測試策略

## 相關資源

- [Playwright 官方文檔](https://playwright.dev/)
- [Web Vitals 指南](https://web.dev/vitals/)
- [響應式設計最佳實踐](https://web.dev/responsive-web-design-basics/)
- [容器查詢指南](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)