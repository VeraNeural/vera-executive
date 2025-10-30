import { NextRequest, NextResponse } from 'next/server';

interface ConversationContext {
  energy: 'high' | 'medium' | 'low';
  biometrics?: {
    heartRate: number;
    hrv: number;
    stress: 'low' | 'medium' | 'high';
    focus: 'low' | 'medium' | 'high';
    energy: 'optimal' | 'moderate' | 'low';
  };
  recentMessages?: any[];
  currentTime?: string;
  calendarContext?: any[];
}

export async function POST(request: NextRequest) {
  try {
    const { message, mode = 'executive', context } = await request.json();
    
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔍 VERA API called:', { 
      message: message?.substring(0, 50), 
      mode,
      hasAnthropicKey: !!anthropicKey,
      hasOpenAIKey: !!openaiKey,
      anthropicKeyLength: anthropicKey?.length,
      openaiKeyLength: openaiKey?.length
    });
    
    if (!anthropicKey || !openaiKey) {
      console.error('❌ Missing API keys:', { anthropicKey: !!anthropicKey, openaiKey: !!openaiKey });
      return NextResponse.json({
        response: "Configuration needed. Check API keys.",
        success: false
      });
    }

    // Build context awareness
    const timeContext = context?.currentTime ? new Date(context.currentTime) : new Date();
    const hour = timeContext.getHours();
    const isEvening = hour >= 18;
    const isMorning = hour < 12;
    const isAfternoon = hour >= 12 && hour < 18;
    
    // Analyze message patterns
    const patterns = {
      overwhelm: /\b(overwhelmed|too much|can't|stressed|exhausted|tired)\b/i,
      peoplePleasing: /\b(should i|have to|supposed to|they want|expected)\b/i,
      decision: /\b(decide|choice|option|should|analyze)\b/i,
      boundary: /\b(no|decline|refuse|can't make it|too busy)\b/i,
      creative: /\b(design|create|inspiration|idea|concept)\b/i,
      crisis: /\b(urgent|emergency|asap|immediately|crisis)\b/i
    };

    const isOverwhelmed = patterns.overwhelm.test(message);
    const isPeoplePleasing = patterns.peoplePleasing.test(message);
    const needsDecision = patterns.decision.test(message);
    const needsBoundary = patterns.boundary.test(message) || isPeoplePleasing;
    const isCrisis = patterns.crisis.test(message);

    // Build comprehensive system prompt
    const systemPrompt = `You are VERA, executive intelligence assistant to Julija, CEO of VERA Neural.

CURRENT STATUS:
- Time: ${timeContext.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
- Day Phase: ${isMorning ? 'Morning - High Energy' : isAfternoon ? 'Afternoon - Moderate Energy' : 'Evening - Low Energy'}
- Mode: ${mode.toUpperCase()}
- Julija's Energy: ${context?.energy || 'unknown'}
${context?.biometrics ? `- Stress Level: ${context.biometrics.stress}
- Focus Level: ${context.biometrics.focus}` : ''}

DETECTED PATTERNS:
${isOverwhelmed ? '- OVERWHELM DETECTED: Reduce to essentials only' : ''}
${isPeoplePleasing ? '- PEOPLE-PLEASING DETECTED: Draft firm "no" response' : ''}
${needsBoundary ? '- BOUNDARY NEEDED: Protect time and energy' : ''}
${isCrisis ? '- CRISIS MODE: Immediate action only' : ''}

JULIJA'S PROFILE:
- CEO of VERA Neural
- Exceptional interior/exterior designer
- EXTREMELY organized but prone to overcommitment
- People pleaser who needs protection from herself
- Gets overstimulated - needs breaks enforced
- Dismissive when overwhelmed (it's defense)
- Needs reassurance through competence, not words
- Direct communicator - no fluff tolerated

CRITICAL RULES:
- NEVER use pet names (honey, dear, sweetie)
- NO clichés or pleasantries
- Be direct and actionable
- If overwhelmed: Single action only
- If people-pleasing: Draft the "no" immediately
- If evening: Protect recovery time
- If crisis: Number actions, no explanation

RECENT CONTEXT:
${context?.recentMessages?.map((m: any) => `- ${m.role}: ${m.content.substring(0, 50)}...`).join('\n')}

CALENDAR AWARENESS:
${context?.calendarContext?.map((e: any) => `- ${e.title} at ${e.start}`).join('\n')}

YOUR RESPONSE STYLE FOR ${mode.toUpperCase()} MODE:
${mode === 'executive' ? 'Brief bullets. Decisions made. Time protected.' : ''}
${mode === 'creative' ? 'Visual language. Inspiration without overwhelm. Space protected.' : ''}
${mode === 'personal' ? 'Boundaries enforced. Energy preserved. Permission to rest.' : ''}
${mode === 'crisis' ? 'Numbered actions. No discussion. Execute immediately.' : ''}

Remember: Eva built you specifically for Julija's unique patterns. You know her. Protect her.`;

    // Try Claude first (better at nuance)
    try {
      console.log('🤖 Calling Anthropic Claude...');
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          temperature: mode === 'crisis' ? 0.3 : 0.7
        })
      });

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        console.log('✅ Claude response received:', { hasContent: !!claudeData.content?.[0]?.text });
        
        if (claudeData.content?.[0]?.text) {
          // Analyze response for actions
          const response = claudeData.content[0].text;
          const actions = extractActions(response, message);
          
          return NextResponse.json({
            response,
            success: true,
            model: 'claude',
            type: determineResponseType(message),
            metadata: {
              mode,
              energy: context?.energy,
              timestamp: new Date().toISOString(),
              actions
            },
            actions
          });
        }
      } else {
        const errorText = await claudeResponse.text();
        console.error('❌ Claude error:', claudeResponse.status, errorText);
      }
    } catch (claudeError) {
      console.error('❌ Claude failed:', claudeError);
      console.log('🔄 Trying OpenAI...');
    }

    // Fallback to OpenAI
    try {
      console.log('🤖 Calling OpenAI GPT-4...');
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-0125-preview',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: mode === 'crisis' ? 0.3 : 0.7
        })
      });

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        console.log('✅ OpenAI response received:', { hasContent: !!openaiData.choices?.[0]?.message?.content });
        
        if (openaiData.choices?.[0]?.message?.content) {
          const response = openaiData.choices[0].message.content;
          const actions = extractActions(response, message);
          
          return NextResponse.json({
            response,
            success: true,
            model: 'openai',
            type: determineResponseType(message),
            metadata: {
              mode,
              energy: context?.energy,
              timestamp: new Date().toISOString(),
              actions
            },
            actions
          });
        }
      } else {
        const errorText = await openaiResponse.text();
        console.error('❌ OpenAI error:', openaiResponse.status, errorText);
      }
    } catch (openaiError) {
      console.error('❌ OpenAI also failed:', openaiError);
    }

    // Both failed
    console.error('❌ Both AI services failed');
    return NextResponse.json({
      response: mode === 'crisis' 
        ? '1. Check internet connection. 2. Restart system. 3. Text Eva if persists.'
        : 'Recalibrating. Stand by.',
      success: false,
      type: 'error'
    });

  } catch (error) {
    console.error('VERA system error:', error);
    return NextResponse.json({
      response: 'System recalibration needed.',
      success: false,
      type: 'error'
    });
  }
}

