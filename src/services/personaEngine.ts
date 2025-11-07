import { Persona, DebateContext, SourceReference } from '@/types';

/**
 * 替身人格引擎 - 負責管理和執行虛擬替身的人格特質
 */
export class PersonaEngine {
  /**
   * 建構替身的完整提示詞
   */
  static buildPersonaPrompt(
    persona: Persona,
    context: DebateContext,
    searchResults?: SourceReference[]
  ): string {
    const { topic, currentRound, previousStatements, activePersonas } = context;
    
    // 基礎人格設定
    const basePrompt = `
【替身身份設定】
身份：${persona.identity}
核心原則：${persona.primeDirective}
辯論風格：${persona.toneStyle}
預設傾向：${persona.defaultBias}
搜尋重點：${persona.ragFocus.join(', ')}

【辯論議題】
${topic}

【當前狀況】
- 辯論回合：第 ${currentRound} 回合
- 參與者：${activePersonas.map(p => p.name).join(', ')}
`;

    // 搜尋結果
    const searchContext = searchResults && searchResults.length > 0 ? `
【最新查證資訊】
請務必利用以下從網路搜尋獲得的最新事實/數據來支持或反駁你的論點：
${searchResults.map((result, index) => 
  `${index + 1}. ${result.title}\n   ${result.snippet}\n   來源：${result.url}`
).join('\n')}
` : '';

    // 辯論歷史
    const debateHistory = previousStatements.length > 0 ? `
【辯論歷史】
${previousStatements.map(stmt => {
  const speaker = activePersonas.find(p => p.id === stmt.personaId)?.name || '未知';
  return `${speaker}：${stmt.content}（傾向度：${stmt.tendencyScore}/10）`;
}).join('\n')}
` : '';

    // 上次發言重點（用於強制性推理）
    const lastStatement = previousStatements[previousStatements.length - 1];
    const challengeTarget = lastStatement ? `
【上次發言重點】
${activePersonas.find(p => p.id === lastStatement.personaId)?.name || '前一位發言者'} 主張：「${lastStatement.content}」
` : '';

    // 強制性三層推理指令
    const reasoningInstructions = PersonaEngine.buildReasoningInstructions(!!lastStatement);

    return basePrompt + searchContext + debateHistory + challengeTarget + reasoningInstructions;
  }

  /**
   * 建構強制性三層推理指令
   */
  private static buildReasoningInstructions(hasLastStatement: boolean): string {
    const analysisTarget = hasLastStatement ? '上次發言重點' : '當前議題';
    
    return `
【Chain of Thought 強制性推理流程】
在回應之前，你必須按照以下三個步驟進行深度思考（這些思考過程不會顯示給用戶）：

步驟一：解析階段 (ANALYZE)
- 仔細分析${analysisTarget}中的核心論點和假設
- 識別其中最薄弱的環節或與你核心原則衝突的部分
- 找出可能存在的邏輯漏洞、數據缺陷或偏見
- 評估論點的可信度和完整性

步驟二：批判階段 (CRITIQUE)  
- 基於你的專業背景和核心原則，對識別出的薄弱點進行深度批判
- 結合最新搜尋資訊，尋找能夠反駁或支持你觀點的具體證據
- 構建基於事實和邏輯的反駁論點
- 確保你的批判是建設性的，而非單純的否定

步驟三：策略階段 (STRATEGY)
- 制定你的回應策略，確保能夠有效傳達你的觀點
- 決定如何組織你的論點以達到最大說服力
- 規劃如何將辯論引導向對你有利的方向
- 準備針鋒相對的質疑和反問

【強制性輸出結構】
你的最終發言必須嚴格遵循以下結構：

1. 直接引用與挑戰 (30-40字)：
   - 明確引用前一位發言者的具體論點
   - 直接表達你的質疑或挑戰
   - 範例：「我必須質疑 [發言者] 提到的 [具體論點]，因為這忽略了 [關鍵因素]」

2. 證據支持的反駁 (80-120字)：
   - 提出你的核心反駁觀點
   - 引用搜尋結果中的具體數據或事實
   - 展示你的專業分析
   - 範例：「根據最新資料顯示，[具體數據] 表明 [你的觀點]。從 [你的專業角度] 來看，[詳細分析]」

3. 戰略性質疑 (20-30字)：
   - 提出一個直接、尖銳的問題
   - 將辯論的主動權轉移到對方
   - 範例：「那麼，[發言者] 如何解釋 [具體矛盾] 這個問題？」

4. 傾向度評分：
   - 格式：「傾向度分數：[1-10]/10」
   - 必須基於你的分析給出合理的分數

【質量要求】
- 總字數控制在 150-200 字之間
- 必須體現你的專業身份和核心原則
- 論點必須有理有據，避免空洞的修辭
- 語氣要符合你的辯論風格設定
- 確保每個部分都針鋒相對，避免泛泛而談

現在請開始你的深度推理和發言：
`;
  }

