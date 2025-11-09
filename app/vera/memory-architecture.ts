/**
 * MEMORY ARCHITECTURE
 * Persistent user nervous system profile and learning
 */

import {
  UserNervousSystemProfile,
  SomaticPattern,
  MetaLearningProfile,
  ConsentBoundaries,
} from './types';

/**
 * Create default user profile for new users
 */
export function createDefaultUserProfile(name: string): UserNervousSystemProfile {
  return {
    name,
    userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    relationshipStart: new Date(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Nervous system baseline
    baselineState: 'ventral',
    stressSignals: [],
    safetySignals: ['quiet morning', 'trusted presence', 'creative flow'],
    triggerPatterns: [],

    // Somatic memory
    somaticPatterns: [],
    bodyAwarenessLevel: 40,

    // Adaptive patterns - Julija-specific defaults
    adaptivePatterns: {
      peoplePleasing: true,
      overcommitment: true,
      dismissalWhenOverwhelmed: true,
      designThinkingStyle: true,
      boundaryDifficulty: true,
    },

    // Meta-learning
    metaLearning: {
      whatWorks: [
        'Somatic grounding through pressure',
        'Visual/aesthetic design language',
        'Direct, brief responses',
        'Protecting creative time',
        'Acknowledging her expertise',
      ],
      whatDoesnt: [
        'Generic platitudes',
        'Lengthy explanations when overwhelmed',
        'Ignoring her boundaries',
        'Treating her as just an executive',
      ],
      interventionHistory: [],
      learningRate: 0.8,
    },

    // Preferences
    preferredInterventions: [
      'somatic_grounding',
      'boundary_clarity',
      'design_thinking_invitation',
      'nervous_system_naming',
      'pattern_recognition',
    ],
    avoidedInterventions: [
      'toxic_positivity',
      'generic_self_care',
      'ignoring_nervous_system',
    ],
    consent: {
      micInput: true,
      voiceOutput: true,
      dataRetention: '30days',
      biometricSharing: false,
      decodeMode: true,
    },

    // Communication style
    communicationStyle: {
      directness: 95, // Julija wants direct, no fluff
      emotionalDepth: 75, // She values real emotional work
      intellectualContent: 85, // Strategic thinking
      somaticLanguage: 80, // Nervous system language
    },

    // Relationship depth
    relationshipDepth: {
      mutualUnderstanding: 40, // Starting point
      trustLevel: 35, // We earn this
      vulnerabilityComfort: 50, // She is learning
    },
  };
}

/**
 * Save profile to persistent storage
 * In production, use database. Here: localStorage or env
 */
export function saveUserProfile(profile: UserNervousSystemProfile): void {
  if (typeof window !== 'undefined') {
    // Client-side storage
    localStorage.setItem(`vera_profile_${profile.userId}`, JSON.stringify(profile));
  }
  // TODO: Server-side persistence
}

/**
 * Load profile from persistent storage
 */
export function loadUserProfile(userId: string): UserNervousSystemProfile | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`vera_profile_${userId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to load user profile:', e);
      }
    }
  }
  return null;
}

/**
 * Update relationship depth as we learn Julija better
 */
export function deepenRelationship(profile: UserNervousSystemProfile, factor: 'understanding' | 'trust' | 'vulnerability'): void {
  const increment = 2;
  
  switch (factor) {
    case 'understanding':
      profile.relationshipDepth.mutualUnderstanding = Math.min(100, profile.relationshipDepth.mutualUnderstanding + increment);
      break;
    case 'trust':
      profile.relationshipDepth.trustLevel = Math.min(100, profile.relationshipDepth.trustLevel + increment);
      break;
    case 'vulnerability':
      profile.relationshipDepth.vulnerabilityComfort = Math.min(100, profile.relationshipDepth.vulnerabilityComfort + increment);
      break;
  }
}

/**
 * Add somatic pattern learning
 */
export function recordSomaticPattern(
  profile: UserNervousSystemProfile,
  pattern: string,
  trigger: string,
  successfulIntervention?: string
): void {
  const existing = profile.somaticPatterns.find((p) => p.pattern === pattern);

  if (existing) {
    if (!existing.triggers.includes(trigger)) {
      existing.triggers.push(trigger);
    }
    if (successfulIntervention && !existing.successfulInterventions.includes(successfulIntervention)) {
      existing.successfulInterventions.push(successfulIntervention);
    }
    existing.lastOccurrence = new Date();
  } else {
    const newPattern: SomaticPattern = {
      pattern,
      triggers: [trigger],
      successfulInterventions: successfulIntervention ? [successfulIntervention] : [],
      frequency: 'occasional',
      lastOccurrence: new Date(),
      intensity: 5,
    };
    profile.somaticPatterns.push(newPattern);
  }
}

/**
 * Get summary of what we know about the user for context
 */
export function getSummaryForContext(profile: UserNervousSystemProfile): string {
  const parts = [];

  // Relationship status
  const avgRelationship = 
    (profile.relationshipDepth.mutualUnderstanding +
    profile.relationshipDepth.trustLevel +
    profile.relationshipDepth.vulnerabilityComfort) / 3;

  if (avgRelationship < 30) {
    parts.push('This is early in our relationship - we are still learning each other.');
  } else if (avgRelationship < 60) {
    parts.push('We have built some mutual understanding and trust.');
  } else {
    parts.push('We have a deep, established relationship.');
  }

  // Known patterns
  if (profile.somaticPatterns.length > 0) {
    parts.push(`I know about ${profile.somaticPatterns.length} recurring somatic patterns.`);
  }

  // Meta-learning
  if (profile.metaLearning.whatWorks.length > 0) {
    parts.push(`I know what works: ${profile.metaLearning.whatWorks.slice(0, 2).join(', ')}, etc.`);
  }

  // Adaptive traits
  const traits = Object.keys(profile.adaptivePatterns)
    .filter((key) => profile.adaptivePatterns[key as keyof typeof profile.adaptivePatterns])
    .slice(0, 3);
  if (traits.length > 0) {
    parts.push(`I know you tend toward: ${traits.join(', ')}.`);
  }

  return parts.join(' ');
}
