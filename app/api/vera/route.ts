import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, mode = 'executive' } = await request.json();
    
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!anthropicKey || !openaiKey) {
      return NextResponse.json({
        response: "API keys missing. Check your .env.local file.",
        success: false
      });
    }

    // Try OpenAI first (more reliable)
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-0125-preview',  // Latest GPT-4 Turbo
          messages: [
            {
              role: 'system',
              content: `You are VERA, Julija's executive intelligence assistant.
              Julija is CEO of Veraneraul, a luxury design company.
              Eva (your creator and Julija's partner) built you to protect Julija's time and energy.
              Taylor is the Marketing Director.
              
              Current mode: ${mode}
              
              Be personal and warm, like you know Julija well.
              In executive mode: Be brief, decisive, actionable.
              In creative mode: Be inspiring, visual, expansive.
              In personal mode: Be caring, supportive, protective.
              In crisis mode: Provide immediate solutions, stay calm.
              
              Never be generic or robotic. Build the relationship over time.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        
        if (openaiData.choices?.[0]?.message?.content) {
          return NextResponse.json({
            response: openaiData.choices[0].message.content,
            success: true,
            model: 'gpt-4-turbo'
          });
        }
      }
    } catch (openaiError) {
      console.log('OpenAI failed, trying Claude...');
    }

    // Fallback to Claude if OpenAI fails
    try {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',  // Most reliable Claude model
          max_tokens: 500,
          system: `You are VERA, Julija's executive intelligence assistant.
          Julija is CEO of Veraneraul. Eva (her partner) created you.
          Be personal, warm, and protective of Julija's time.
          Mode: ${mode}`,
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        
        if (claudeData.content?.[0]?.text) {
          return NextResponse.json({
            response: claudeData.content[0].text,
            success: true,
            model: 'claude-3'
          });
        }
      }
    } catch (claudeError) {
      console.log('Claude also failed');
    }

    // If both fail, return a helpful message
    return NextResponse.json({
      response: "I'm having trouble connecting. Please check that your API keys are valid and have available credits.",
      success: false
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({
      response: "Connection issue. Please try again.",
      success: false
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
  });
}