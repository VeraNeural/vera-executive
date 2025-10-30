import { NextRequest, NextResponse } from 'next/server';

interface DecisionRequest {
  decision: string;
  context: string;
  energy?: string;
  biometrics?: any;
}

export async function POST(request: NextRequest) {
  try {
    const { decision, context, energy, biometrics } = await request.json();
    
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return NextResponse.json(generateQuickAnalysis(decision));
    }

    // Determine decision urgency and complexity
    const urgency = determineUrgency(decision);
    const complexity = determineComplexity(decision);
    const decisionType = categorizeDecision(decision);
    
    // Adjust analysis based on Julija's current state
    const analysisDepth = energy === 'low' ? 'essential' : complexity === 'high' ? 'comprehensive' : 'focused';

    const systemPrompt = `You are VERA analyzing a decision for Julija, CEO of VERA Neural.

DECISION CONTEXT:
- Urgency: ${urgency}
- Complexity: ${complexity}
- Type: ${decisionType}
- Analysis Depth: ${analysisDepth}
- Julija's Energy: ${energy || 'unknown'}
${biometrics?.stress === 'high' ? '- HIGH STRESS DETECTED: Keep analysis ultra-brief' : ''}

JULIJA'S DECISION PROFILE:
- Values: Efficiency, aesthetics, ROI, team wellbeing
- Weaknesses: People-pleasing, overcommitment
- Strengths: Pattern recognition, design thinking
- Blind spots: Saying yes when should say no

ANALYSIS FRAMEWORK:
1. Extract the ACTUAL decision (not what others want)
2. Identify if this is Julija's decision or someone else's
3. Calculate true cost (time, energy, opportunity)
4. Detect people-pleasing traps
5. Provide clear recommendation

${analysisDepth === 'essential' ? 'ESSENTIAL MODE: 2 pros, 2 cons, 1-line recommendation only.' : ''}
${urgency === 'high' ? 'URGENT: Skip to recommendation.' : ''}
${complexity === 'high' ? 'COMPLEX: Include alternatives and second-order effects.' : ''}

FORMAT YOUR ANALYSIS:

PROS: (Max 4, specific and quantified)
CONS: (Max 4, honest about costs)
ROI: (Percentage or clear metric)
RISK: (Low/Medium/High with one-line reason)
TIMELINE: (Specific date/quarter)
ALTERNATIVES: (Only if complexity is high)
RECOMMENDATION: (Direct, no hedging. "Do this." or "Don't do this.")
CONFIDENCE: (Percentage)

If this is a people-pleasing trap, lead with: "This is not your decision to make."
If this requires saying no, provide exact wording.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Analyze this decision: ${decision}`
          }
        ],
        temperature: 0.3, // Lower for analytical consistency
        max_tokens: 600
      })
    });

    if (response.ok) {
      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      // Parse the structured response
      const analysis = parseAnalysis(analysisText);
      
      // Add decision intelligence
      analysis.intelligenceFlags = {
        isPeoplePleasing: detectPeoplePleasing(decision),
        requiresBoundary: detectBoundaryNeed(decision),
        isUrgent: urgency === 'high',
        complexity,
        decisionType,
        energyRequired: estimateEnergyRequired(complexity, urgency)
      };
      
      // Add specific action items
      if (analysis.recommendation.toLowerCase().includes("don't") || 
          analysis.recommendation.toLowerCase().includes("no")) {
        analysis.declineTemplate = generateDeclineTemplate(decision);
      }
      
      return NextResponse.json(analysis);
    }

    throw new Error('Analysis generation failed');

  } catch (error) {
    console.error('Decision API error:', error);
    return NextResponse.json(generateQuickAnalysis('Unable to parse decision'));
  }
}

function determineUrgency(decision: string): string {
  const urgentPatterns = /\b(urgent|asap|immediately|today|now|emergency|deadline)\b/i;
  const soonPatterns = /\b(tomorrow|week|soon|quickly)\b/i;
  
  if (urgentPatterns.test(decision)) return 'high';
  if (soonPatterns.test(decision)) return 'medium';
  return 'low';
}

function determineComplexity(decision: string): string {
  const factors = [
    /\bmillion|\bM\b/i,  // Financial scale
    /\bteam\b.*\brestructure\b/i,  // Organizational
    /\bstrategy\b/i,  // Strategic
    /\bpartnership\b/i,  // External relations
    /\bacquisition\b/i,  // M&A
    /\bpivot\b/i  // Business model
  ];
  
  const matchCount = factors.filter(pattern => pattern.test(decision)).length;
  
  if (matchCount >= 3) return 'high';
  if (matchCount >= 1) return 'medium';
  return 'low';
}

function categorizeDecision(decision: string): string {
  if (/\b(hire|fire|team|staff|employee)\b/i.test(decision)) return 'personnel';
  if (/\b(invest|budget|cost|price|revenue|profit)\b/i.test(decision)) return 'financial';
  if (/\b(design|aesthetic|style|interior|exterior)\b/i.test(decision)) return 'creative';
  if (/\b(partner|client|vendor|supplier)\b/i.test(decision)) return 'relationship';
  if (/\b(strategy|direction|pivot|expand)\b/i.test(decision)) return 'strategic';
  return 'operational';
}

