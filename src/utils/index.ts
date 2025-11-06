// Utility functions for the Virtual Meeting Room system

/**
 * 生成唯一 ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * 格式化時間戳
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 格式化相對時間
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小時前`;
  if (minutes > 0) return `${minutes} 分鐘前`;
  return `${seconds} 秒前`;
};

/**
 * 計算共識度
 */
/**
 * 進階共識計算工具
 */
export const consensusUtils: {
  calculateBasicConsensus: (scores: number[]) => {
    supportRate: number;
    opposeRate: number;
    consensusReached: boolean;
    threshold: number;
    finalScores: Record<string, number>;
  };
  calculateWeightedConsensus: (scores: number[], weights?: number[]) => {
    weightedSupportRate: number;
    weightedOpposeRate: number;
    consensusReached: boolean;
    threshold: number;
    weightedScores: Record<string, number>;
    confidenceLevel: number;
  };
  calculateDynamicConsensus: (historicalScores: number[][], timeWeights?: number[]) => {
    trendDirection: 'converging' | 'diverging' | 'stable';
    convergenceRate: number;
    predictedConsensus: number;
    stabilityIndex: number;
  };
  generateConsensusReport: (scores: number[], weights?: number[], historicalScores?: number[][]) => {
    basic: ReturnType<typeof consensusUtils.calculateBasicConsensus>;
    weighted: ReturnType<typeof consensusUtils.calculateWeightedConsensus>;
    dynamic: ReturnType<typeof consensusUtils.calculateDynamicConsensus>;
    summary: {
      overallConsensus: 'strong' | 'moderate' | 'weak' | 'none';
      recommendation: string;
      nextSteps: string[];
    };
  };
} = {
  /**
   * 計算基本共識度
   */
  calculateBasicConsensus: (scores: number[]): {
    supportRate: number;
    opposeRate: number;
    consensusReached: boolean;
    threshold: number;
    finalScores: Record<string, number>;
  } => {
    if (scores.length === 0) {
      return {
        supportRate: 0,
        opposeRate: 0,
        consensusReached: false,
        threshold: 0.7,
        finalScores: {},
      };
    }
    
    const totalScores = scores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = scores.length * 10;
    const minPossibleScore = scores.length * 1;
    
    // 計算支持度和反對度
    const supportRate = totalScores / maxPossibleScore;
    const opposeRate = (maxPossibleScore - totalScores) / (maxPossibleScore - minPossibleScore);
    
    const threshold = 0.7;
    const consensusReached = supportRate > threshold || opposeRate > threshold;
    
    // 生成最終分數記錄
    const finalScores: Record<string, number> = {};
    scores.forEach((score, index) => {
      finalScores[`persona_${index}`] = score;
    });
    
    return {
      supportRate,
      opposeRate,
      consensusReached,
      threshold,
      finalScores,
    };
  },

  /**
   * 計算加權共識度（考慮替身的專業權重）
   */
  calculateWeightedConsensus: (
    scores: number[], 
    weights: number[] = []
  ): {
    weightedSupportRate: number;
    weightedOpposeRate: number;
    consensusReached: boolean;
    threshold: number;
    weightedScores: Record<string, number>;
    confidenceLevel: number;
  } => {
    if (scores.length === 0) {
      return {
        weightedSupportRate: 0,
        weightedOpposeRate: 0,
        consensusReached: false,
        threshold: 0.7,
        weightedScores: {},
        confidenceLevel: 0,
      };
    }

    // 如果沒有提供權重，則使用均等權重
    const normalizedWeights = weights.length === scores.length 
      ? weights.map(w => w / weights.reduce((sum, weight) => sum + weight, 0))
      : scores.map(() => 1 / scores.length);

    // 計算加權分數
    const weightedTotal = scores.reduce((sum, score, index) => 
      sum + (score * normalizedWeights[index]), 0
    );
    
    const maxWeightedScore = normalizedWeights.reduce((sum, weight) => sum + (weight * 10), 0);
    const minWeightedScore = normalizedWeights.reduce((sum, weight) => sum + (weight * 1), 0);

    const weightedSupportRate = weightedTotal / maxWeightedScore;
    const weightedOpposeRate = (maxWeightedScore - weightedTotal) / (maxWeightedScore - minWeightedScore);

    // 計算信心水準（基於分數的一致性）
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const confidenceLevel = Math.max(0, 1 - (variance / 25)); // 25 是最大可能方差

    const threshold = 0.7;
    const consensusReached = weightedSupportRate > threshold || weightedOpposeRate > threshold;

    // 生成加權分數記錄
    const weightedScores: Record<string, number> = {};
    scores.forEach((score, index) => {
      weightedScores[`persona_${index}`] = score * normalizedWeights[index];
    });

    return {
      weightedSupportRate,
      weightedOpposeRate,
      consensusReached,
      threshold,
      weightedScores,
      confidenceLevel,
    };
  },

  /**
   * 計算動態共識度（考慮時間變化）
   */
  calculateDynamicConsensus: (
    historicalScores: number[][], 
    timeWeights: number[] = []
  ): {
    trendDirection: 'converging' | 'diverging' | 'stable';
    convergenceRate: number;
    predictedConsensus: number;
    stabilityIndex: number;
  } => {
    if (historicalScores.length < 2) {
      return {
        trendDirection: 'stable',
        convergenceRate: 0,
        predictedConsensus: 5,
        stabilityIndex: 0,
      };
    }

    // 計算每輪的方差
    const variances = historicalScores.map(scores => {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    });

    // 判斷趨勢方向
    const recentVariances = variances.slice(-3);
    const isConverging = recentVariances.length >= 2 && 
      recentVariances[recentVariances.length - 1] < recentVariances[0];
    const isDiverging = recentVariances.length >= 2 && 
      recentVariances[recentVariances.length - 1] > recentVariances[0];

    let trendDirection: 'converging' | 'diverging' | 'stable' = 'stable';
    if (isConverging) trendDirection = 'converging';
    else if (isDiverging) trendDirection = 'diverging';

    // 計算收斂率
    const convergenceRate = recentVariances.length >= 2 
      ? (recentVariances[0] - recentVariances[recentVariances.length - 1]) / recentVariances[0]
      : 0;

    // 預測下一輪共識
    const lastRoundAvg = historicalScores[historicalScores.length - 1]
      .reduce((sum, score) => sum + score, 0) / historicalScores[historicalScores.length - 1].length;
    const predictedConsensus = Math.max(1, Math.min(10, lastRoundAvg + (convergenceRate * 2)));

    // 計算穩定性指數
    const stabilityIndex = Math.max(0, 1 - (variances[variances.length - 1] / 25));

    return {
      trendDirection,
      convergenceRate,
      predictedConsensus,
      stabilityIndex,
    };
  },

  /**
   * 生成共識報告
   */
  generateConsensusReport: (
    scores: number[],
    weights: number[] = [],
    historicalScores: number[][] = []
  ): {
    basic: ReturnType<typeof consensusUtils.calculateBasicConsensus>;
    weighted: ReturnType<typeof consensusUtils.calculateWeightedConsensus>;
    dynamic: ReturnType<typeof consensusUtils.calculateDynamicConsensus>;
    summary: {
      overallConsensus: 'strong' | 'moderate' | 'weak' | 'none';
      recommendation: string;
      nextSteps: string[];
    };
  } => {
    const basic = consensusUtils.calculateBasicConsensus(scores);
    const weighted = consensusUtils.calculateWeightedConsensus(scores, weights);
    const dynamic = consensusUtils.calculateDynamicConsensus(historicalScores);

    // 綜合評估
    let overallConsensus: 'strong' | 'moderate' | 'weak' | 'none' = 'none';
    if (basic.consensusReached && weighted.consensusReached && weighted.confidenceLevel > 0.8) {
      overallConsensus = 'strong';
    } else if (basic.consensusReached || weighted.consensusReached) {
      overallConsensus = 'moderate';
    } else if (Math.max(basic.supportRate, basic.opposeRate) > 0.5) {
      overallConsensus = 'weak';
    }

    // 生成建議
    let recommendation = '';
    const nextSteps: string[] = [];

    switch (overallConsensus) {
      case 'strong':
        recommendation = '已達成強烈共識，可以結束辯論並採取行動。';
        nextSteps.push('總結辯論要點', '制定實施計劃', '分配後續任務');
        break;
      case 'moderate':
        recommendation = '達成中等程度共識，建議再進行 1-2 輪辯論以鞏固觀點。';
        nextSteps.push('針對分歧點深入討論', '尋求更多證據支持', '嘗試找到折衷方案');
        break;
      case 'weak':
        recommendation = '共識較弱，需要更多輪辯論來縮小分歧。';
        nextSteps.push('重新檢視核心議題', '引入新的觀點或專家', '調整辯論策略');
        break;
      case 'none':
        recommendation = '尚未形成共識，建議重新定義議題或調整參與者。';
        nextSteps.push('重新審視議題定義', '考慮增加或更換參與者', '調整辯論規則');
        break;
    }

    return {
      basic,
      weighted,
      dynamic,
      summary: {
        overallConsensus,
        recommendation,
        nextSteps,
      },
    };
  },
};

