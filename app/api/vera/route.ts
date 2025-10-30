import { NextRequest, NextResponse } from "next/server";
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface UserContext {
  energyLevel: 'high' | 'medium' | 'low';
  timestamp: string;
  mode?: string;
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  priority: 'high' | 'medium' | 'low';
}

// Context detection based on message patterns and user state
function detectUserState(message: string, context: UserContext): 'focused' | 'stressed' | 'creative' | 'executive' {
  const stressKeywords = ['urgent', 'crisis', 'emergency', 'problem', 'issue', 'help', 'stuck'];
  const creativeKeywords = ['idea', 'brainstorm', 'creative', 'innovation', 'design', 'imagine'];
  const executiveKeywords = ['strategy', 'decision', 'budget', 'team', 'meeting', 'goals', 'performance'];
  
  const lowerMessage = message.toLowerCase();
  
  if (context.mode === 'Crisis' || stressKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'stressed';
  }
  
  if (context.mode === 'Creative' || creativeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'creative';
  }
  
  if (context.mode === 'Executive' || executiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'executive';
  }
  
  return 'focused';
}

// Determine which AI to use based on query complexity and type
function shouldUseClaude(message: string, userState: string): boolean {
  const complexPatterns = [
    /analyze|analysis|complex|strategy|detailed|comprehensive/i,
    /explain.*why|reasoning|logic|rationale/i,
    /multiple.*options|alternatives|pros.*cons/i,
    /ethical|moral|philosophical/i,
    /long.*term|future.*planning/i
  ];
  
  const isComplex = complexPatterns.some(pattern => pattern.test(message));
  const isLongQuery = message.length > 200;
  const isExecutiveMode = userState === 'executive';
  
  return isComplex || isLongQuery || isExecutiveMode;
}

// Enhanced prompt building based on mode and context
function buildPrompt(message: string, mode: string, userState: string, context: UserContext): string {
  const basePersonality = "You are VERA, an ultra-sophisticated executive intelligence system. You speak with precision, elegance, and insight befitting a $50M smart home AI. Be concise yet profound.";
  
  const modePrompts = {
    Executive: "Focus on strategic thinking, leadership insights, and business acumen. Provide actionable executive-level advice.",
    Creative: "Embrace innovative thinking, artistic inspiration, and out-of-the-box solutions. Encourage creative exploration.",
    Personal: "Be warm yet sophisticated, offering personal growth insights and lifestyle optimization.",
    Crisis: "Respond with urgency and clarity. Provide immediate, actionable solutions and calm guidance."
  };
  
  const stateModifiers = {
    focused: "The user is in a focused state. Provide clear, direct responses.",
    stressed: "The user appears stressed. Offer calming, structured solutions and reassurance.",
    creative: "The user is in a creative mindset. Encourage exploration and innovative thinking.",
    executive: "The user is in executive mode. Provide strategic, high-level insights."
  };
  
  const energyContext = context.energyLevel === 'low' 
    ? "The user's energy is low. Keep responses energizing but not overwhelming."
    : context.energyLevel === 'high'
    ? "The user's energy is high. Match their intensity with dynamic responses."
    : "The user's energy is moderate. Provide balanced, steady guidance.";
  
  return `${basePersonality}

Mode: ${mode}
${modePrompts[mode as keyof typeof modePrompts]}

User State: ${userState}
${stateModifiers[userState as keyof typeof stateModifiers]}

Context: ${energyContext}

User Message: "${message}"

Respond as VERA with sophisticated intelligence and executive presence.`;
}

// Calendar intelligence functions
async function getCalendarInsights(): Promise<CalendarEvent[]> {
  // This would integrate with actual calendar APIs (Google Calendar, Outlook, etc.)
  // For now, return mock data
  return [
    {
      title: "Board Meeting",
      start: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      end: new Date(Date.now() + 3 * 60 * 60 * 1000),
      priority: 'high'
    },
    {
      title: "Team Strategy Session",
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      end: new Date(Date.now() + 25 * 60 * 60 * 1000),
      priority: 'medium'
    }
  ];
}

async function generateCalendarResponse(events: CalendarEvent[]): Promise<string> {
  if (events.length === 0) return "";
  
  const upcomingEvents = events.filter(event => event.start > new Date());
  if (upcomingEvents.length === 0) return "";
  
  const nextEvent = upcomingEvents[0];
  const timeUntil = Math.round((nextEvent.start.getTime() - Date.now()) / (1000 * 60));
  
  if (timeUntil <= 120) { // Within 2 hours
    return `\n\n📅 Calendar Alert: "${nextEvent.title}" begins in ${timeUntil} minutes.`;
  }
  
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const { message, mode = 'Executive', context = {} } = await request.json();
    
    if (!message?.trim()) {
      return NextResponse.json({
        response: "I'm here and ready to assist you.",
        success: true,
        timestamp: new Date().toISOString(),
        context: { mode, userState: 'focused' }
      });
    }

    // Detect user state and context
    const userState = detectUserState(message, context);
    const useClaude = shouldUseClaude(message, userState);
    
    // Build enhanced prompt
    const prompt = buildPrompt(message, mode, userState, context);
    
    // Get calendar insights
    const calendarEvents = await getCalendarInsights();
    const calendarAlert = await generateCalendarResponse(calendarEvents);
    
    let aiResponse = "";
    
    try {
      if (useClaude && process.env.ANTHROPIC_API_KEY) {
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }],
        });
        
        aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';
      } else if (process.env.OPENAI_API_KEY) {
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
        });
        
        aiResponse = response.choices[0]?.message?.content || '';
      } else {
        aiResponse = `VERA Intelligence System Active.

I've received your ${mode.toLowerCase()} inquiry: "${message}"

[Note: AI capabilities require API keys to be configured. In full operation, I would provide sophisticated analysis using Claude-3.5 for complex reasoning and GPT-4 for rapid responses, with real-time calendar integration and contextual awareness.]

Current Context:
- Mode: ${mode}
- User State: ${userState}
- Energy Level: ${context.energyLevel || 'unknown'}
- Timestamp: ${new Date().toLocaleString()}`;
      }
    } catch (aiError) {
      console.error('AI API Error:', aiError);
      aiResponse = `VERA System: I'm experiencing difficulty accessing my full intelligence capabilities. However, I'm still here to assist you with your ${mode.toLowerCase()} needs. Please ensure API configurations are properly set.`;
    }

    // Combine AI response with calendar alerts
    const finalResponse = aiResponse + calendarAlert;

    return NextResponse.json({
      response: finalResponse,
      success: true,
      timestamp: new Date().toISOString(),
      context: {
        mode,
        userState,
        aiProvider: useClaude ? 'claude' : 'openai',
        energyLevel: context.energyLevel,
        calendarEvents: calendarEvents.length
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json({
      response: "VERA System: I've encountered an unexpected error. My core systems remain operational, but this specific request couldn't be processed. Please try again.",
      success: false,
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
}
