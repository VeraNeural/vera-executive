/**
 * VOICE ANALYSIS
 * Analyze audio biomarkers to detect nervous system state
 * Uses vocal patterns and prosody to infer somatic experience
 */

import { VoiceAnalysisResult, NervousSystemState, EmotionalState } from './types';

/**
 * Analyze voice for nervous system indicators
 * In production, use advanced audio processing (librosa, WebAudio API)
 * For now: based on transcript and basic audio metrics
 */
export function analyzeVoiceForNervousSystem(
  audioBuffer: ArrayBuffer,
  transcript: string
): VoiceAnalysisResult {
  // For MVP: analyze transcript and basic audio buffer properties
  const audioDataView = new Uint8Array(audioBuffer);
  const energy = calculateEnergyLevel(audioDataView);
  const stimationFromTranscript = analyzeTranscriptPatterns(transcript);

  // Combine audio + transcript analysis
  const confidence = Math.min(100, (energy > 100 ? 65 : 50) + (stimationFromTranscript.confidence || 0));

  return {
    nervousSystemState: {
      primary: stimationFromTranscript.state || (energy > 150 ? 'sympathetic' : 'ventral'),
      secondary: undefined,
      confidence,
      indicators: [
        {
          metric: 'energy_level',
          value: energy,
          range: [0, 255],
          interpretation: energy > 150 ? 'high activation' : 'moderate to low',
        },
        {
          metric: 'speech_characteristics',
          value: stimationFromTranscript.intensity,
          range: [0, 100],
          interpretation: stimationFromTranscript.interpretation,
        },
      ],
    },
    emotionalState: stimationFromTranscript.emotion,
    vocalQuality: {
      pitch: estimatePitch(transcript),
      energy,
      clarity: transcript.length > 0 ? Math.min(100, (transcript.length / 10) * 10) : 50,
      pace: estimateSpeechRate(transcript),
    },
    timing: {
      pauseFrequency: countPauses(transcript),
      speechRate: estimateSpeechRate(transcript),
      silenceRatio: estimateSilenceRatio(audioDataView),
    },
  };
}

/**
 * Generate response tailored to detected voice state
 */
export async function generateVoiceAwareResponse(
  responseText: string,
  detectedState: NervousSystemState,
  elevenLabsApiKey: string
): Promise<{ audioUrl: string }> {
  // In production: call ElevenLabs with voice settings based on detectedState
  // For now: return placeholder
  
  const voiceSettings = getVoiceSettingsForState(detectedState);

  // TODO: Call ElevenLabs /text-to-speech with voice settings
  // return { audioUrl: elevenLabsResponse };

  return {
    audioUrl: 'placeholder://audio-url', // Would be real audio from ElevenLabs
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateEnergyLevel(audioData: Uint8Array): number {
  if (audioData.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    const normalized = (audioData[i] - 128) / 128;
    sum += normalized * normalized;
  }
  
  const rms = Math.sqrt(sum / audioData.length);
  return Math.min(255, Math.floor(rms * 255));
}

function estimatePitch(transcript: string): number {
  // Very rough estimation based on transcript length and patterns
  // In production: use FFT or pitch detection library
  const vowels = (transcript.match(/[aeiou]/gi) || []).length;
  return 100 + vowels * 2; // Rough Hz estimate
}

function estimateSpeechRate(transcript: string): number {
  // Words per minute estimate
  const words = transcript.split(/\s+/).length;
  return Math.min(200, words * 15); // Rough WPM
}

function countPauses(transcript: string): number {
  const punctuation = (transcript.match(/[,.\-;:?!]/g) || []).length;
  return punctuation;
}

function estimateSilenceRatio(audioData: Uint8Array): number {
  // Estimate based on low-energy frames
  let silentFrames = 0;
  const frameSize = 512;
  
  for (let i = 0; i < audioData.length; i += frameSize) {
    const frame = audioData.slice(i, i + frameSize);
    const energy = calculateEnergyLevel(frame);
    if (energy < 30) silentFrames++;
  }
  
  const totalFrames = Math.ceil(audioData.length / frameSize);
  return totalFrames > 0 ? silentFrames / totalFrames : 0;
}

function analyzeTranscriptPatterns(
  transcript: string
): { state: NervousSystemState; emotion: EmotionalState; intensity: number; interpretation: string; confidence: number } {
  const lower = transcript.toLowerCase();
  
  // Sympathetic indicators (activation)
  const sympatheticMarkers = /(urgent|rushed|excited|worried|anxious|can't|panicking|help|please)/gi;
  const sympatheticCount = (lower.match(sympatheticMarkers) || []).length;
  
  // Dorsal indicators (shutdown)
  const dorsalMarkers = /(tired|exhausted|numb|empty|blank|can't feel|shutdown)/gi;
  const dorsalCount = (lower.match(dorsalMarkers) || []).length;
  
  // Ventral indicators (calm)
  const ventralMarkers = /(calm|peace|grateful|loved|safe|grounded)/gi;
  const ventralCount = (lower.match(ventralMarkers) || []).length;

  let state: NervousSystemState = 'ventral';
  let emotion: EmotionalState = 'grounded';
  
  if (sympatheticCount > dorsalCount && sympatheticCount > ventralCount) {
    state = 'sympathetic';
    emotion = sympatheticCount > 2 ? 'overwhelmed' : 'activated';
  } else if (dorsalCount > ventralCount) {
    state = 'dorsal';
    emotion = 'shutdown';
  }

  const intensity = Math.min(100, (sympatheticCount + dorsalCount) * 10);
  
  return {
    state,
    emotion,
    intensity,
    interpretation: `Transcript suggests ${state} nervous system state with ${emotion} emotion`,
    confidence: 30 + Math.min(40, (sympatheticCount + dorsalCount) * 5),
  };
}

function getVoiceSettingsForState(state: NervousSystemState): Record<string, number> {
  const settings = {
    ventral: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.3,
      speed: 1.0,
      pitch: 1.0,
    },
    sympathetic: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.2,
      speed: 0.95,
      pitch: 1.0,
    },
    dorsal: {
      stability: 0.8,
      similarity_boost: 0.7,
      style: 0.4,
      speed: 1.05,
      pitch: 0.95,
    },
  };

  return settings[state];
}