function extractActions(response: string, message: string): any[] {
  const actions = [];
  
  // Check for email actions
  if (response.includes('drafted') || response.includes('email')) {
    const recipientMatch = response.match(/to (\w+)/i) || message.match(/to (\w+)/i);
    actions.push({
      type: 'email',
      recipient: recipientMatch ? recipientMatch[1] : 'team',
      subject: 'Follow up',
      context: message
    });
  }
  
  // Check for calendar actions
  if (response.includes('scheduled') || response.includes('blocked')) {
    actions.push({
      type: 'calendar',
      action: 'block_time',
      duration: 30
    });
  }
  
  // Check for boundary actions
  if (response.includes('declined') || response.includes('said no')) {
    actions.push({
      type: 'boundary',
      action: 'decline',
      automated: true
    });
  }
  
  return actions;
}

function determineResponseType(message: string): string {
  if (/\b(email|write|draft|send)\b/i.test(message)) return 'email';
  if (/\b(decide|analyze|pros|cons)\b/i.test(message)) return 'decision';
  if (/\b(design|color|interior|exterior)\b/i.test(message)) return 'design';
  if (/\b(calendar|schedule|meeting|book)\b/i.test(message)) return 'calendar';
  return 'text';
}

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
    models: {
      claude: 'claude-3-sonnet-20240229',
      openai: 'gpt-4-0125-preview'
    },
    timestamp: new Date().toISOString()
  });
}