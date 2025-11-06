import { GeminiResponse } from '@/types';

interface TopicGenerationRequest {
  firstStatement: string;
  context?: string;
}

export async function generateTopicFromStatement(
  request: TopicGenerationRequest
): Promise<string> {
  try {
    const response = await fetch('/api/generate-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.topic || '討論議題';
  } catch (error) {
    console.error('生成主題失敗:', error);
    return '討論議題'; // 返回默認主題
  }
}

export async function analyzeStatementForTopic(statement: string): Promise<string> {
  // 簡單的本地分析邏輯，提取關鍵詞作為主題
  const keywords = extractKeywords(statement);
  
  if (keywords.length > 0) {
    return keywords.slice(0, 3).join('、') + '相關討論';
  }
  
  return '討論議題';
}

function extractKeywords(text: string): string[] {
  // 移除標點符號和停用詞
  const stopWords = ['的', '是', '在', '有', '和', '與', '或', '但', '然而', '因此', '所以', '如果', '那麼', '這個', '那個', '我們', '你們', '他們'];
  
  const words = text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 保留中文、英文、數字
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word));
  
  // 簡單的詞頻統計
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // 按頻率排序並返回前幾個關鍵詞
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}