// 向後兼容
export const calculateConsensus = consensusUtils.calculateBasicConsensus;

/**
 * 驗證替身配置
 */
export const validatePersona = (persona: any): string[] => {
  const errors: string[] = [];
  
  if (!persona.name || persona.name.trim().length === 0) {
    errors.push('替身名稱不能為空');
  }
  
  if (!persona.identity || persona.identity.trim().length === 0) {
    errors.push('身份描述不能為空');
  }
  
  if (!persona.primeDirective || persona.primeDirective.trim().length === 0) {
    errors.push('核心原則不能為空');
  }
  
  if (!persona.toneStyle || persona.toneStyle.trim().length === 0) {
    errors.push('辯論風格不能為空');
  }
  
  if (typeof persona.temperature !== 'number' || persona.temperature < 0.1 || persona.temperature > 1.0) {
    errors.push('溫度參數必須在 0.1 到 1.0 之間');
  }
  
  if (!Array.isArray(persona.ragFocus) || persona.ragFocus.length === 0) {
    errors.push('搜尋重點至少需要一個項目');
  }
  
  return errors;
};

/**
 * 深度複製對象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * 防抖函數
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 節流函數
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 本地儲存工具
 */
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue || null;
    }
  },
  
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
};

/**
 * 顏色工具
 */
