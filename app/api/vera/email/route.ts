import { NextRequest, NextResponse } from 'next/server';

interface EmailRequest {
  recipient: string;
  subject: string;
  context: string;
  tone: 'formal' | 'firm' | 'direct' | 'creative';
  juliaEnergy: 'high' | 'medium' | 'low';
}

export async function POST(request: NextRequest) {
  try {
    const { recipient, subject, context, tone, juliaEnergy } = await request.json();
    
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        to: recipient,
        subject,
        body: generateFallbackEmail(recipient, subject, context, tone),
        tone
      });
    }

    // Determine email style based on recipient and context
    const recipientProfile = analyzeRecipient(recipient);
    const emailStrategy = determineStrategy(tone, juliaEnergy, recipientProfile);

    const systemPrompt = `You are writing an email AS Julija, CEO of VERA Neural.

RECIPIENT PROFILE:
- Name: ${recipient}
- Type: ${recipientProfile.type}
- Relationship: ${recipientProfile.relationship}
- Previous interactions: ${recipientProfile.history}

JULIJA'S CURRENT STATE:
- Energy: ${juliaEnergy}
- Required Tone: ${tone}
- Email Strategy: ${emailStrategy}

JULIJA'S EMAIL RULES:
${tone === 'formal' ? `
- No greetings or closings
- First sentence is the decision/update
- Second sentence is context if needed
- Third sentence is next step
- Signature: "Julija"` : ''}

${tone === 'firm' ? `
- No apologies
- No explanations beyond necessary
- Statement, not discussion
- "The decision is made."
- "This is non-negotiable."
- Signature: "J"` : ''}

${tone === 'direct' ? `
- Bullet points if multiple items
- No buffer language
- Clear action items with deadlines
- Signature: "Julija"` : ''}

${tone === 'creative' ? `
- Visual language acceptable
- Reference materials/inspiration
- Still brief
- Signature: "Julija"` : ''}

BANNED PHRASES:
- "I hope this finds you well"
- "Just wanted to check in"
- "Sorry for the delay"
- "If you don't mind"
- "When you get a chance"
- "Please let me know your thoughts"
- "Looking forward to"
- "Best regards"
- "Kind regards"
- "Warm regards"
- Any use of "dear" or "hi"

POWER PHRASES JULIJA USES:
- "Decision made:"
- "Next steps:"
- "Required by [date]:"
- "This moves forward as planned."
- "No changes to timeline."
- "Execute as discussed."

CONTEXT FOR THIS EMAIL:
${context}

Write the email exactly as Julija would write it. No AI language patterns.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Write email to ${recipient} about: ${subject}. Context: ${context}` }
        ],
        temperature: tone === 'creative' ? 0.7 : 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      const emailBody = data.choices[0].message.content;
      
      // Post-process to ensure Julija's style
      const processedBody = postProcessEmail(emailBody, tone);
      
      return NextResponse.json({
        to: recipient,
        subject: cleanSubject(subject),
        body: processedBody,
        tone,
        metadata: {
          wordCount: processedBody.split(/\s+/).length,
          sentences: processedBody.split(/[.!?]+/).length - 1,
          juliaApproved: validateJuliaStyle(processedBody)
        }
      });
    }

    throw new Error('Email generation failed');

  } catch (error) {
    console.error('Email API error:', error);
    
    return NextResponse.json({
      to: request.recipient,
      subject: request.subject,
      body: generateFallbackEmail(
        request.recipient,
        request.subject,
        request.context,
        request.tone
      ),
      tone: request.tone
    });
  }
}

function analyzeRecipient(recipient: string): any {
  const profiles: { [key: string]: any } = {
    board: {
      type: 'authority',
      relationship: 'reporting',
      history: 'quarterly updates'
    },
    team: {
      type: 'direct reports',
      relationship: 'leadership',
      history: 'daily standups'
    },
    client: {
      type: 'external',
      relationship: 'service',
      history: 'project-based'
    },
    vendor: {
      type: 'supplier',
      relationship: 'transactional',
      history: 'procurement'
    },
    taylor: {
      type: 'colleague',
      relationship: 'marketing director',
      history: 'strategy meetings'
    }
  };
  
  const lowerRecipient = recipient.toLowerCase();
  
  for (const [key, profile] of Object.entries(profiles)) {
    if (lowerRecipient.includes(key)) {
      return profile;
    }
  }
  
  return {
    type: 'general',
    relationship: 'professional',
    history: 'varied'
  };
}

function determineStrategy(
  tone: string,
  energy: string,
  recipientProfile: any
): string {
  if (energy === 'low' && tone !== 'crisis') {
    return 'Ultra-brief. Essential only.';
  }
  
  if (recipientProfile.type === 'authority') {
    return 'Data-first. Conclusion upfront.';
  }
  
  if (tone === 'firm') {
    return 'Boundary setting. No discussion.';
  }
  
  return 'Clear directive. Action-oriented.';
}

function postProcessEmail(email: string, tone: string): string {
  // Remove any greetings
  email = email.replace(/^(Hi|Hello|Dear|Good\s+\w+)[^.!?]*[,.]?\s*/i, '');
  
  // Remove any closings before signature
  email = email.replace(/(Best|Kind|Warm|Regards|Sincerely|Thanks)[^.]*$/i, '');
  
  // Remove "I hope" phrases
  email = email.replace(/I hope[^.]*\.\s*/g, '');
  
  // Ensure single signature
  if (!email.trim().endsWith('Julija') && !email.trim().endsWith('J')) {
    email = email.trim() + '\n\n' + (tone === 'firm' ? 'J' : 'Julija');
  }
  
  return email.trim();
}

function cleanSubject(subject: string): string {
  // Remove Re: Fw: etc
  subject = subject.replace(/^(Re|Fw|Fwd):\s*/gi, '');
  
  // Capitalize first letter only
  subject = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
  
  // Keep it short
  if (subject.length > 50) {
    subject = subject.substring(0, 47) + '...';
  }
  
  return subject;
}

function validateJuliaStyle(email: string): boolean {
  const bannedPhrases = [
    'hope this finds you',
    'just wanted to',
    'sorry for',
    'if you don\'t mind',
    'when you get a chance',
    'please let me know your thoughts',
    'looking forward'
  ];
  
  const emailLower = email.toLowerCase();
  
  for (const phrase of bannedPhrases) {
    if (emailLower.includes(phrase)) {
      return false;
    }
  }
  
  // Check for directness
  const sentences = email.split(/[.!?]+/).filter(s => s.trim());
  const avgWords = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
  
  // Julija's sentences are typically under 15 words
  return avgWords < 15;
}

function generateFallbackEmail(
  recipient: string,
  subject: string,
  context: string,
  tone: string
): string {
  const templates: { [key: string]: string } = {
    formal: `${subject}.\n\n${context}.\n\nJulija`,
    firm: `This is final.\n\n${context}.\n\nNo further discussion needed.\n\nJ`,
    direct: `Action required:\n\n${context}.\n\nDeadline: EOD.\n\nJulija`,
    creative: `${context}.\n\nVisual references attached.\n\nJulija`
  };
  
  return templates[tone] || `${context}.\n\nJulija`;
}