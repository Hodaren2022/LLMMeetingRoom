import { NextRequest, NextResponse } from 'next/server';
import { getGeminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const { persona, context, searchResults } = await request.json();
    
    if (!persona || !context) {
      return NextResponse.json(
        { error: 'Persona and context are required' },
        { status: 400 }
      );
    }

    const geminiService = getGeminiService();
    const response = await geminiService.generatePersonaResponse(
      persona,
      context,
      searchResults
    );

    return NextResponse.json({
      response,
      success: true,
    });
  } catch (error) {
    console.error('Error in debate API:', error);
    return NextResponse.json(
      { error: 'Failed to generate persona response' },
      { status: 500 }
    );
  }
}