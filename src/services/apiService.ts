import { Persona, DebateContext, SourceReference, GeminiResponse } from '@/types';

/**
 * API 客戶端服務 - 處理前端與後端 API 的通信
 */
export class ApiService {
  private static baseUrl = '/api';

  /**
   * 生成替身回應
   */
  static async generatePersonaResponse(
    persona: Persona,
    context: DebateContext,
    searchResults?: SourceReference[]
  ): Promise<GeminiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/debate/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'speak',
          persona,
          context,
          searchResults,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate persona response');
      }

      return data.response;
    } catch (error) {
      console.error('Error generating persona response:', error);
      throw error;
    }
  }

  /**
   * 搜尋議題相關資訊
   */
  static async searchTopicInformation(
    topic: string,
    personas: Persona[]
  ): Promise<{
    keywords: string[];
    searchResults: SourceReference[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/search/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'grounding',
          topic,
          personas,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search topic information');
      }

      return {
        keywords: data.keywords,
        searchResults: data.results,
      };
    } catch (error) {
      console.error('Error searching topic information:', error);
      throw error;
    }
  }

  /**
   * 分析議題並生成關鍵詞
   */
  static async analyzeTopicAndGenerateKeywords(
    topic: string,
    personas: Persona[]
  ): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'keywords',
          topic,
          personas,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze topic');
      }

      return data.keywords;
    } catch (error) {
      console.error('Error analyzing topic:', error);
      throw error;
    }
  }

  /**
   * 執行自定義搜尋
   */
  static async performCustomSearch(
    topic: string,
    keywords?: string[]
  ): Promise<SourceReference[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          topic,
          keywords,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to perform custom search');
      }

      return data.results;
    } catch (error) {
      console.error('Error performing custom search:', error);
      throw error;
    }
  }

  /**
   * 批量生成替身回應
   */
  static async generateBatchPersonaResponses(
    requests: Array<{
      persona: Persona;
      context: DebateContext;
      searchResults?: SourceReference[];
    }>
  ): Promise<GeminiResponse[]> {
    try {
      const promises = requests.map(request =>
        this.generatePersonaResponse(request.persona, request.context, request.searchResults)
      );

      const responses = await Promise.allSettled(promises);
      
      return responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to generate response for persona ${requests[index].persona.name}:`, result.reason);
          return {
            content: `抱歉，${requests[index].persona.name} 暫時無法回應。`,
            tendencyScore: 5,
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          };
        }
      });
    } catch (error) {
      console.error('Error generating batch persona responses:', error);
      throw error;
    }
  }

  /**
   * 健康檢查
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * 錯誤重試機制
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指數退避
      }
    }

    throw lastError!;
  }

  /**
   * 帶重試的替身回應生成
   */
  static async generatePersonaResponseWithRetry(
    persona: Persona,
    context: DebateContext,
    searchResults?: SourceReference[],
    maxRetries: number = 3
  ): Promise<GeminiResponse> {
    return this.withRetry(
      () => this.generatePersonaResponse(persona, context, searchResults),
      maxRetries
    );
  }

  /**
   * 帶重試的搜尋功能
   */
  static async searchTopicInformationWithRetry(
    topic: string,
    personas: Persona[],
    maxRetries: number = 3
  ): Promise<{
    keywords: string[];
    searchResults: SourceReference[];
  }> {
    return this.withRetry(
      () => this.searchTopicInformation(topic, personas),
      maxRetries
    );
  }
}

export default ApiService;