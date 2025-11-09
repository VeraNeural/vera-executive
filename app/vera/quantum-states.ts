/**
 * QUANTUM EMOTIONAL STATES
 * Maps nervous system states to emotional experience and regulation suggestions
 */

import { QuantumEmotionalState, AdaptiveCode, NervousSystemState, EmotionalState, BodyRegion } from './types';
import { ConversationMessage } from './types';

export function calculateQuantumState(
  adaptiveCodes: AdaptiveCode[],
  conversationHistory: ConversationMessage[]
): QuantumEmotionalState {
  // Determine primary nervous system state based on codes
  let primaryState: NervousSystemState = 'ventral';
  let dominantEmotion: EmotionalState = 'grounded';
  let overallIntensity = 0;

  const codeIntensities = adaptiveCodes.map((c) => c.intensity);
  if (codeIntensities.length > 0) {
    overallIntensity = codeIntensities.reduce((a, b) => a + b) / codeIntensities.length;
  }

  // Determine state based on detected codes
  const hasActivation = adaptiveCodes.some((c) =>
    c.code === 'NERVOUS_SYSTEM_ACTIVATION' || c.code === 'CRISIS_MODE'
  );
  const hasShutdown = adaptiveCodes.some((c) => c.code === 'DISMISSAL_DEFENSE');
  const hasOverwhelm = adaptiveCodes.some((c) => c.code === 'OVERWHELM');

  if (hasActivation) {
    primaryState = 'sympathetic';
    dominantEmotion = overallIntensity > 80 ? 'overwhelmed' : 'activated';
  } else if (hasShutdown) {
    primaryState = 'dorsal';
    dominantEmotion = 'shutdown';
  } else if (hasOverwhelm) {
    primaryState = 'sympathetic';
    dominantEmotion = 'overwhelmed';
  } else if (overallIntensity > 50) {
    primaryState = 'sympathetic';
    dominantEmotion = 'engaged';
  }

  // Blended states based on multiple codes
  const blendedStates = adaptiveCodes
    .filter((c, idx) => idx > 0) // Exclude primary
    .slice(0, 2)
    .map((code) => {
      const state: NervousSystemState = code.code.includes('SHUTDOWN') || code.code === 'DISMISSAL_DEFENSE' 
        ? 'dorsal' 
        : code.code.includes('OVERWHELM') 
        ? 'sympathetic' 
        : 'ventral';
      return {
        state,
        intensity: code.intensity,
      };
    });

  // Body signals
  const bodySignals: BodyRegion[] = [];
  if (dominantEmotion === 'activated' || dominantEmotion === 'overwhelmed') {
    bodySignals.push('chest', 'shoulders', 'jaw');
  }
  if (dominantEmotion === 'shutdown') {
    bodySignals.push('whole_body', 'limbs');
  }

  return {
    primaryState,
    blendedStates,
    dominantEmotion,
    bodySignals: bodySignals as BodyRegion[],
    intensity: Math.min(100, overallIntensity),
    timestamp: new Date(),
  };
}

/**
 * Regulation techniques tailored to current state
 */
export function getRegulationSuggestions(stateDescription: string): string[] {
  const suggestions = [];

  // If sympathetic (activated)
  if (stateDescription.includes('SYMPATHETIC')) {
    suggestions.push(
      'Press your palms together and breathe - feel the pressure',
      'Place both feet flat on ground - feel the contact',
      'Cold water on face activates calm response',
      'Progressive muscle relaxation: tense and release each muscle group'
    );
  }

  // If dorsal (shutdown)
  if (stateDescription.includes('DORSAL')) {
    suggestions.push(
      'Gentle movement: walking, swaying, stretching',
      'Warm liquid: tea, warm water',
      'Companionship or sound in background',
      'Gradual engagement: no pressure, just presence'
    );
  }

  // If ventral (safe)
  if (stateDescription.includes('VENTRAL') || stateDescription === 'VENTRAL') {
    suggestions.push(
      'Deepen the safety by sharing vulnerable thoughts',
      'Creative expression: design, writing, movement',
      'Mentor or support others',
      'Somatic celebration: notice what feels good'
    );
  }

  return suggestions;
}

/**
 * Get specific somatic invitations based on state
 */
export function getSomaticInvitations(dominantEmotion: EmotionalState): string[] {
  const invitations: { [key in EmotionalState]: string[] } = {
    grounded: [
      'Notice what your feet feel touching the ground',
      'Take a moment to sense your whole body here',
      'What does safety feel like in your body right now?',
    ],
    engaged: [
      'Where do you feel that energy in your body?',
      'Let your shoulders drop and your jaw relax',
      'What does this moment feel like in your chest?',
    ],
    activated: [
      'Can you feel your heart beating?',
      'Press your hands together - feel that pressure',
      'Ground through your feet - feel them contact the earth',
    ],
    overwhelmed: [
      'Come back to your breath - in and out',
      'Press your hands on your chest - feel your heartbeat',
      'Just one thing: feel your feet on the ground',
    ],
    shutdown: [
      'Gently notice your breath, no forcing',
      'What does your body want to do? Just that.',
      'You are safe. Take your time coming back.',
    ],
    crisis: [
      'You are in crisis. Call 988.',
      'Text HOME to 741741.',
      'Call 911 if in immediate danger.',
    ],
  };

  return invitations[dominantEmotion] || invitations.grounded;
}

export function describeEmotionalState(state: QuantumEmotionalState): string {
  const parts = [];

  parts.push(`Your nervous system is in ${state.primaryState.toUpperCase()} mode`);

  if (state.dominantEmotion !== 'grounded') {
    parts.push(`(feeling ${state.dominantEmotion})`);
  }

  if (state.intensity > 80) {
    parts.push('with high intensity');
  } else if (state.intensity > 50) {
    parts.push('with moderate activation');
  }

  if (state.bodySignals.length > 0) {
    parts.push(`affecting your ${state.bodySignals.join(', ')}`);
  }

  return parts.join(' ');
}