export const colorUtils = {
  /**
   * 生成隨機顏色
   */
  generateRandomColor: (): string => {
    const colors = [
      '#1f2937', '#dc2626', '#059669', '#7c3aed',
      '#ea580c', '#0891b2', '#be123c', '#166534',
      '#7c2d12', '#581c87', '#92400e', '#1e40af',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },
  
  /**
   * 將十六進制顏色轉換為 RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },
  
  /**
   * 獲取顏色的亮度
   */
  getLuminance: (hex: string): number => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  },
  
  /**
   * 判斷是否為深色
   */
  isDark: (hex: string): boolean => {
    return colorUtils.getLuminance(hex) < 0.5;
  },
};

/**
 * 文字工具
 */
export const textUtils = {
  /**
   * 截斷文字
   */
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  },
  
  /**
   * 高亮關鍵詞
   */
  highlightKeywords: (text: string, keywords: string[]): string => {
    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    return highlightedText;
  },
  
  /**
   * 移除 HTML 標籤
   */
  stripHtml: (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  },
  
  /**
   * 計算閱讀時間（以分鐘為單位）
   */
  calculateReadingTime: (text: string, wordsPerMinute: number = 200): number => {
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  },
};

/**
 * 錯誤處理工具
 */
export const errorUtils = {
  /**
   * 格式化錯誤訊息
   */
  formatError: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return '發生未知錯誤';
  },
  
  /**
   * 記錄錯誤
   */
  logError: (error: unknown, context?: string): void => {
    const errorMessage = errorUtils.formatError(error);
    const logMessage = context ? `[${context}] ${errorMessage}` : errorMessage;
    console.error(logMessage, error);
  },
};

/**
 * 從發言內容提取主題
 */
export const extractTopicFromContent = (content: string): string => {
  if (!content || content.trim().length === 0) {
    return '';
  }

  // 移除標點符號和多餘空格
  const cleanContent = content.replace(/[。！？，、；：""''（）【】《》]/g, ' ').trim();
  
  // 分割成詞語
  const words = cleanContent.split(/\s+/).filter(word => word.length > 1);
  
  // 如果內容太短，直接返回前30個字符
  if (words.length < 3) {
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  }
  
  // 尋找關鍵詞模式
  const keywordPatterns = [
    /關於(.{2,20})/,
    /討論(.{2,20})/,
    /針對(.{2,20})/,
    /對於(.{2,20})/,
    /我認為(.{2,20})/,
    /我們應該(.{2,20})/,
    /建議(.{2,20})/,
    /提議(.{2,20})/,
  ];
  
  // 嘗試匹配關鍵詞模式
  for (const pattern of keywordPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // 如果沒有匹配到模式，取前幾個有意義的詞語
  const meaningfulWords = words.filter(word => 
    word.length >= 2 && 
    !['我們', '這個', '那個', '可以', '應該', '需要', '因為', '所以', '但是', '然而'].includes(word)
  );
  
  if (meaningfulWords.length >= 2) {
    const topic = meaningfulWords.slice(0, 3).join('');
    return topic.length > 20 ? topic.substring(0, 20) + '...' : topic;
  }
  
  // 最後備選：取前20個字符
  return content.length > 20 ? content.substring(0, 20) + '...' : content;
};

/**
 * 驗證工具
 */
export const validationUtils = {
  /**
   * 驗證電子郵件
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * 驗證 URL
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * 驗證非空字串
   */
  isNonEmptyString: (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  },
  
  /**
   * 驗證數字範圍
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return typeof value === 'number' && value >= min && value <= max;
  },
};