  /**
   * 解析替身回應，提取傾向度分數和推理過程
   */
  static parsePersonaResponse(content: string): {
    cleanContent: string;
    tendencyScore: number;
    reasoning?: {
      analyze: string;
      critique: string;
      strategy: string;
    };
    structureValidation: {
      hasDirectChallenge: boolean;
      hasEvidenceSupport: boolean;
      hasStrategicQuestion: boolean;
      hasTendencyScore: boolean;
      wordCount: number;
      qualityScore: number;
    };
  } {
    // 提取傾向度分數
    const tendencyMatch = content.match(/傾向度分數[：:]\s*(\d+)\/10/);
    const tendencyScore = tendencyMatch ? parseInt(tendencyMatch[1]) : 5;
    
    // 移除傾向度分數文字
    const cleanContent = content.replace(/傾向度分數[：:]\s*\d+\/10/, '').trim();
    
    // 嘗試提取推理過程（如果有的話）
    const reasoning = PersonaEngine.extractReasoning(content);
    
    // 驗證回應結構
    const structureValidation = PersonaEngine.validateResponseStructure(content);
    
    return {
      cleanContent,
      tendencyScore,
      reasoning,
      structureValidation,
    };
  }

  /**
   * 提取推理過程（如果存在於回應中）
   */
  private static extractReasoning(content: string): {
    analyze: string;
    critique: string;
    strategy: string;
  } | undefined {
    // 嘗試從內容中提取推理標記
    const analyzeMatch = content.match(/(?:分析|解析|ANALYZE)[：:](.+?)(?=(?:批判|質疑|CRITIQUE)|$)/i);
    const critiqueMatch = content.match(/(?:批判|質疑|CRITIQUE)[：:](.+?)(?=(?:策略|戰略|STRATEGY)|$)/i);
    const strategyMatch = content.match(/(?:策略|戰略|STRATEGY)[：:](.+?)(?=傾向度分數|$)/i);
    
    if (analyzeMatch || critiqueMatch || strategyMatch) {
      return {
        analyze: analyzeMatch?.[1]?.trim() || '',
        critique: critiqueMatch?.[1]?.trim() || '',
        strategy: strategyMatch?.[1]?.trim() || '',
      };
    }
    
    return undefined;
  }

  /**
   * 驗證回應結構的完整性和質量
   */
  private static validateResponseStructure(content: string): {
    hasDirectChallenge: boolean;
    hasEvidenceSupport: boolean;
    hasStrategicQuestion: boolean;
    hasTendencyScore: boolean;
    wordCount: number;
    qualityScore: number;
  } {
    const wordCount = content.replace(/\s+/g, '').length;
    
    // 檢查直接挑戰
    const challengePatterns = [
      /我必須質疑/,
      /我要挑戰/,
      /我不同意/,
      /我反對/,
      /這忽略了/,
      /這存在問題/
    ];
    const hasDirectChallenge = challengePatterns.some(pattern => pattern.test(content));
    
    // 檢查證據支持
    const evidencePatterns = [
      /根據.*資料/,
      /數據顯示/,
      /研究表明/,
      /事實證明/,
      /從.*角度/,
      /專業分析/
    ];
    const hasEvidenceSupport = evidencePatterns.some(pattern => pattern.test(content));
    
    // 檢查戰略性質疑
    const questionPatterns = [
      /如何解釋/,
      /怎麼看待/,
      /是否考慮/,
      /\?$/,
      /？$/
    ];
    const hasStrategicQuestion = questionPatterns.some(pattern => pattern.test(content));
    
    // 檢查傾向度分數
    const hasTendencyScore = /傾向度分數[：:]\s*\d+\/10/.test(content);
    
    // 計算質量分數
    let qualityScore = 0;
    if (hasDirectChallenge) qualityScore += 25;
    if (hasEvidenceSupport) qualityScore += 25;
    if (hasStrategicQuestion) qualityScore += 25;
    if (hasTendencyScore) qualityScore += 15;
    
    // 字數評分
    if (wordCount >= 150 && wordCount <= 250) {
      qualityScore += 10;
    } else if (wordCount >= 100 && wordCount < 150) {
      qualityScore += 5;
    }
    
    return {
      hasDirectChallenge,
      hasEvidenceSupport,
      hasStrategicQuestion,
      hasTendencyScore,
      wordCount,
      qualityScore,
    };
  }

