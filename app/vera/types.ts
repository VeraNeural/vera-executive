/**
 * VERA TYPE SYSTEM
 * Complete type definitions for the nervous system-aware intelligence engine
 */

// ============================================================================
// NERVOUS SYSTEM STATE TYPES
// ============================================================================

export type NervousSystemState = 'ventral' | 'sympathetic' | 'dorsal';
export type EmotionalState = 'grounded' | 'engaged' | 'activated' | 'overwhelmed' | 'shutdown' | 'crisis';
export type BodyRegion = 'chest' | 'stomach' | 'throat' | 'jaw' | 'shoulders' | 'limbs' | 'whole_body';

export interface QuantumEmotionalState {
  primaryState: NervousSystemState;
  blendedStates: Array<{ state: NervousSystemState; intensity: number }>;
  dominantEmotion: EmotionalState;
  bodySignals: BodyRegion[];
  intensity: number; // 0-100
  timestamp: Date;
}

// ============================================================================
// SOMATIC & PATTERN TYPES
// ============================================================================

export interface SomaticPattern {
  pattern: string;
  triggers: string[];
  successfulInterventions: string[];
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  lastOccurrence: Date;
  intensity: number; // 0-10
  bodyLocations?: BodyRegion[];
}

export interface AdaptiveCode {
  code: string;
  intensity: number; // 0-100
  triggerKeywords?: string[];
  relatedPatterns?: string[];
}

export interface ConsentBoundaries {
  micInput: boolean;
  voiceOutput: boolean;
  dataRetention: 'session' | '7days' | '30days' | 'permanent' | 'none';
  biometricSharing: boolean;
  decodeMode: boolean;
}

// ============================================================================
// META-LEARNING TYPES
// ============================================================================

export interface MetaLearningProfile {
  whatWorks: string[];
  whatDoesnt: string[];
  interventionHistory: Array<{
    timestamp: Date;
    intervention: string;
    userResponse: 'positive' | 'neutral' | 'negative' | 'no_response';
    effectiveness: number;
    notes: string;
  }>;
  learningRate: number; // 0-1, how quickly to adapt
}

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

export interface UserNervousSystemProfile {
  name: string;
  userId: string;
  relationshipStart: Date;
  timezone: string;

  // Nervous system baseline
  baselineState: NervousSystemState;
  stressSignals: string[];
  safetySignals: string[];
  triggerPatterns: string[];

  // Somatic memory
  somaticPatterns: SomaticPattern[];
  bodyAwarenessLevel: number; // 0-100

  // Adaptive patterns Julija has taught us
  adaptivePatterns: {
    peoplePleasing: boolean;
    overcommitment: boolean;
    dismissalWhenOverwhelmed: boolean;
    designThinkingStyle: boolean;
    boundaryDifficulty: boolean;
  };

  // Meta-learning
  metaLearning: MetaLearningProfile;

  // Preferences
  preferredInterventions: string[];
  avoidedInterventions: string[];
  consent: ConsentBoundaries;

  // Communication style
  communicationStyle: {
    directness: number; // 0-100, how direct they prefer
    emotionalDepth: number; // 0-100
    intellectualContent: number; // 0-100
    somaticLanguage: number; // 0-100
  };

  // Relationship depth
  relationshipDepth: {
    mutualUnderstanding: number; // 0-100
    trustLevel: number; // 0-100
    vulnerabilityComfort: number; // 0-100
  };
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export type ConversationRole = 'user' | 'assistant';

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  timestamp: Date;
  metadata?: {
    mode?: 'conversational' | 'decode' | 'crisis';
    adaptiveCodes?: string[];
    quantumState?: string;
    emotionalState?: EmotionalState;
  };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface VERAResponse {
  content: string;
  mode: 'conversational' | 'decode' | 'crisis';
  detectedPatterns: {
    adaptiveCodes: AdaptiveCode[];
    quantumState: QuantumEmotionalState;
    quantumStateDescription: string;
  };
  metadata: {
    timestamp: Date;
    responseTime: number; // ms
  };
  suggestions: {
    regulationTechniques: string[];
    followUpPrompts: string[];
  };
  metaLearning?: {
    interventionOffered: string;
    shouldTrack: boolean;
  };
}

// ============================================================================
// DECODE REQUEST TYPES
// ============================================================================

export interface DecodeRequestAnalysis {
  isDecodeRequest: boolean;
  patternToAnalyze?: string;
  context?: string;
  confidence: number;
}

// ============================================================================
// CRISIS TYPES
// ============================================================================

export interface CrisisDetection {
  isCrisis: boolean;
  crisisType?: 'suicidal' | 'self_harm' | 'severe_dissociation' | 'acute_panic' | 'other';
  severity: number; // 0-100
  immediateRisks: string[];
}

// ============================================================================
// VOICE ANALYSIS TYPES
// ============================================================================

export interface VoiceBiomarker {
  metric: string;
  value: number;
  range: [number, number];
  interpretation: string;
}

export interface VoiceAnalysisResult {
  nervousSystemState: {
    primary: NervousSystemState;
    secondary?: NervousSystemState;
    confidence: number; // 0-100
    indicators: VoiceBiomarker[];
  };
  emotionalState: EmotionalState;
  vocalQuality: {
    pitch: number; // Hz
    energy: number; // 0-100
    clarity: number; // 0-100
    pace: number; // words per minute estimate
  };
  timing: {
    pauseFrequency: number;
    speechRate: number;
    silenceRatio: number;
  };
}
