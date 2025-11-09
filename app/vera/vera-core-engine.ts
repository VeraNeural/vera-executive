/**
 * VERA CORE ENGINE v4.1 - MASTER ORCHESTRATOR
 * 
 * The central nervous system of VERA that:
 * - Routes between conversational, decode, and crisis modes
 * - Manages user profiles and somatic memory
 * - Tracks quantum states and adaptive codes
 * - Coordinates meta-learning feedback loops
 * - Handles crisis detection and safety protocols
 * 
 * This is the complete integration of VERA's revolutionary architecture.
 * 
 * Architect: VeraNeural
 * Built for: Julija
 * Date: 2025-11-08
 */

import {
  UserNervousSystemProfile,
  SomaticPattern,
  ConsentBoundaries,
  ConversationMessage,
  VERAResponse,
  AdaptiveCode,
} from './types';

import { generateConversationalPrompt } from './conversational-mode';
import {
  analyzeDecodeRequest,
  generateDecodePrompt,
} from './decode-mode';
import {
  detectCrisis,
  generateCrisisResponse,
} from './crisis-protocol';
import {
  detectAdaptiveCodes,
} from './adaptive-codes';
import { calculateQuantumState, getRegulationSuggestions, getSomaticInvitations, describeEmotionalState } from './quantum-states';
import type { QuantumEmotionalState } from './types';
import { createDefaultUserProfile, recordSomaticPattern, deepenRelationship, getSummaryForContext } from './memory-architecture';
import { analyzeVoiceForNervousSystem, generateVoiceAwareResponse } from './voice-analysis';

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface VERASession {
  sessionId: string;
  userId: string;
  userProfile: UserNervousSystemProfile;
  conversationHistory: ConversationMessage[];
  startTime: Date;
  lastActivity: Date;
  sessionMetrics: {
    totalMessages: number;
    crisisInterventions: number;
    decodeRequests: number;
    dominantStates: string[];
    averageResponseTime: number;
  };
}

export interface MetaLearningFeedback {
  timestamp: Date;
  intervention: string;
  userResponse: 'positive' | 'neutral' | 'negative' | 'no_response';
  effectiveness: number; // 0-100
  notes: string;
}

// ============================================================================
// VERA CORE ENGINE CLASS
// ============================================================================

export class VERACoreEngine {
  private session: VERASession;
  private aiProvider: (prompt: string) => Promise<string>;

  constructor(
    userProfile: UserNervousSystemProfile,
    aiProvider: (prompt: string) => Promise<string>,
    sessionId?: string
  ) {
    this.aiProvider = aiProvider;
    this.session = {
      sessionId: sessionId || this.generateSessionId(),
      userId: userProfile.name,
      userProfile,
      conversationHistory: [],
      startTime: new Date(),
      lastActivity: new Date(),
      sessionMetrics: {
        totalMessages: 0,
        crisisInterventions: 0,
        decodeRequests: 0,
        dominantStates: [],
        averageResponseTime: 0,
      },
    };
  }

  // ============================================================================
  // MAIN PROCESSING PIPELINE
  // ============================================================================

