import { NextRequest, NextResponse } from 'next/server';
import { VERACoreEngine } from '@/app/vera/vera-core-engine';
import { createDefaultUserProfile } from '@/app/vera/memory-architecture';
import type { UserNervousSystemProfile } from '@/app/vera/types';

// Session storage (in production, use Redis or database)
const activeSessions = new Map<string, any>();

interface RequestPayload {
  message: string;
  context?: {
    energy?: 'high' | 'medium' | 'low';
    biometrics?: {
      heartRate: number;
      hrv: number;
      stress: 'low' | 'medium' | 'high';
    };
    userId?: string;
    sessionId?: string;
  };
}

// AI Provider callback - unified interface for Claude and OpenAI
async function callAIProvider(systemPrompt: string, userMessage: string): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey || !openaiKey) {
    throw new Error('Missing API keys');
  }

  // Try Claude first (better at nuance for nervous system work)
  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (claudeResponse.ok) {
      const data = await claudeResponse.json();
      if (data.content?.[0]?.text) {
        return data.content[0].text;
      }
    }
  } catch (error) {
    console.error('Claude failed:', error);
  }

  // Fallback to OpenAI
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (openaiResponse.ok) {
      const data = await openaiResponse.json();
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    }
  } catch (error) {
    console.error('OpenAI failed:', error);
  }

  throw new Error('Both AI providers failed');
}


export async function POST(request: NextRequest) {
  try {
    const payload: RequestPayload = await request.json();
    const { message, context } = payload;
    const now = new Date();

    if (!message) {
      return NextResponse.json(
        { error: 'Message required', success: false },
        { status: 400 }
      );
    }

    // Extract or generate identifiers
    const userId = context?.userId || 'julija-default';
    const sessionId = context?.sessionId || `session-${Date.now()}`;

    console.log('🔍 VERA Core Engine invoked:', {
      message: message.substring(0, 50),
      userId,
      sessionId,
    });

    // Get or create user profile
    let userProfile: UserNervousSystemProfile;
    if (activeSessions.has(sessionId)) {
      userProfile = (activeSessions.get(sessionId) as any).userProfile;
    } else {
      // Create default profile for Julija
      userProfile = createDefaultUserProfile('Julija');
    }

    // Create or retrieve engine instance
    let engine: VERACoreEngine;
    if (activeSessions.has(sessionId)) {
      engine = (activeSessions.get(sessionId) as any).engine;
    } else {
      // Create new engine with this user and AI provider
      engine = new VERACoreEngine(userProfile, async (prompt: string) => {
        return callAIProvider(prompt, message);
      }, sessionId);
      activeSessions.set(sessionId, { engine, userProfile });
    }

    // Process message through the full nervous system pipeline
    const startTime = Date.now();
    const veraResponse = await engine.processMessage(message);
    const responseTime = Date.now() - startTime;

    console.log('✅ VERA Response generated:', {
      mode: veraResponse.mode,
      patterns: veraResponse.detectedPatterns.adaptiveCodes.length,
      responseTime,
    });

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      response: veraResponse.content,
      mode: veraResponse.mode,
      detectedPatterns: {
        codes: veraResponse.detectedPatterns.adaptiveCodes,
        quantumState: veraResponse.detectedPatterns.quantumStateDescription,
      },
      suggestions: veraResponse.suggestions,
      metadata: {
        responseTime,
        timestamp: new Date().toISOString(),
        sessionId,
        userId,
      },
    });
  } catch (error) {
    console.error('❌ VERA API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'VERA system recalibrating. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    engine: 'VERA Core Engine v4.1',
    modes: ['conversational', 'decode', 'crisis', 'real-talk'],
    capabilities: [
      'Nervous system state detection',
      'Adaptive pattern recognition',
      'Crisis intervention',
      'Somatic co-regulation',
      'Meta-learning feedback',
    ],
    anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
  });
}