  /**
   * 生成推理質量報告
   */
  static generateReasoningReport(
    persona: Persona,
    response: ReturnType<typeof PersonaEngine.parsePersonaResponse>
  ): {
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    suggestions: string[];
    strengths: string[];
  } {
    const { structureValidation } = response;
    const { qualityScore } = structureValidation;
    
    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (qualityScore >= 90) overallQuality = 'excellent';
    else if (qualityScore >= 70) overallQuality = 'good';
    else if (qualityScore >= 50) overallQuality = 'fair';
    else overallQuality = 'poor';
    
    const suggestions: string[] = [];
    const strengths: string[] = [];
    
    // 分析優點
    if (structureValidation.hasDirectChallenge) {
      strengths.push('成功進行了直接挑戰');
    }
    if (structureValidation.hasEvidenceSupport) {
      strengths.push('提供了證據支持');
    }
    if (structureValidation.hasStrategicQuestion) {
      strengths.push('包含了戰略性質疑');
    }
    
    // 分析改進建議
    if (!structureValidation.hasDirectChallenge) {
      suggestions.push('需要更直接地挑戰對方論點');
    }
    if (!structureValidation.hasEvidenceSupport) {
      suggestions.push('應該引用更多具體數據或事實');
    }
    if (!structureValidation.hasStrategicQuestion) {
      suggestions.push('缺少戰略性的反問或質疑');
    }
    if (structureValidation.wordCount < 100) {
      suggestions.push('回應內容過於簡短，需要更詳細的論述');
    }
    if (structureValidation.wordCount > 300) {
      suggestions.push('回應內容過長，需要更簡潔的表達');
    }
    
    return {
      overallQuality,
      suggestions,
      strengths,
    };
  }

  /**
   * 驗證替身配置的完整性
   */
  static validatePersona(persona: Partial<Persona>): string[] {
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
  }

  /**
   * 生成替身的搜尋關鍵詞
   */
  static generateSearchKeywords(persona: Persona, topic: string): string[] {
    const keywords = [topic];
    
    // 添加替身的搜尋重點
    keywords.push(...persona.ragFocus);
    
    // 根據身份添加相關關鍵詞
    if (persona.identity?.includes('CEO') || persona.identity?.includes('執行長')) {
      keywords.push('企業戰略', '商業模式', '市場競爭');
    }
    
    if (persona.identity?.includes('CTO') || persona.identity?.includes('技術長')) {
      keywords.push('技術趨勢', '創新技術', '技術架構');
    }
    
    if (persona.identity?.includes('CFO') || persona.identity?.includes('財務長')) {
      keywords.push('財務分析', '投資回報', '成本效益');
    }
    
    if (persona.identity?.includes('環保') || persona.identity?.includes('環境')) {
      keywords.push('環境影響', '可持續發展', '綠色技術');
    }
    
    if (persona.identity?.includes('法律') || persona.identity?.includes('律師')) {
      keywords.push('法律法規', '合規要求', '法律風險');
    }
    
    if (persona.identity?.includes('市場') || persona.identity?.includes('分析師')) {
      keywords.push('市場調研', '消費者行為', '市場趨勢');
    }
    
    // 去重並限制數量
    return [...new Set(keywords)].slice(0, 8);
  }

  /**
   * 計算替身之間的相似度
   */
  static calculatePersonaSimilarity(persona1: Persona, persona2: Persona): number {
    let similarity = 0;
    
    // 比較搜尋重點的重疊度
    const focus1 = new Set(persona1.ragFocus);
    const focus2 = new Set(persona2.ragFocus);
    const intersection = new Set([...focus1].filter(x => focus2.has(x)));
    const union = new Set([...focus1, ...focus2]);
    
    const focussimilarity = intersection.size / union.size;
    similarity += focussimilarity * 0.4;
    
    // 比較溫度參數的相似度
    const tempSimilarity = 1 - Math.abs(persona1.temperature - persona2.temperature);
    similarity += tempSimilarity * 0.2;
    
    // 比較身份描述的相似度（簡單的關鍵詞匹配）
    const identity1Words = (persona1.identity || '').toLowerCase().split(/\s+/);
    const identity2Words = (persona2.identity || '').toLowerCase().split(/\s+/);
    const identityIntersection = identity1Words.filter(word => identity2Words.includes(word));
    const identitySimilarity = identityIntersection.length / Math.max(identity1Words.length, identity2Words.length);
    similarity += identitySimilarity * 0.4;
    
    return Math.min(similarity, 1);
  }

  /**
   * 為替身生成建議的顏色
   */
  static suggestPersonaColor(persona: Persona): string {
    const identity = (persona.identity || '').toLowerCase();
    
    if (identity.includes('ceo') || identity.includes('執行長')) {
      return '#1f2937'; // 深灰色 - 權威
    }
    
    if (identity.includes('cto') || identity.includes('技術')) {
      return '#059669'; // 綠色 - 創新
    }
    
    if (identity.includes('cfo') || identity.includes('財務')) {
      return '#dc2626'; // 紅色 - 謹慎
    }
    
    if (identity.includes('環保') || identity.includes('環境')) {
      return '#16a34a'; // 綠色 - 環保
    }
    
    if (identity.includes('法律') || identity.includes('律師')) {
      return '#7c3aed'; // 紫色 - 嚴謹
    }
    
    if (identity.includes('市場') || identity.includes('分析')) {
      return '#ea580c'; // 橙色 - 分析
    }
    
    // 預設顏色
    const colors = ['#0891b2', '#be123c', '#166534', '#7c2d12', '#581c87', '#92400e', '#1e40af'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default PersonaEngine;