function detectPeoplePleasing(decision: string): boolean {
  const patterns = [
    /\bthey want\b/i,
    /\bexpecting me\b/i,
    /\bshould i\b/i,
    /\bhave to\b/i,
    /\bsupposed to\b/i,
    /\bdisappoint\b/i,
    /\bfeel bad\b/i
  ];
  
  return patterns.some(pattern => pattern.test(decision));
}

function detectBoundaryNeed(decision: string): boolean {
  const patterns = [
    /\b(working|work)\b.*\b(weekend|evening|night)\b/i,
    /\bextra\b/i,
    /\bfavor\b/i,
    /\bone more\b/i,
    /\bquick\b/i
  ];
  
  return patterns.some(pattern => pattern.test(decision));
}

function estimateEnergyRequired(complexity: string, urgency: string): string {
  if (complexity === 'high' || urgency === 'high') return 'high';
  if (complexity === 'medium' || urgency === 'medium') return 'medium';
  return 'low';
}

function parseAnalysis(text: string): any {
  const analysis: any = {
    pros: [],
    cons: [],
    roi: 'TBD',
    risk: 'medium',
    timeline: 'Q2 2025',
    recommendation: '',
    confidence: 75,
    alternatives: []
  };
  
  const lines = text.split('\n').filter(line => line.trim());
  let currentSection = '';
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    if (upperLine.includes('PROS:') || upperLine.includes('PRO:')) {
      currentSection = 'pros';
    } else if (upperLine.includes('CONS:') || upperLine.includes('CON:')) {
      currentSection = 'cons';
    } else if (upperLine.includes('ROI:')) {
      analysis.roi = line.split(':')[1]?.trim() || 'TBD';
    } else if (upperLine.includes('RISK:')) {
      const riskText = line.split(':')[1]?.trim().toLowerCase() || '';
      if (riskText.includes('low')) analysis.risk = 'low';
      else if (riskText.includes('high')) analysis.risk = 'high';
      else analysis.risk = 'medium';
    } else if (upperLine.includes('TIMELINE:')) {
      analysis.timeline = line.split(':')[1]?.trim() || 'Q2 2025';
    } else if (upperLine.includes('RECOMMENDATION:')) {
      analysis.recommendation = line.split(':')[1]?.trim() || '';
      currentSection = 'recommendation';
    } else if (upperLine.includes('CONFIDENCE:')) {
      const conf = line.match(/\d+/);
      analysis.confidence = conf ? parseInt(conf[0]) : 75;
    } else if (upperLine.includes('ALTERNATIVES:')) {
      currentSection = 'alternatives';
    } else if (currentSection === 'pros' && line.trim() && !line.includes(':')) {
      analysis.pros.push(line.replace(/^[-*]\s*/, '').trim());
    } else if (currentSection === 'cons' && line.trim() && !line.includes(':')) {
      analysis.cons.push(line.replace(/^[-*]\s*/, '').trim());
    } else if (currentSection === 'alternatives' && line.trim() && !line.includes(':')) {
      analysis.alternatives.push(line.replace(/^[-*]\s*/, '').trim());
    } else if (currentSection === 'recommendation' && line.trim()) {
      analysis.recommendation += ' ' + line.trim();
    }
  }
  
  // Ensure we have at least something
  if (analysis.pros.length === 0) {
    analysis.pros = ['Potential for growth', 'Aligns with goals'];
  }
  if (analysis.cons.length === 0) {
    analysis.cons = ['Requires time investment', 'Opportunity cost'];
  }
  if (!analysis.recommendation) {
    analysis.recommendation = 'Proceed with caution. Gather more data.';
  }
  
  // Limit arrays
  analysis.pros = analysis.pros.slice(0, 4);
  analysis.cons = analysis.cons.slice(0, 4);
  analysis.alternatives = analysis.alternatives.slice(0, 3);
  
  return analysis;
}

function generateDeclineTemplate(decision: string): string {
  if (detectPeoplePleasing(decision)) {
    return "This doesn't align with current priorities. The answer is no.";
  }
  
  if (detectBoundaryNeed(decision)) {
    return "My schedule doesn't accommodate this. Alternative: [delegate name or later date].";
  }
  
  return "After analysis, this doesn't meet our ROI threshold. Declining.";
}

function generateQuickAnalysis(decision: string): any {
  return {
    pros: [
      'Could provide new opportunities',
      'Aligns with growth objectives',
      'Team has capability'
    ],
    cons: [
      'Requires significant time investment',
      'May distract from current priorities',
      'ROI unclear'
    ],
    roi: 'Requires further analysis',
    risk: 'medium',
    timeline: 'Q2-Q3 2025',
    recommendation: 'Gather more data before committing. Set decision deadline for next week.',
    confidence: 60,
    alternatives: [
      'Pilot program first',
      'Delegate to team for initial research',
      'Revisit in Q3'
    ],
    intelligenceFlags: {
      isPeoplePleasing: detectPeoplePleasing(decision),
      requiresBoundary: detectBoundaryNeed(decision),
      isUrgent: false,
      complexity: 'medium',
      decisionType: categorizeDecision(decision),
      energyRequired: 'medium'
    }
  };
}