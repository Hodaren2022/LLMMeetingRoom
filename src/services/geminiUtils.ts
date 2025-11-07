import { SourceReference } from '@/types';

/**
 * 來源引用處理工具
 */
export class SourceProcessor {
  /**
   * 處理 Gemini 回應中的來源引用
   */
  static processGroundingMetadata(response: import('@/types/gemini').GeminiApiResponse): import('@/types/gemini').SourceReference[] {
    const sources: SourceReference[] = [];
    
    try {
      const groundingMetadata = response.response?.candidates?.[0]?.groundingMetadata;
      if (!groundingMetadata?.groundingChunks) {
        return sources;
      }

      const chunks = groundingMetadata.groundingChunks;
      chunks.forEach((chunk: import('@/types/gemini').GroundingChunk, index: number) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            url: chunk.web.uri,
            title: chunk.web.title || `來源 ${index + 1}`,
            snippet: chunk.web.snippet || '',
            relevanceScore: chunk.relevanceScore || 0.5,
          });
        }
      });

      // 按相關性分數排序
      sources.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
      return sources;
    } catch (error) {
      console.error('Error processing grounding metadata:', error);
      return sources;
    }
  }

  /**
   * 為文本添加內聯引用
   */
  static addInlineCitations(text: string, groundingMetadata: import('@/types/gemini').GroundingMetadata): string {
    try {
      if (!groundingMetadata?.groundingSupports || !groundingMetadata?.groundingChunks) {
        return text;
      }

      const supports = groundingMetadata.groundingSupports;
      const chunks = groundingMetadata.groundingChunks;

      // 按結束位置降序排序，避免插入時位置偏移
      const sortedSupports = [...supports].sort(
        (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0)
      );

      let processedText = text;

      for (const support of sortedSupports) {
        const endIndex = support.segment?.endIndex;
        if (endIndex === undefined || !support.groundingChunkIndices?.length) {
          continue;
        }

        const citationLinks = support.groundingChunkIndices
          .map((i: number) => {
            const uri = chunks[i]?.web?.uri;
            const title = chunks[i]?.web?.title || `來源 ${i + 1}`;
            if (uri) {
              return `[${i + 1}](${uri} "${title}")`;
            }
            return null;
          })
          .filter(Boolean);

        if (citationLinks.length > 0) {
          const citationString = ` ${citationLinks.join(', ')}`;
          processedText = processedText.slice(0, endIndex) + citationString + processedText.slice(endIndex);
        }
      }

      return processedText;
    } catch (error) {
      console.error('Error adding inline citations:', error);
      return text;
    }
  }

  /**
   * 提取搜尋查詢
   */
  static extractSearchQueries(groundingMetadata: import('@/types/gemini').GroundingMetadata): string[] {
    try {
      return groundingMetadata?.webSearchQueries || [];
    } catch (error) {
      console.error('Error extracting search queries:', error);
      return [];
    }
  }

  /**
   * 驗證來源的可靠性
   */
  static validateSources(sources: SourceReference[]): SourceReference[] {
    return sources.filter(source => {
      // 基本驗證
      if (!source.url || !source.title) {
        return false;
      }

      // URL 格式驗證
      try {
        new URL(source.url);
      } catch {
        return false;
      }

      // 相關性分數驗證
      if (source.relevanceScore !== undefined && source.relevanceScore < 0.3) {
        return false;
      }

      return true;
    });
  }

  /**
   * 格式化來源列表為顯示用
   */
  static formatSourcesForDisplay(sources: SourceReference[]): string {
    if (sources.length === 0) {
      return '無參考來源';
    }

    return sources
      .map((source, index) => {
        const domain = new URL(source.url).hostname;
        return `${index + 1}. [${source.title}](${source.url}) - ${domain}`;
      })
      .join('\n');
  }

  /**
   * 生成來源摘要
   */
  static generateSourceSummary(sources: SourceReference[]): {
    totalSources: number;
    domains: string[];
    averageRelevance: number;
  } {
    const totalSources = sources.length;
    const domains = [...new Set(sources.map(source => {
      try {
        return new URL(source.url).hostname;
      } catch {
        return 'unknown';
      }
    }))];

    const relevanceScores = sources
      .map(source => source.relevanceScore || 0.5)
      .filter(score => score > 0);
    
    const averageRelevance = relevanceScores.length > 0
      ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
      : 0;

    return {
      totalSources,
      domains,
      averageRelevance,
    };
  }
}

/**
 * 錯誤處理和重試機制
 */
export class GeminiErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // 指數退避

  /**
   * 帶重試的 API 呼叫
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'API call'
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        console.warn(`${context} failed (attempt ${attempt + 1}/${this.MAX_RETRIES}):`, error);

        // 檢查是否應該重試
        if (!this.shouldRetry(error as Error) || attempt === this.MAX_RETRIES - 1) {
          break;
        }

        // 等待後重試
        await this.delay(this.RETRY_DELAYS[attempt]);
      }
    }

    throw new Error(`${context} failed after ${this.MAX_RETRIES} attempts: ${lastError.message}`);
  }

  /**
   * 判斷錯誤是否應該重試
   */
  private static shouldRetry(error: Error): boolean {
    const retryableErrors = [
      'RATE_LIMIT_EXCEEDED',
      'INTERNAL_ERROR',
      'SERVICE_UNAVAILABLE',
      'TIMEOUT',
      'NETWORK_ERROR',
    ];

    return retryableErrors.some(errorType => 
      error.message.includes(errorType) || 
      error.name.includes(errorType)
    );
  }

  /**
   * 延遲函數
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 格式化錯誤訊息
   */
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      // 處理常見的 Gemini API 錯誤
      if (error.message.includes('API_KEY')) {
        return 'API 金鑰配置錯誤，請檢查環境變數設定';
      }
      if (error.message.includes('RATE_LIMIT')) {
        return 'API 呼叫頻率過高，請稍後再試';
      }
      if (error.message.includes('QUOTA_EXCEEDED')) {
        return 'API 配額已用完，請檢查計費設定';
      }
      if (error.message.includes('INVALID_ARGUMENT')) {
        return '請求參數無效，請檢查輸入內容';
      }
      
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return '發生未知錯誤';
  }
}

/**
 * 快取管理
 */
export class GeminiCache {
  private static cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 分鐘

  /**
   * 設定快取
   */
  static set(key: string, data: unknown, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 獲取快取
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 檢查是否過期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 清除過期快取
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除所有快取
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * 生成快取鍵
   */
  static generateKey(prefix: string, ...params: unknown[]): string {
    return `${prefix}:${params.map(p => JSON.stringify(p)).join(':')}`;
  }
}

// 定期清理快取
setInterval(() => {
  GeminiCache.cleanup();
}, 60000); // 每分鐘清理一次