import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Persona, DebateContext, GeminiResponse, SourceReference } from '@/types';
import { PersonaEngine } from './personaEngine';
import { SourceProcessor, GeminiErrorHandler, GeminiCache } from './geminiUtils';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });
  }

  /**
   * 建構替身的完整提示詞
   */
  private buildPersonaPrompt(
    persona: Persona,
    context: DebateContext,
    searchResults?: SourceReference[]
  ): string {
    return PersonaEngine.buildPersonaPrompt(persona, context, searchResults);
  }

  /**
   * 解析 Gemini 回應
   */
  private parseGeminiResponse(response: any): GeminiResponse {
    try {
      const content = response.response?.text() || '';
      
      // 使用 PersonaEngine 解析回應
      const parsed = PersonaEngine.parsePersonaResponse(content);
      
      // 使用 SourceProcessor 處理來源資訊
      const sources = SourceProcessor.processGroundingMetadata(response);
      const validatedSources = SourceProcessor.validateSources(sources);
      
      // 添加內聯引用
      const contentWithCitations = SourceProcessor.addInlineCitations(
        parsed.cleanContent, 
        response.response?.candidates?.[0]?.groundingMetadata
      );

      return {
        content: contentWithCitations,
        tendencyScore: parsed.tendencyScore,
        reasoning: parsed.reasoning,
        sources: validatedSources,
        searchQueries: SourceProcessor.extractSearchQueries(
          response.response?.candidates?.[0]?.groundingMetadata
        ),
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        content: '抱歉，我在處理回應時遇到了問題。',
        tendencyScore: 5,
        error: GeminiErrorHandler.formatError(error),
      };
    }
  }

  /**
   * 生成替身回應
   */
  async generatePersonaResponse(
    persona: Persona,
    context: DebateContext,
    searchResults?: SourceReference[]
  ): Promise<GeminiResponse> {
    // 檢查快取
    const cacheKey = GeminiCache.generateKey(
      'persona_response',
      persona.id,
      context.topic,
      context.previousStatements.length
    );
    
    const cached = GeminiCache.get<GeminiResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    return GeminiErrorHandler.withRetry(async () => {
      const prompt = this.buildPersonaPrompt(persona, context, searchResults);
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }],
        generationConfig: {
          temperature: persona.temperature,
          maxOutputTokens: 800,
          topP: 0.8,
          topK: 40,
        },
      });

      const response = this.parseGeminiResponse(result);
      
      // 快取成功的回應（較短的 TTL，因為辯論內容時效性強）
      GeminiCache.set(cacheKey, response, 2 * 60 * 1000); // 2 分鐘
      
      return response;
    }, `生成 ${persona.name} 的回應`);
  }

  /**
   * 執行議題相關搜尋
   */
  async searchTopicInformation(
    topic: string,
    personaFocuses: string[]
  ): Promise<SourceReference[]> {
    // 檢查快取
    const cacheKey = GeminiCache.generateKey('topic_search', topic, personaFocuses);
    const cached = GeminiCache.get<SourceReference[]>(cacheKey);
    if (cached) {
      return cached;
    }

    return GeminiErrorHandler.withRetry(async () => {
      const searchQuery = `${topic} ${personaFocuses.join(' ')}`;
      
      const result = await this.model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ text: `請搜尋關於「${searchQuery}」的最新資訊和數據，重點關注：${personaFocuses.join('、')}` }] 
        }],
        tools: [{ googleSearchRetrieval: {} }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      });

      const sources = SourceProcessor.processGroundingMetadata(result);
      const validatedSources = SourceProcessor.validateSources(sources);
      
      // 快取搜尋結果（較長的 TTL，因為搜尋結果相對穩定）
      GeminiCache.set(cacheKey, validatedSources, 10 * 60 * 1000); // 10 分鐘
      
      return validatedSources;
    }, '搜尋議題資訊');
  }

  /**
   * 分析議題並生成搜尋關鍵詞
   */
  async analyzeTopicAndGenerateKeywords(
    topic: string,
    personas: Persona[]
  ): Promise<string[]> {
    // 檢查快取
    const cacheKey = GeminiCache.generateKey('topic_keywords', topic, personas.map(p => p.id));
    const cached = GeminiCache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      return await GeminiErrorHandler.withRetry(async () => {
        // 使用 PersonaEngine 生成基礎關鍵詞
        const baseKeywords = personas.flatMap(persona => 
          PersonaEngine.generateSearchKeywords(persona, topic)
        );
        
        const uniqueKeywords = [...new Set(baseKeywords)];
        
        const prompt = `
分析以下辯論議題，並根據參與者的專業領域生成 3-5 個最相關的搜尋關鍵詞：

議題：${topic}

參與者專業領域：${personas.map(p => p.identity).join('、')}

現有關鍵詞：${uniqueKeywords.join(', ')}

請提供能夠獲得最新、最相關資訊的搜尋關鍵詞，每行一個，不要包含編號或冒號：
`;

        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ googleSearchRetrieval: {} }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 200,
          },
        });

        const content = result.response?.text() || '';
        const aiKeywords = content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && !line.includes('：') && !line.match(/^\d+\./))
          .slice(0, 5);

        // 合併 AI 生成的關鍵詞和基礎關鍵詞
        const allKeywords = [...new Set([...aiKeywords, ...uniqueKeywords])];
        const finalKeywords = allKeywords.slice(0, 8);
        
        // 快取關鍵詞
        GeminiCache.set(cacheKey, finalKeywords, 15 * 60 * 1000); // 15 分鐘
        
        return finalKeywords;
      }, '分析議題並生成關鍵詞');
    } catch (error) {
      console.error('Error analyzing topic:', error);
      // 降級處理：使用 PersonaEngine 生成的關鍵詞
      const fallbackKeywords = personas.flatMap(persona => 
        PersonaEngine.generateSearchKeywords(persona, topic)
      );
      return [...new Set(fallbackKeywords)].slice(0, 5);
    }
  }
}

// 單例模式
let geminiService: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  return geminiService;
};

export default GeminiService;