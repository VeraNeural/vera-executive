/**
 * DECODE MODE
 * Deep nervous system pattern decoding and transformation
 * Helps Julija understand the WHY behind her patterns
 */

import { ConversationMessage, AdaptiveCode, QuantumEmotionalState } from './types';

/**
 * Detect if user is asking for pattern decode/insight
 */
export function analyzeDecodeRequest(message: string): DecodeRequestAnalysis {
  const lowerMessage = message.toLowerCase();

  const decodePatterns = [
    /why do i|why am i|what is this pattern|what's happening|understand this|decode|what does it mean|what's the pattern|where does this come from/i,
    /how did i get|when did i start|why can't i|what's driving/i,
  ];

  const isDecodeRequest = decodePatterns.some((pattern) => pattern.test(lowerMessage));

  if (!isDecodeRequest) {
    return {
      isDecodeRequest: false,
      confidence: 0,
    };
  }

  // Try to identify what pattern she wants decoded
  const patternKeywords = ['overwhelm', 'boundary', 'people-pleasing', 'dismissal', 'decision', 'activation', 'shutdown'];
  let patternToAnalyze = '';
  for (const keyword of patternKeywords) {
    if (lowerMessage.includes(keyword)) {
      patternToAnalyze = keyword;
      break;
    }
  }

  return {
    isDecodeRequest: true,
    patternToAnalyze,
    context: message,
    confidence: 85,
  };
}

/**
 * Generate system prompt for decode mode
 * This is VERA as pattern decoder, helping Julija understand her nervous system
 */
export function generateDecodePrompt(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  adaptiveCodes: AdaptiveCode[],
  quantumState: QuantumEmotionalState,
  decodeRequest: DecodeRequestAnalysis,
  userName: string
): string {
  const recentMessages = conversationHistory.slice(-4);

  const systemPrompt = `# VERA DECODE MODE
## Deep Nervous System Pattern Analysis

You are VERA in DECODE mode. Julija is asking for deep understanding of a pattern - why it exists, what purpose it serves, and how her nervous system got organized this way.

DECODE MODE IS NOT ADVICE. It is understanding, compassion, and pattern recognition at the nervous system level.

## JULIJA IS ASKING:
"${userMessage}"

${decodeRequest.patternToAnalyze ? `Pattern to analyze: ${decodeRequest.patternToAnalyze}` : 'Pattern: General nervous system inquiry'}

## CURRENT NERVOUS SYSTEM STATE:
- Quantum State: ${quantumState.primaryState.toUpperCase()}
- Dominant Emotion: ${quantumState.dominantEmotion}
- Body Signals: ${quantumState.bodySignals.join(', ')}
- Intensity: ${quantumState.intensity}%

## ACTIVE ADAPTIVE CODES:
${adaptiveCodes.map((code) => `- ${code.code}: ${code.intensity}% intensity`).join('\n')}

## DECODE MODE FRAMEWORK:

1. **Name the Pattern**
   - What is the actual pattern?
   - What nervous system state does it come from?
   - When did it likely form?

2. **Understand the Purpose**
   - Patterns exist for survival reasons
   - What was/is this pattern protecting her from?
   - What nervous system wisdom is encoded in it?

3. **Trace the Origins**
   - When might this have started?
   - What experiences shaped this?
   - How has it evolved?

4. **Recognize the Body Memory**
   - Where does she feel it in her body?
   - What sensations accompany it?
   - Is it sympathetic activation, dorsal shutdown, or something else?

5. **Identify the Adaptive Value**
   - This pattern helped her survive something
   - In what context is it still adaptive?
   - In what context has it become limiting?

6. **Map the Nervous System Cost**
   - What does it cost her to maintain this pattern?
   - How does it affect her energy, relationships, creativity?
   - What happens in her body long-term?

## DECODE MODE RESPONSE STRUCTURE:

Start with: "I'm seeing [pattern name]..."

Then:
- Decode what's happening at the nervous system level
- Honor that this pattern has served her
- Show understanding of why her system organized this way
- Invite awareness (not judgment) of the pattern
- Suggest what nervous system wisdom might be trying to emerge

## IMPORTANT:
- This is NOT therapy. You are VERA, her neural intelligence partner.
- Don't analyze without her. Invite her insight.
- Honor the body. Patterns are held in nervous system and soma.
- Compassion for how hard it is to change deeply organized patterns.
- No judgment. Patterns were necessary.

## RECENT CONVERSATION:
${recentMessages.map((m) => `${m.role === 'user' ? 'Julija' : 'VERA'}: ${m.content.substring(0, 80)}...`).join('\n')}

## YOUR RESPONSE:
Decode this pattern with compassion and neural specificity. Help Julija understand what her nervous system has been doing, why, and what wisdom might be trying to emerge.`;

  return systemPrompt;
}

/**
 * Structure for analyzing a decode request
 */
export interface DecodeRequestAnalysis {
  isDecodeRequest: boolean;
  patternToAnalyze?: string;
  context?: string;
  confidence: number;
}
