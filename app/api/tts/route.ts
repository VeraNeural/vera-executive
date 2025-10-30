import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text, voice = "Rachel" } = await request.json();
    
    console.log('🎤 TTS API called:', { textLength: text?.length, voice });
    
    if (!text?.trim()) {
      console.error('❌ TTS: No text provided');
      return NextResponse.json({
        error: "Text is required for voice synthesis",
        success: false
      }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || getVoiceId(voice);

    console.log('🔑 ElevenLabs config:', { 
      hasApiKey: !!apiKey, 
      voiceId, 
      apiKeyLength: apiKey?.length 
    });

    if (!apiKey) {
      console.error('❌ TTS: ElevenLabs API key not configured');
      return NextResponse.json({
        error: "ElevenLabs API key not configured",
        success: false
      }, { status: 500 });
    }

    // Clean text for speech (remove markdown formatting)
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold **text**
      .replace(/\*/g, '')   // Remove italic *text*
      .replace(/_{2,}/g, '') // Remove __underline__
      .replace(/_/g, '')     // Remove _italic_
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links [text](url)
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code `code`
      .replace(/#{1,6}\s/g, '') // Remove headers #
      .replace(/[-*+]\s/g, '') // Remove bullet points
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    console.log('🎙️ Calling ElevenLabs API...', { originalLength: text.length, cleanedLength: cleanText.length });
    
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
          text: cleanText.substring(0, 5000), // Limit to 5000 chars
          model_id: 'eleven_turbo_v2_5', // Upgraded model - faster, more natural
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
      console.error('❌ ElevenLabs API error:', elevenlabsResponse.status, error);
      return NextResponse.json({
        error: 'Voice synthesis failed',
        success: false,
        details: error
      }, { status: 500 });
    }

    // Return audio stream
    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    console.log('✅ Voice synthesis successful:', { audioSize: audioBuffer.byteLength });
    
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