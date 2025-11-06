import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/services/geminiService';
import { Persona, DebateContext, SourceReference } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();
    
    const geminiService = getGeminiService();
    
    switch (action) {
      case 'speak': {
        const { persona, context, searchResults } = params as {
          persona: Persona;
          context: DebateContext;
          searchResults?: SourceReference[];
        };
        
        if (!persona || !context) {
          return NextResponse.json(
            { error: 'Persona and context are required for speak action' },
            { status: 400 }
          );
        }

        const response = await geminiService.generatePersonaResponse(
          persona,
          context,
          searchResults
        );

        return NextResponse.json({
          response,
          success: true,
        });
      }
      
      case 'search': {
        const { topic, personas } = params as {
          topic: string;
          personas: Persona[];
        };
        
        if (!topic || !personas) {
          return NextResponse.json(
            { error: 'Topic and personas are required for search action' },
            { status: 400 }
          );
        }

        const keywords = await geminiService.analyzeTopicAndGenerateKeywords(topic, personas);
        const searchResults = await geminiService.searchTopicInformation(topic, keywords);

        return NextResponse.json({
          keywords,
          searchResults,
          success: true,
        });
      }
      
      case 'analyze': {
        const { topic, personas } = params as {
          topic: string;
          personas: Persona[];
        };
        
        if (!topic || !personas) {
          return NextResponse.json(
            { error: 'Topic and personas are required for analyze action' },
            { status: 400 }
          );
        }

        const keywords = await geminiService.analyzeTopicAndGenerateKeywords(topic, personas);

        return NextResponse.json({
          keywords,
          success: true,
        });
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in debate API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process debate request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}