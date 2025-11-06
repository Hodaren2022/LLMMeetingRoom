import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/services/geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { firstStatement, context } = await request.json();

    if (!firstStatement) {
      return NextResponse.json(
        { error: '缺少必要的參數：firstStatement' },
        { status: 400 }
      );
    }

    // 構建主題生成的提示詞
    const prompt = `
請根據以下第一個發言內容，生成一個簡潔且準確的會議主題。

發言內容：
"${firstStatement}"

${context ? `會議背景：${context}` : ''}

要求：
1. 主題應該簡潔明了，不超過20個字
2. 準確反映討論的核心議題
3. 使用中文
4. 避免過於具體的細節
5. 適合作為辯論會議的標題

請直接返回主題，不需要其他說明。
`;

    // 使用簡化的 Gemini API 調用來生成主題
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 100,
      },
    });

    const content = result.response?.text() || '';

    // 清理生成的主題，移除引號和多餘的文字
    let topic = content.trim();
    topic = topic.replace(/^["「『]|["」』]$/g, ''); // 移除首尾引號
    topic = topic.replace(/^主題：|^會議主題：/g, ''); // 移除前綴
    topic = topic.trim();

    // 確保主題不為空
    if (!topic) {
      topic = '討論議題';
    }

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('生成主題時發生錯誤:', error);
    return NextResponse.json(
      { error: '生成主題失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}