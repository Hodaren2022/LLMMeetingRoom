import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();
    
    const geminiService = getGeminiService();
    
    switch (action) {
      case 'grounding': {
        const { topic, personas } = params;
        
        if (!topic || !personas) {
          return NextResponse.json(
            { error: 'Topic and personas are required for grounding search' },
            { status: 400 }
          );
        }

        const keywords = await geminiService.analyzeTopicAndGenerateKeywords(topic, personas);
        const searchResults = await geminiService.searchTopicInformation(topic, keywords);

        return NextResponse.json({
          query: topic,
          keywords,
          results: searchResults,
          timestamp: Date.now(),
          personaFocus: personas.flatMap((p: any) => p.ragFocus),
          success: true,
        });
      }
      
      case 'keywords': {
        const { topic, personas } = params;
        
        if (!topic || !personas) {
          return NextResponse.json(
            { error: 'Topic and personas are required for keyword generation' },
            { status: 400 }
          );
        }

        const keywords = await geminiService.analyzeTopicAndGenerateKeywords(topic, personas);

        return NextResponse.json({
          topic,
          keywords,
          success: true,
        });
      }
      
      case 'search': {
        const { topic, keywords } = params;
        
        if (!topic) {
          return NextResponse.json(
            { error: 'Topic is required for search' },
            { status: 400 }
          );
        }

        const searchKeywords = keywords || [topic];
        const searchResults = await geminiService.searchTopicInformation(topic, searchKeywords);

        return NextResponse.json({
          query: topic,
          keywords: searchKeywords,
          results: searchResults,
          timestamp: Date.now(),
          success: true,
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown search action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform search operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}