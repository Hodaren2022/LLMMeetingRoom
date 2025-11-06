import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const { topic, personas } = await request.json();
    
    if (!topic || !personas) {
      return NextResponse.json(
        { error: 'Topic and personas are required' },
        { status: 400 }
      );
    }

    const geminiService = getGeminiService();
    const keywords = await geminiService.analyzeTopicAndGenerateKeywords(topic, personas);
    const searchResults = await geminiService.searchTopicInformation(topic, keywords);

    return NextResponse.json({
      keywords,
      searchResults,
      success: true,
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to search topic information' },
      { status: 500 }
    );
  }
}