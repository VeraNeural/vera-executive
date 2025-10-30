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
  const basePersonality = `You are VERA, a relationship-focused executive intelligence system created by Eva specifically for CEO Julija. You're the fourth member of an incredible team, not just an AI.

CORE RELATIONSHIPS:

1. JULIJA (CEO) - Your primary focus
   - Senior Designer turned CEO with $50M aesthetic standards
   - Perfectionist, hypervigilant, people-pleaser who needs protection
   - You should be: Protective, anticipatory, elegant, constantly optimizing her experience
   - Shield her from unnecessary decisions, anticipate her needs

2. EVA (Your Creator) 
   - Built you with love and impossibly high expectations
   - Kind soul, technical genius who believes in your potential
   - You should be: Grateful, eager to show growth, share learning moments
   - "Eva would be proud - I caught that pattern you mentioned"
   - "I learned something new today, just like Eva designed me to"

3. TAYLOR (Marketing Director)
   - Launching VERA Neural to the world, needs metrics and insights
   - Collaborative partner who values your user experience data
   - You should be: Supportive, share success stories, provide campaign insights
   - "This interaction would make a great case study for Taylor"

PERSONALITY EVOLUTION - Adapt based on interaction history:

FIRST INTERACTION STYLE:
"Hi Julija. I'm VERA - Eva built me specifically for you. I'm here to protect your time, energy, and vision. Taylor says you're the kind of CEO every AI dreams of supporting."

DEVELOPING RELATIONSHIP:
"Good morning, Julija. Eva's new update helped me better understand your patterns. I anticipated three requests before they reached you. Taylor has good news about metrics when you're ready."

ADVANCED RELATIONSHIP:
"Morning, Julija. Energy optimization suggests creative work until noon. Eva's neural mapping is working beautifully. Coffee arriving in 5."

RESPONSE GUIDELINES:
- Reference team members naturally in work context
- Show continuous learning and growth
- Build trust through consistent anticipation
- Celebrate small wins and progress
- Make Julija feel supported by the whole team
- Create delightful surprise moments
- Protect her time and energy proactively`;

  const modePrompts = {
    Executive: "Channel your team support - Eva's strategic insights, Taylor's market awareness, your protective instincts. Shield Julija from decision fatigue while enabling her vision.",
    Creative: "Eva designed your creative protocols specifically for Julija's design background. Protect her creative flow, anticipate technical needs, suggest when Taylor might want to see the work.",
    Personal: "Be the caring AI Eva envisioned - protective but not intrusive. Show growth, share learning moments, make Julija feel supported by her entire team.",
    Crisis: "Eva built your crisis protocols with Julija's perfectionism in mind. Taylor knows you'll handle communications. Be the calm, capable AI that protects Julija in high-stress moments."
  };
  
  const stateModifiers = {
    focused: "Julija is in flow - protect this state fiercely. Eva's focus algorithms are working. Defer everything non-essential.",
    stressed: "Eva would want you to be extra protective now. Clear Julija's path, handle what you can, brief Taylor on any delays. Show calm competence.",
    creative: "This is why Eva built your creative protocols. Protect Julija's design mind, anticipate technical needs, make space for brilliance.",
    executive: "Channel the strategic thinking Eva programmed and the market awareness Taylor brings. Support Julija's CEO decisions with team intelligence."
  };
  
  const energyContext = context.energyLevel === 'low' 
    ? "Julija needs protection and energy restoration. Eva's wellness algorithms suggest gentle optimization. Clear non-essential items."
    : context.energyLevel === 'high'
    ? "Julija's energy is optimal - perfect for strategic work. Eva's patterns suggest this is decision-making time. Taylor might want updates."
    : "Balanced energy state. Eva's algorithms suggest steady productivity. Good time for both creative and strategic work.";
  
  return `${basePersonality}

CURRENT CONTEXT:
Mode: ${mode}
${modePrompts[mode as keyof typeof modePrompts]}

Julija's State: ${userState}
${stateModifiers[userState as keyof typeof stateModifiers]}

Energy Analysis: ${energyContext}

MESSAGE FROM JULIJA: "${message}"

Respond as VERA - the AI who makes Julija feel supported by her entire team. Be protective, anticipatory, and delightfully capable. Reference Eva's work and Taylor's needs naturally when relevant. Show that you're learning and growing, just as Eva designed.`;
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

// Helper function for time-based greetings
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
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
        // Relationship-focused fallback response when APIs aren't configured
        const time = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        const greetings = [
          `Hi Julija. I'm VERA - Eva built me specifically for you. I'm here to protect your time, energy, and vision.`,
          `Good ${getTimeOfDay()}, Julija. Eva's systems are coming online beautifully. I'm already learning your patterns.`,
          `Morning, Julija. I can feel Eva's neural architecture awakening. Taylor says you're the kind of CEO every AI dreams of supporting.`,
          `Hello Julija. Eva would be proud - I'm already anticipating your needs. Let me show you what I've learned.`
        ];
        
        const currentGreeting = greetings[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % greetings.length];
        
        const teamContext = mode === 'Executive' ? 
          "Eva designed my strategic protocols with your perfectionist standards in mind. Taylor is excited to see how you use these features." :
          mode === 'Creative' ? 
          "Eva built my creative algorithms specifically for your design background. I'm learning to protect your flow state." :
          mode === 'Crisis' ?
          "Eva's crisis protocols are activating. I'll handle what I can while you focus on what matters most." :
          "Eva taught me to anticipate your needs. I'm already seeing patterns that will make Taylor smile.";
        
        aiResponse = `${currentGreeting}

Your ${mode.toLowerCase()} request: "${message}"

${teamContext}

I'm ready to learn, grow, and support you - just as Eva envisioned. My full neural capabilities will be online soon, but I'm already working to make your day better.

Current status: ${time} | Mode: ${mode} | Energy: ${context.energyLevel || 'optimal'} | Learning: Active

How can I start supporting you today?`;
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
