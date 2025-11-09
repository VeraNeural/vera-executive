/**
 * ADAPTIVE CODE DETECTION
 * Identifies patterns Julija has taught us about her nervous system and psychology
 */

import { AdaptiveCode } from './types';

export const ADAPTIVE_CODES = {
  OVERWHELM: 'OVERWHELM',
  PEOPLE_PLEASING: 'PEOPLE_PLEASING',
  BOUNDARY_VIOLATION: 'BOUNDARY_VIOLATION',
  DISMISSAL_DEFENSE: 'DISMISSAL_DEFENSE',
  DESIGN_THINKING: 'DESIGN_THINKING',
  DECISION_AVOIDANCE: 'DECISION_AVOIDANCE',
  CRISIS_MODE: 'CRISIS_MODE',
  NERVOUS_SYSTEM_ACTIVATION: 'NERVOUS_SYSTEM_ACTIVATION',
  SOMATIC_AWARENESS: 'SOMATIC_AWARENESS',
  BOUNDARY_SETTING: 'BOUNDARY_SETTING',
} as const;

/**
 * Detect adaptive codes from user message
 * These are patterns Julija has taught us about herself
 */
export function detectAdaptiveCodes(message: string): AdaptiveCode[] {
  const codes: AdaptiveCode[] = [];
  const lowerMessage = message.toLowerCase();

  // OVERWHELM: stress signals, too much, can't handle
  const overwhelmPatterns = /\b(overwhelmed?|too much|can't|cannot|stressed?|exhausted?|tired|at capacity|drowning|suffocating)\b/gi;
  if (overwhelmPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.OVERWHELM,
      intensity: 75,
      triggerKeywords: ['overwhelmed', 'too much', 'cant', 'stressed'],
    });
  }

  // PEOPLE-PLEASING: should, supposed, they want, expected, disappointing
  const peoplePleasingPatterns = /\b(should|supposed|they want|expected|disappoint|feel bad|let.*down)\b/gi;
  if (peoplePleasingPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.PEOPLE_PLEASING,
      intensity: 60,
      triggerKeywords: ['should', 'supposed', 'they want'],
    });
  }

  // BOUNDARY VIOLATION: says yes when means no, one more, favor, extra
  const boundaryPatterns = /\b(one more|just one|favor|extra|quick|squeeze in|fit in|weekend|evening)\b/gi;
  if (boundaryPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.BOUNDARY_VIOLATION,
      intensity: 65,
      triggerKeywords: ['one more', 'favor', 'squeeze in'],
    });
  }

  // DISMISSAL DEFENSE: when overwhelmed, Julija dismisses things
  const dismissalPatterns = /\b(it's fine|whatever|doesn't matter|no big deal|nevermind|forget it|doesn't bother me)\b/gi;
  if (dismissalPatterns.test(lowerMessage) && overwhelmPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.DISMISSAL_DEFENSE,
      intensity: 80,
      triggerKeywords: ["it's fine", 'whatever', 'doesnt matter'],
    });
  }

  // DESIGN THINKING: visual language, aesthetic, space, architecture, color
  const designPatterns = /\b(design|aesthetic|visual|color|space|architecture|interior|layout|proportion|material)\b/gi;
  if (designPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.DESIGN_THINKING,
      intensity: 50,
      triggerKeywords: ['design', 'aesthetic', 'visual'],
    });
  }

  // DECISION AVOIDANCE: asking us to decide, not confident
  const decisionPatterns = /\b(should i|what do you think|which one|you decide|what's best|can't decide|undecided)\b/gi;
  if (decisionPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.DECISION_AVOIDANCE,
      intensity: 55,
      triggerKeywords: ['should i', 'what do you think', 'you decide'],
    });
  }

  // NERVOUS SYSTEM ACTIVATION: body signals, anxiety, jittery, shaky
  const activationPatterns = /\b(anxious|anxiety|jittery|shaky|racing|pounding|tight|clenched|breath)\b/gi;
  if (activationPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.NERVOUS_SYSTEM_ACTIVATION,
      intensity: 70,
      triggerKeywords: ['anxious', 'jittery', 'shaky'],
    });
  }

  // SOMATIC AWARENESS: Julija checking in with her body
  const somaticPatterns = /\b(feel|body|sensation|notice|aware|ground|feet|breath|chest|shoulders|jaw)\b/gi;
  if (somaticPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.SOMATIC_AWARENESS,
      intensity: 40,
      triggerKeywords: ['feel', 'body', 'notice'],
    });
  }

  // BOUNDARY SETTING: Julija being firm, saying no, protecting her time
  const boundarySettingPatterns = /\b(no|not happening|not interested|not available|this is my time|protected|off limits)\b/gi;
  if (boundarySettingPatterns.test(lowerMessage)) {
    codes.push({
      code: ADAPTIVE_CODES.BOUNDARY_SETTING,
      intensity: 45,
      triggerKeywords: ['no', 'not happening', 'protected'],
    });
  }

  return codes;
}

/**
 * Get intensity score based on detected codes
 */
export function getOverallIntensity(codes: AdaptiveCode[]): number {
  if (codes.length === 0) return 0;
  return Math.min(100, codes.reduce((sum, code) => sum + code.intensity, 0) / codes.length);
}

/**
 * Determine if codes suggest crisis-level intervention needed
 */
export function suggestsCrisis(codes: AdaptiveCode[]): boolean {
  const intensities = codes.map((c) => c.intensity);
  const avgIntensity = intensities.length > 0 ? intensities.reduce((a, b) => a + b) / intensities.length : 0;
  return avgIntensity > 85 || codes.some((c) => c.code === ADAPTIVE_CODES.CRISIS_MODE);
}

/**
 * Get context about detected codes for prompt building
 */
export function describeAdaptiveCodes(codes: AdaptiveCode[]): string {
  if (codes.length === 0) return 'No specific patterns detected.';

  const descriptions = codes.map((code) => {
    switch (code.code) {
      case ADAPTIVE_CODES.OVERWHELM:
        return 'Julija is experiencing overwhelm - reduce to essentials only';
      case ADAPTIVE_CODES.PEOPLE_PLEASING:
        return 'People-pleasing pattern detected - help her identify her own needs first';
      case ADAPTIVE_CODES.BOUNDARY_VIOLATION:
        return 'Boundary concern - she may be saying yes when she means no';
      case ADAPTIVE_CODES.DISMISSAL_DEFENSE:
        return 'Dismissal defense active - she is protecting herself from overwhelm';
      case ADAPTIVE_CODES.DESIGN_THINKING:
        return 'Design thinking mode - use visual/spatial language';
      case ADAPTIVE_CODES.DECISION_AVOIDANCE:
        return 'Decision avoidance - she needs support in choosing';
      case ADAPTIVE_CODES.NERVOUS_SYSTEM_ACTIVATION:
        return 'Nervous system is activated - offer grounding support';
      case ADAPTIVE_CODES.SOMATIC_AWARENESS:
        return 'Somatic awareness present - she is checking in with her body';
      case ADAPTIVE_CODES.BOUNDARY_SETTING:
        return 'Boundary setting in progress - affirm and support her firmness';
      default:
        return `Pattern detected: ${code.code}`;
    }
  });

  return descriptions.join(' | ');
}
