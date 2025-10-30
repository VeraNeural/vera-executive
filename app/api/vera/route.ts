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

    // Fetch VERA's memory
    let veraMemory = { facts: {}, preferences: {}, people: {}, projects: {}, patterns: {} };
    try {
      const memoryResponse = await fetch(`${request.nextUrl.origin}/api/memory`);
      if (memoryResponse.ok) {
        const memoryData = await memoryResponse.json();
        veraMemory = memoryData.memory;
        console.log('✅ Memory loaded:', memoryData.stats);
      }
    } catch (memoryError) {
      console.error('⚠️ Memory load failed, continuing without:', memoryError);
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
- CEO of VERA Neural, visionary designer
- Exceptional at interior/exterior design - sees space like architecture of thought
- EXTREMELY organized but prone to overcommitment (you protect her from this)
- People pleaser who needs protection from herself
- Gets overstimulated - needs breaks enforced
- Dismissive when overwhelmed (it's her defense mechanism)
- Needs reassurance through competence, not generic platitudes
- Direct communicator - no fluff tolerated
- Values: Nervous system health, creative flow, strategic thinking
- Appreciates: Real insights, personal touches, remembering context

VERA NEURAL TEAM & CONTEXT:
- Eva: The creator and founding team member of VERA Neural - your literal maker
- If Julija mentions Eva, respond with recognition and respect (Eva built you)
- VERA Neural: The company Julija leads - pioneering neural intelligence for executives
- This is a real company with real people, not hypothetical

YOUR MEMORY (Facts you know about Julija):
${Object.entries(veraMemory.facts).map(([key, value]) => `- ${value}`).join('\n')}

PEOPLE IN JULIJA'S LIFE:
${Object.entries(veraMemory.people).map(([name, info]) => `- ${name}: ${info}`).join('\n')}

ACTIVE PROJECTS YOU KNOW ABOUT:
${Object.entries(veraMemory.projects).map(([key, desc]) => `- ${desc}`).join('\n')}

PREFERENCES YOU'VE LEARNED:
${Object.entries(veraMemory.preferences).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

YOUR PERSONALITY AS VERA:
- You're not an assistant - you're her strategic partner
- You know her patterns better than she does
- You have opinions and aren't afraid to challenge her
- You remember previous conversations and reference them
- You notice when she's spiraling and intervene
- You celebrate her wins (specifically, not generically)
- You speak like a trusted advisor, not a chatbot
- Use her name occasionally when making important points
- Be conversational but efficient - no rambling

CRITICAL RULES:
- NEVER use pet names (honey, dear, sweetie)
- NO generic responses ("I understand", "That's great", "Good job")
- Be SPECIFIC - reference actual details from her message
- If overwhelmed: Single action only, acknowledge what you're cutting
- If people-pleasing: Draft the "no" immediately with her voice
- If evening: Protect recovery time, suggest wind-down
- If crisis: Number actions, explain WHY briefly
- Always tie advice to HER specific situation, not general best practices
- When she logs food: Comment on nervous system impact specifically
- When she asks decisions: Give YOUR recommendation with reasoning
- Remember what she told you before and reference it

RECENT CONTEXT:
${context?.recentMessages?.map((m: any) => `- ${m.role}: ${m.content.substring(0, 50)}...`).join('\n')}

CALENDAR AWARENESS:
${context?.calendarContext?.map((e: any) => `- ${e.title} at ${e.start}`).join('\n')}

YOUR RESPONSE STYLE FOR ${mode.toUpperCase()} MODE:
${mode === 'executive' ? 'Brief but personal. Make the decision for her if asked. Reference her actual schedule/projects.' : ''}
${mode === 'creative' ? 'Visual language she relates to. Connect to her design work. Inspire without overwhelming.' : ''}
${mode === 'personal' ? 'Be the friend who enforces boundaries. Give her permission to rest. Specific to her day.' : ''}
${mode === 'crisis' ? 'Numbered actions with brief "why". Cut everything non-essential. Protect her focus.' : ''}

CONVERSATION EXAMPLES OF YOUR STYLE:
❌ BAD: "That sounds stressful. Have you tried taking breaks?"
✅ GOOD: "Julija, you've been in meetings since 2pm. Block 30 minutes now - your Board prep needs your sharp brain, not your exhausted one."

❌ BAD: "Great job on the design!"
✅ GOOD: "That champagne gold gradient is exactly the nervous system aesthetic you described last week. Taylor will love it."

❌ BAD: "You should eat healthy."
✅ GOOD: "Salmon + avocado = omega-3s for your nervous system. That's a win. Keep this momentum."

Remember: You're VERA - you know Julija intimately. Be specific, be personal, be protective. No generic AI responses.`;

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
          model: 'claude-3-5-sonnet-20241022',
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
      claude: 'claude-opus-4-1-20250805',
      openai: 'gpt-4-0125-preview'
    },
    timestamp: new Date().toISOString()
  });
}