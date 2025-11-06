import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 檢查環境變數
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Gemini API key not configured',
          timestamp: Date.now(),
        },
        { status: 503 }
      );
    }

    // 基本健康檢查
    const healthStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        gemini: 'configured',
        database: 'local_storage',
        search: 'google_grounding',
      },
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Health check failed',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}