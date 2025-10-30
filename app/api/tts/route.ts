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

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || getVoiceId(voice);

    if (!apiKey) {
      return NextResponse.json({
        error: "ElevenLabs API key not configured",
        success: false
      }, { status: 500 });
    }

    // Call ElevenLabs API
    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text.substring(0, 5000), // Limit to 5000 chars
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!elevenlabsResponse.ok) {
      const error = await elevenlabsResponse.text();
      console.error('ElevenLabs error:', error);
      return NextResponse.json({
        error: 'Voice synthesis failed',
        success: false
      }, { status: 500 });
    }

    // Return audio stream
    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

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