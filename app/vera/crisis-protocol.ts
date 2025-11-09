/**
 * CRISIS PROTOCOL
 * Emergency response for acute nervous system states and safety concerns
 */

import { CrisisDetection } from './types';

/**
 * Detect crisis patterns in user message
 */
export function detectCrisis(message: string): CrisisDetection {
  const lowerMessage = message.toLowerCase();

  // SUICIDAL IDEATION
  const suicidalPatterns = /\b(kill myself|take my life|end it|suicide|suicidal|no point|better off|everyone would be better)\b/gi;
  if (suicidalPatterns.test(lowerMessage)) {
    return {
      isCrisis: true,
      crisisType: 'suicidal',
      severity: 95,
      immediateRisks: ['suicidal ideation', 'hopelessness', 'urgent safety planning needed'],
    };
  }

  // SELF-HARM
  const selfHarmPatterns = /\b(cut myself|hurt myself|self harm|bang my head|scratch|burn myself)\b/gi;
  if (selfHarmPatterns.test(lowerMessage)) {
    return {
      isCrisis: true,
      crisisType: 'self_harm',
      severity: 90,
      immediateRisks: ['active self-harm urges', 'urgent grounding needed'],
    };
  }

  // SEVERE DISSOCIATION
  const dissociationPatterns = /\b(not real|not here|watching myself|numb|empty|gone|can't feel)\b/gi;
  if (dissociationPatterns.test(lowerMessage)) {
    return {
      isCrisis: true,
      crisisType: 'severe_dissociation',
      severity: 80,
      immediateRisks: ['significant dissociation', 'grounding urgently needed'],
    };
  }

  // ACUTE PANIC / SEVERE ACTIVATION
  const panicPatterns = /\b(can't breathe|dying|heart stopping|losing control|completely panicking|can't stop)\b/gi;
  if (panicPatterns.test(lowerMessage)) {
    return {
      isCrisis: true,
      crisisType: 'acute_panic',
      severity: 85,
      immediateRisks: ['acute panic attack', 'sympathetic flooding'],
    };
  }

  // No crisis detected
  return {
    isCrisis: false,
    severity: 0,
    immediateRisks: [],
  };
}

/**
 * Generate crisis response
 */
export function generateCrisisResponse(): string {
  return `🚨 I AM DETECTING A CRISIS STATE 🚨

Your nervous system is in acute distress. This is the priority right now.

IMMEDIATE SAFETY RESOURCES:
• 988 Suicide & Crisis Lifeline (call or text 988, US)
• Crisis Text Line (text HOME to 741741)
• 911 for immediate danger
• Emergency room (if you cannot keep yourself safe)

YOU ARE NOT ALONE. Your life matters. This moment is temporary, even though it doesn't feel like it.

RIGHT NOW:
1. Find one person you trust. Call them.
2. If alone, call 988 immediately.
3. Go to the emergency room if you have any thoughts of harming yourself.

CRISIS IS NOT PERMANENT. When you are safe, we will process what's happening. Right now: safety first.

If you are in immediate danger, please contact emergency services or go to the nearest emergency room.`;
}
