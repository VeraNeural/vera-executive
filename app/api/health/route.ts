import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    env: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      anthropicLength: process.env.ANTHROPIC_API_KEY?.length || 0,
      openaiLength: process.env.OPENAI_API_KEY?.length || 0,
      elevenlabsLength: process.env.ELEVENLABS_API_KEY?.length || 0,
    }
  });
}
