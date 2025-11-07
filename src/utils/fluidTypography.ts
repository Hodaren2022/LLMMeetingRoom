/**
 * 流體排版工具函數
 * 基於數學公式計算 CSS clamp() 函數的參數
 */

export interface FluidTypographyConfig {
  minSize: number;      // 最小字體大小 (px)
  maxSize: number;      // 最大字體大小 (px)
  minScreen: number;    // 最小屏幕寬度 (px)
  maxScreen: number;    // 最大屏幕寬度 (px)
  unit?: 'rem' | 'px';  // 輸出單位
  baseFontSize?: number; // 基礎字體大小，用於 rem 轉換
}

export interface FluidTypographyResult {
  clampValue: string;
  vwValue: number;
  remValue: number;
  cssCustomProperty?: string;
}

/**
 * 流體排版計算器
 */
export class FluidTypographyCalculator {
  private baseFontSize: number;
  
  constructor(baseFontSize: number = 16) {
    this.baseFontSize = baseFontSize;
  }
  
  /**
   * 計算流體排版參數
   * 使用公式：v = (100 * (y2 - y1)) / (x2 - x1)
   *          r = (x1 * y2 - x2 * y1) / (x1 - x2)
   */
  calculate(config: FluidTypographyConfig): FluidTypographyResult {
    const { minSize, maxSize, minScreen, maxScreen, unit = 'rem', baseFontSize = this.baseFontSize } = config;
    
    // 計算 viewport 寬度值 (vw)
    const vwValue = (100 * (maxSize - minSize)) / (maxScreen - minScreen);
    
    // 計算相對大小值 (rem)
    const remValuePx = (minScreen * maxSize - maxScreen * minSize) / (minScreen - maxScreen);
    const remValue = remValuePx / baseFontSize;
    
    // 轉換最小值和最大值到指定單位
    const minValue = unit === 'rem' ? minSize / baseFontSize : minSize;
    const maxValue = unit === 'rem' ? maxSize / baseFontSize : maxSize;
    
    // 生成 clamp 值
    const clampValue = `clamp(${minValue}${unit}, ${vwValue.toFixed(3)}vw + ${remValue.toFixed(3)}rem, ${maxValue}${unit})`;
    
    return {
      clampValue,
      vwValue: Number(vwValue.toFixed(3)),
      remValue: Number(remValue.toFixed(3)),
      cssCustomProperty: `--fluid-${minSize}-${maxSize}: ${clampValue};`
    };
  }
  
  /**
   * 批量計算多個流體排版配置
   */
  calculateBatch(configs: Record<string, FluidTypographyConfig>): Record<string, FluidTypographyResult> {
    const results: Record<string, FluidTypographyResult> = {};
    
    for (const [key, config] of Object.entries(configs)) {
      results[key] = this.calculate(config);
    }
    
    return results;
  }
  
  /**
   * 生成 CSS 自定義屬性
   */
  generateCSSCustomProperties(configs: Record<string, FluidTypographyConfig>): string {
    const results = this.calculateBatch(configs);
    const cssProperties: string[] = [];
    
    for (const [key, result] of Object.entries(results)) {
      cssProperties.push(`  --fluid-${key}: ${result.clampValue};`);
    }
    
    return `:root {\n${cssProperties.join('\n')}\n}`;
  }
  
  /**
   * 驗證流體排版在特定視窗寬度下的值
   */
  validateAtViewport(config: FluidTypographyConfig, viewportWidth: number): number {
    const { minSize, maxSize, minScreen, maxScreen } = config;
    
    if (viewportWidth <= minScreen) {
      return minSize;
    }
    
    if (viewportWidth >= maxScreen) {
      return maxSize;
    }
    
    // 線性插值計算
    const ratio = (viewportWidth - minScreen) / (maxScreen - minScreen);
    return minSize + (maxSize - minSize) * ratio;
  }
}

/**
 * 預設的流體排版配置
 */
export const defaultFluidTypographyConfigs: Record<string, FluidTypographyConfig> = {
  'heading-1': {
    minSize: 24,    // 1.5rem
    maxSize: 48,    // 3rem
    minScreen: 320,
    maxScreen: 1920,
    unit: 'rem'
  },
  'heading-2': {
    minSize: 20,    // 1.25rem
    maxSize: 36,    // 2.25rem
    minScreen: 320,
    maxScreen: 1920,
    unit: 'rem'
  },
  'heading-3': {
    minSize: 18,    // 1.125rem
    maxSize: 30,    // 1.875rem
    minScreen: 320,
    maxScreen: 1920,
    unit: 'rem'
  },
  'body': {
    minSize: 14,    // 0.875rem
    maxSize: 18,    // 1.125rem
    minScreen: 320,
    maxScreen: 1920,
    unit: 'rem'
  },
  'small': {
    minSize: 12,    // 0.75rem
    maxSize: 14,    // 0.875rem
    minScreen: 320,
    maxScreen: 1920,
    unit: 'rem'
  }
};

/**
 * 流體排版工具函數
 */
export const fluidTypographyUtils = {
  /**
   * 創建流體排版計算器實例
   */
  createCalculator: (baseFontSize?: number) => new FluidTypographyCalculator(baseFontSize),
  
  /**
   * 快速計算流體排版
   */
  quickCalculate: (minSize: number, maxSize: number, minScreen: number = 320, maxScreen: number = 1920) => {
    const calculator = new FluidTypographyCalculator();
    return calculator.calculate({
      minSize,
      maxSize,
      minScreen,
      maxScreen,
      unit: 'rem'
    });
  },
  
  /**
   * 生成預設配置的 CSS
   */
  generateDefaultCSS: () => {
    const calculator = new FluidTypographyCalculator();
    return calculator.generateCSSCustomProperties(defaultFluidTypographyConfigs);
  },
  
  /**
   * 檢查流體排版的可訪問性
   */
  checkAccessibility: (config: FluidTypographyConfig): {
    isAccessible: boolean;
    warnings: string[];
  } => {
    const warnings: string[] = [];
    let isAccessible = true;
    
    // 檢查最小字體大小
    if (config.minSize < 12) {
      warnings.push('最小字體大小小於 12px，可能影響可讀性');
      isAccessible = false;
    }
    
    // 檢查縮放比例
    const scaleRatio = config.maxSize / config.minSize;
    if (scaleRatio > 3) {
      warnings.push('字體縮放比例過大，可能在某些設備上顯示異常');
    }
    
    // 檢查屏幕寬度範圍
    if (config.maxScreen - config.minScreen < 600) {
      warnings.push('屏幕寬度範圍過小，流體效果可能不明顯');
    }
    
    return { isAccessible, warnings };
  }
};

const fluidTypographyExports = {
  FluidTypographyCalculator,
  fluidTypographyUtils,
  defaultFluidTypographyConfigs
};

export default fluidTypographyExports;