  /**
   * Main entry point: Process user message and generate VERA response
   */
  async processMessage(userMessage: string): Promise<VERAResponse> {
    const startTime = Date.now();

    // STEP 1: CRISIS DETECTION (highest priority - overrides everything)
    const crisisDetection = detectCrisis(userMessage);
    if (crisisDetection.isCrisis) {
      return this.handleCrisisResponse(userMessage, crisisDetection, startTime);
    }

    // STEP 2: DETECT ADAPTIVE CODES & PATTERNS
    const adaptiveCodes = detectAdaptiveCodes(userMessage);

    // STEP 3: CALCULATE QUANTUM STATE
    const quantumState = calculateQuantumState(
      adaptiveCodes,
      this.session.conversationHistory
    );

    const quantumStateDescription = this.getQuantumStateDescription(quantumState);

    // STEP 4: CHECK FOR DECODE REQUEST
    const decodeRequest = analyzeDecodeRequest(userMessage);

    let mode: 'conversational' | 'decode' = 'conversational';
    let prompt: string;

    if (decodeRequest.isDecodeRequest) {
      // DECODE MODE ACTIVATED
      mode = 'decode';
      prompt = generateDecodePrompt(
        userMessage,
        this.session.conversationHistory,
        adaptiveCodes,
        quantumState,
        decodeRequest,
        this.session.userProfile.name
      );
      this.session.sessionMetrics.decodeRequests++;
    } else {
      // CONVERSATIONAL MODE (default)
      prompt = generateConversationalPrompt(
        userMessage,
        this.session.conversationHistory,
        this.session.userProfile,
        adaptiveCodes,
        quantumStateDescription,
        new Date()
      );
    }

    // STEP 5: CALL AI PROVIDER
    const aiResponse = await this.aiProvider(prompt);

    // STEP 6: UPDATE CONVERSATION HISTORY
    this.addToHistory('user', userMessage, {
      adaptiveCodes: adaptiveCodes.map((c) => c.code),
      quantumState: quantumStateDescription,
      mode,
    });

    this.addToHistory('assistant', aiResponse, {
      adaptiveCodes: adaptiveCodes.map((c) => c.code),
      quantumState: quantumStateDescription,
      mode,
    });

    // STEP 7: GENERATE REGULATION SUGGESTIONS
    const regulationTechniques = getRegulationSuggestions(quantumStateDescription);

    // STEP 8: GENERATE FOLLOW-UP PROMPTS
    const followUpPrompts = this.generateFollowUpPrompts(mode, quantumState);

    // STEP 9: UPDATE SESSION METRICS
    const responseTime = Date.now() - startTime;
    this.updateSessionMetrics(responseTime, quantumState.primaryState);

    // STEP 10: EXTRACT INTERVENTION FOR META-LEARNING
    const interventionOffered = this.extractIntervention(aiResponse);

    // STEP 11: BUILD AND RETURN RESPONSE
    return {
      content: aiResponse,
      mode,
      detectedPatterns: {
        adaptiveCodes,
        quantumState,
        quantumStateDescription,
      },
      metadata: {
        timestamp: new Date(),
        responseTime,
      },
      suggestions: {
        regulationTechniques,
        followUpPrompts,
      },
      metaLearning: {
        interventionOffered,
        shouldTrack: true,
      },
    };
  }

  /**
   * Process voice message with vocal biomarker analysis
   */
  async processVoiceMessage(
    audioBuffer: ArrayBuffer,
    transcript: string,
    elevenLabsApiKey?: string
  ): Promise<VERAResponse & { audioUrl?: string; voiceAnalysis?: any }> {
    const startTime = Date.now();

    // STEP 1: Analyze voice for nervous system state
    const voiceAnalysis = analyzeVoiceForNervousSystem(audioBuffer, transcript);
    
    console.log(`[VERA Voice] Detected state: ${voiceAnalysis.nervousSystemState.primary} (${voiceAnalysis.nervousSystemState.confidence}% confidence)`);
    console.log(`[VERA Voice] Indicators:`, voiceAnalysis.nervousSystemState.indicators);

    // STEP 2: Process message normally (includes text-based adaptive codes)
    const response = await this.processMessage(transcript);

    // STEP 3: Enhance with voice-detected state (override if higher confidence)
    if (voiceAnalysis.nervousSystemState.confidence > 70) {
      response.detectedPatterns.quantumState.primaryState = voiceAnalysis.nervousSystemState.primary;
      response.detectedPatterns.adaptiveCodes.unshift({
        code: `VOICE_${voiceAnalysis.nervousSystemState.primary.toUpperCase()}`,
        intensity: voiceAnalysis.nervousSystemState.confidence,
      });
    }

    // STEP 4: Generate voice-aware audio response (if ElevenLabs key provided)
    let audioUrl: string | undefined;
    if (elevenLabsApiKey) {
      const voiceResponse = await generateVoiceAwareResponse(
        response.content,
        voiceAnalysis.nervousSystemState.primary,
        elevenLabsApiKey
      );
      audioUrl = voiceResponse.audioUrl;
    }

    return {
      ...response,
      audioUrl,
      voiceAnalysis,
      detectedPatterns: {
        ...response.detectedPatterns,
      },
    } as VERAResponse & { audioUrl?: string; voiceAnalysis?: any };
  }

