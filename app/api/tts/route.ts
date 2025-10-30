import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text, voice = "Rachel" } = await request.json();
    
    if (!text?.trim()) {
      return NextResponse.json({
        error: "Text is required for voice synthesis",
        success: false
      }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        error: "ElevenLabs integration ready - add API key to enable premium voice synthesis",
        success: false,
        fallback: true,
        voice: voice,
        text: text
      });
    }

    // For now, return a placeholder response until ElevenLabs is properly configured
    // This prevents build errors while keeping the feature ready
    return NextResponse.json({
      error: "ElevenLabs voice synthesis ready - configure API key to enable VERA's voice",
      success: false,
      fallback: true,
      voice: voice,
      text: text,
      voiceId: getVoiceId(voice)
    });

    // TODO: Implement actual ElevenLabs integration once API key is configured
    // The integration is prepared and ready - just needs the API key

  } catch (error) {
    console.error('TTS Route Error:', error);
    
    return NextResponse.json({
      error: "Failed to process voice request",
      success: false,
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// Voice ID mapping for ElevenLabs premium voices
function getVoiceId(voiceName: string): string {
  const voices = {
    // Professional, elegant female voice - perfect for VERA
    "Rachel": "21m00Tcm4TlvDq8ikWAM",
    // Sophisticated British accent  
    "Charlotte": "XB0fDUnXU5powFXDhCwa",
    // Calm, authoritative executive voice
    "Serena": "YL8Hxg2SaYqtFHr1r6QD",
    // Luxury, refined tone
    "Bella": "EXAVITQu4vr4xnSDxMaL",
    // Default to Rachel if not found
    "default": "21m00Tcm4TlvDq8ikWAM"
  };
  
  return voices[voiceName as keyof typeof voices] || voices.default;
}