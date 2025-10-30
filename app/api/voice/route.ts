import { NextRequest, NextResponse } from 'next/server';

interface VoiceRequest {
  text: string;
  voice?: string;
  emotion?: 'calm' | 'urgent' | 'warm' | 'firm';
  speed?: number;
  pitch?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'julija', emotion = 'calm', speed = 1.0, pitch = 1.0 } = await request.json();
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = 'ZT9u07TYPVl83ejeLakq'; // Julija's voice
    
    if (!apiKey) {
      console.error('ElevenLabs API key missing');
      return NextResponse.json(
        { error: 'Voice synthesis not configured' },
        { status: 500 }
      );
    }

    // Adjust voice settings based on emotion
    const voiceSettings = getVoiceSettings(emotion);
    
    // Clean text for better speech
    const cleanedText = preprocessText(text);
    
    console.log(`Generating speech: ${cleanedText.substring(0, 50)}...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: 'eleven_turbo_v2_5', // Upgraded from eleven_monolingual_v1 - faster, more natural
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity,
            style: voiceSettings.style,
            use_speaker_boost: true,
            speed: speed,
            pitch: pitch
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', response.status, errorText);
      
      // Handle specific errors
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait.' },
          { status: 429 }
        );
      } else if (response.status === 400) {
        return NextResponse.json(
          { error: 'Text too long or invalid' },
          { status: 400 }
        );
      }
      
      throw new Error(`Voice synthesis failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    console.log(`Audio generated: ${audioBuffer.byteLength} bytes`);
    
    // Add cache headers for efficiency
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Voice-Id': voiceId,
        'X-Emotion': emotion
      },
    });

  } catch (error) {
    console.error('Voice synthesis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Voice synthesis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getVoiceSettings(emotion: string) {
  const settings: { [key: string]: any } = {
    calm: {
      stability: 0.75,
      similarity: 0.75,
      style: 0.3
    },
    urgent: {
      stability: 0.5,
      similarity: 0.8,
      style: 0.6
    },
    warm: {
      stability: 0.6,
      similarity: 0.7,
      style: 0.5
    },
    firm: {
      stability: 0.85,
      similarity: 0.85,
      style: 0.2
    }
  };
  
  return settings[emotion] || settings.calm;
}

function preprocessText(text: string): string {
  // Remove markdown
  text = text.replace(/\*\*/g, '');
  text = text.replace(/\*/g, '');
  text = text.replace(/#/g, '');
  text = text.replace(/`/g, '');
  
  // Fix abbreviations for better speech
  text = text.replace(/\bCEO\b/g, 'C E O');
  text = text.replace(/\bROI\b/g, 'R O I');
  text = text.replace(/\bASAP\b/g, 'A S A P');
  text = text.replace(/\bFYI\b/g, 'F Y I');
  text = text.replace(/\bEOD\b/g, 'end of day');
  text = text.replace(/\bQ1\b/g, 'first quarter');
  text = text.replace(/\bQ2\b/g, 'second quarter');
  text = text.replace(/\bQ3\b/g, 'third quarter');
  text = text.replace(/\bQ4\b/g, 'fourth quarter');
  
  // Add pauses
  text = text.replace(/\. /g, '. ... ');
  text = text.replace(/\? /g, '? ... ');
  text = text.replace(/! /g, '! ... ');
  text = text.replace(/: /g, ': .. ');
  
  // Remove multiple spaces
  text = text.replace(/\s+/g, ' ');
  
  return text.trim();
}

// GET endpoint for testing
export async function GET() {
  const hasKey = !!process.env.ELEVENLABS_API_KEY;
  
  return NextResponse.json({
    status: hasKey ? 'configured' : 'not configured',
    voiceId: 'ZT9u07TYPVl83ejeLakq',
    voiceName: 'Julija',
    features: {
      emotions: ['calm', 'urgent', 'warm', 'firm'],
      speed: 'adjustable',
      pitch: 'adjustable'
    }
  });
}