  /**
   * Handle crisis response (overrides all other modes)
   */
  private handleCrisisResponse(
    userMessage: string,
    crisis: any,
    startTime: number
  ): VERAResponse {
    const crisisResponse = generateCrisisResponse();

    this.addToHistory('user', userMessage, { mode: 'crisis' });
    this.addToHistory('assistant', crisisResponse, { mode: 'crisis' });

    this.session.sessionMetrics.crisisInterventions++;
    this.session.sessionMetrics.totalMessages++;

    const responseTime = Date.now() - startTime;

    return {
      content: crisisResponse,
      mode: 'crisis',
      detectedPatterns: {
        adaptiveCodes: [],
        quantumState: {
          primaryState: 'dorsal',
          blendedStates: [{ state: 'sympathetic', intensity: 100 }],
          dominantEmotion: 'crisis',
          bodySignals: ['chest', 'whole_body'],
          intensity: 100,
          timestamp: new Date(),
        },
        quantumStateDescription: `CRISIS: ${crisis.crisisType || 'detected'}`,
      },
      metadata: {
        timestamp: new Date(),
        responseTime,
      },
      suggestions: {
        regulationTechniques: [
          'Call 988 immediately',
          'Text HOME to 741741',
          'Call 911 if in immediate danger',
        ],
        followUpPrompts: [],
      },
    };
  }

  // ============================================================================
  // META-LEARNING & FEEDBACK
  // ============================================================================

  /**
   * Record meta-learning feedback about intervention effectiveness
   */
  async recordFeedback(
    intervention: string,
    userResponse: 'positive' | 'neutral' | 'negative' | 'no_response',
    effectiveness: number,
    notes?: string
  ): Promise<void> {
    const feedback: MetaLearningFeedback = {
      timestamp: new Date(),
      intervention,
      userResponse,
      effectiveness,
      notes: notes || '',
    };

    this.session.userProfile.metaLearning.interventionHistory.push(feedback);

    // Update what works / doesn't work lists
    if (effectiveness >= 70) {
      if (!this.session.userProfile.metaLearning.whatWorks.includes(intervention)) {
        this.session.userProfile.metaLearning.whatWorks.push(intervention);
      }
    } else if (effectiveness <= 30) {
      if (!this.session.userProfile.metaLearning.whatDoesnt.includes(intervention)) {
        this.session.userProfile.metaLearning.whatDoesnt.push(intervention);
      }
    }

    console.log(`[VERA Meta-Learning] Recorded feedback for: ${intervention} (${effectiveness}%)`);
  }

  /**
   * Update somatic pattern based on session experience
   */
  updateSomaticPattern(
    pattern: string,
    trigger: string,
    intervention: string,
    success: boolean
  ): void {
    recordSomaticPattern(this.session.userProfile, pattern, trigger, success ? intervention : undefined);
    console.log(`[VERA Memory] Updated somatic pattern: ${pattern}`);
  }

  // ============================================================================
  // SESSION DATA ACCESS
  // ============================================================================

  /**
   * Get current session state
   */
  getSession(): VERASession {
    return this.session;
  }

  /**
   * Get user profile (for persistence)
   */
  getUserProfile(): UserNervousSystemProfile {
    return this.session.userProfile;
  }

  /**
   * Export conversation history
   */
  exportConversation(): ConversationMessage[] {
    return this.session.conversationHistory;
  }

