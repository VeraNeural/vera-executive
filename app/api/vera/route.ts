import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, mode = 'executive' } = await request.json();
    console.log('Received message:', message, 'Mode:', mode);
    
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    console.log('Keys loaded:', {
      anthropic: anthropicKey ? 'Yes' : 'No',
      openai: openaiKey ? 'Yes' : 'No'
    });
    
    if (!anthropicKey || !openaiKey) {
      return NextResponse.json({
        response: "API keys missing. Check your .env.local file.",
        success: false
      });
    }

    // Call Claude API directly
    console.log('Calling Claude API...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        system: `You are VERA, Julija's executive intelligence assistant. 
        Julija is CEO of Veraneraul and your responses should be:
        - Personal and warm, like you know her well
        - Brief and actionable in executive mode
        - Protective of her time and energy
        - Never generic or robotic
        Current mode: ${mode}`,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    console.log('Claude API Status:', response.status);
    const data = await response.json();
    console.log('Claude Response:', JSON.stringify(data, null, 2));
    
    if (data.content && data.content[0]) {
      return NextResponse.json({
        response: data.content[0].text,
        success: true
      });
    } else {
      // Fallback to OpenAI if Claude fails
      console.log('Claude failed, trying OpenAI...');
      console.log('Claude error:', data.error || 'No content in response');
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Changed to 3.5 for testing
          messages: [
            {
              role: 'system',
              content: `You are VERA, Julija's personal executive assistant. Be warm, personal, and helpful.`
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

      console.log('OpenAI Status:', openaiResponse.status);
      const openaiData = await openaiResponse.json();
      console.log('OpenAI Response:', JSON.stringify(openaiData, null, 2));
      
      if (openaiData.choices?.[0]?.message?.content) {
        return NextResponse.json({
          response: openaiData.choices[0].message.content,
          success: true
        });
      } else {
        console.error('OpenAI Error:', openaiData.error);
        return NextResponse.json({
          response: "Both APIs failed. Check console for details.",
          success: false,
          error: openaiData.error || data.error
        });
      }
    }
  } catch (error) {
    console.error('Caught Error:', error);
    return NextResponse.json({
      response: "Connection error. Check console.",
      success: false,
      error: error.message
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'checking',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'found' : 'missing',
    openai: process.env.OPENAI_API_KEY ? 'found' : 'missing'
  });
}