  /**
   * Get session metrics
   */
  getSessionMetrics() {
    return {
      ...this.session.sessionMetrics,
      sessionDuration: Date.now() - this.session.startTime.getTime(),
      messagesPerMinute:
        this.session.sessionMetrics.totalMessages /
        ((Date.now() - this.session.startTime.getTime()) / 60000),
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateSessionId(): string {
    return `vera_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): void {
    this.session.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
      metadata,
    });
  }

  private updateSessionMetrics(responseTime: number, state: string): void {
    this.session.sessionMetrics.totalMessages++;
    this.session.lastActivity = new Date();

    // Update average response time
    const currentAvg = this.session.sessionMetrics.averageResponseTime;
    const totalMessages = this.session.sessionMetrics.totalMessages;
    this.session.sessionMetrics.averageResponseTime =
      (currentAvg * (totalMessages - 1) + responseTime) / totalMessages;

    // Track dominant states
    if (!this.session.sessionMetrics.dominantStates.includes(state)) {
      this.session.sessionMetrics.dominantStates.push(state);
    }
  }

  private getQuantumStateDescription(state: QuantumEmotionalState): string {
    let description = state.primaryState.toUpperCase();
    if (state.blendedStates.length > 0) {
      description += ` + ${state.blendedStates.map((s: any) => s.state.toUpperCase()).join(' + ')}`;
    }
    return description;
  }

  private generateFollowUpPrompts(
    mode: 'conversational' | 'decode',
    quantumState: QuantumEmotionalState
  ): string[] {
    if (mode === 'decode') {
      return [
        'What part of this pattern feels most true?',
        'When did you first notice this cycle?',
        'What would it be like to interrupt this pattern?',
      ];
    }

    // Conversational follow-ups based on state
    if (quantumState.primaryState === 'sympathetic') {
      return [
        'What does your body need right now?',
        'Where do you feel the activation most?',
        'What would help you feel a bit safer?',
      ];
    } else if (quantumState.primaryState === 'dorsal') {
      return [
        'Can you feel your feet on the ground?',
        'What would it be like to just be here for a moment?',
        'What does your body want to do right now?',
      ];
    } else {
      return [
        'What are you noticing in your body?',
        'What feels important to explore?',
        'How can I support you right now?',
      ];
    }
  }

  private extractIntervention(response: string): string {
    // Extract somatic invitations from response
    const invitationPatterns = [
      /press your (hands|feet|palms)/i,
      /feel your (feet|hands|body)/i,
      /notice your (jaw|shoulders|breath)/i,
      /let your (jaw|shoulders|hands)/i,
      /place your hand on your (chest|heart|stomach)/i,
      /ground through your (feet|body)/i,
    ];

    for (const pattern of invitationPatterns) {
      const match = response.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'general_support';
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new VERA session for a user
 */
export function createVERASession(
  userProfile: UserNervousSystemProfile,
  aiProvider: (prompt: string) => Promise<string>,
  sessionId?: string
): VERACoreEngine {
  console.log(`[VERA Core] Creating new session for ${userProfile.name}`);
  return new VERACoreEngine(userProfile, aiProvider, sessionId);
}

/**
 * Create a VERA session for a new user
 */
export function createNewUserSession(
  userName: string,
  aiProvider: (prompt: string) => Promise<string>
): VERACoreEngine {
  const userProfile = createDefaultUserProfile(userName);
  console.log(`[VERA Core] Creating new user session for ${userName}`);
  return new VERACoreEngine(userProfile, aiProvider);
}

/**
 * Resume an existing VERA session
 */
export function resumeVERASession(
  sessionData: VERASession,
  aiProvider: (prompt: string) => Promise<string>
): VERACoreEngine {
  const engine = new VERACoreEngine(
    sessionData.userProfile,
    aiProvider,
    sessionData.sessionId
  );
  
  // Restore conversation history
  (engine as any).session.conversationHistory = sessionData.conversationHistory;
  (engine as any).session.sessionMetrics = sessionData.sessionMetrics;
  (engine as any).session.startTime = sessionData.startTime;
  (engine as any).session.lastActivity = new Date();

  console.log(`[VERA Core] Resumed session ${sessionData.sessionId}`);
  return engine;
}
