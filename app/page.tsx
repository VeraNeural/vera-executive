'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'vera';
  content: string;
  timestamp: string;
  mode?: string;
  type?: 'text' | 'email' | 'decision' | 'design' | 'calendar' | 'error';
  metadata?: any;
}

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  tone: 'formal' | 'firm' | 'direct' | 'creative';
  scheduled?: Date;
}

interface BiometricData {
  heartRate: number;
  hrv: number;
  stress: 'low' | 'medium' | 'high';
  focus: 'low' | 'medium' | 'high';
  energy: 'optimal' | 'moderate' | 'low';
  lastUpdated: Date;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  energyRequired: 'high' | 'medium' | 'low';
  type: 'meeting' | 'creative' | 'admin' | 'break';
  brief?: string;
}

interface ColorPalette {
  hex: string;
  rgb: { r: number; g: number; b: number };
  name: string;
  usage: string;
  contrast: number;
}

interface DecisionAnalysis {
  pros: string[];
  cons: string[];
  roi: string;
  risk: 'low' | 'medium' | 'high';
  timeline: string;
  recommendation: string;
  confidence: number;
  alternatives?: string[];
}

interface DesignSystem {
  colors: ColorPalette[];
  fonts: { primary: string; secondary: string; accent?: string }[];
  materials: string[];
  spacing: number[];
  inspiration: string[];
}

export default function VeraExecutive() {
  // ADD THIS FIRST - prevents hydration errors
  const [mounted, setMounted] = useState(false);
  
  // Core states
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [executiveMode, setExecutiveMode] = useState<'executive' | 'creative' | 'personal' | 'crisis'>('executive');
  const [juliaEnergy, setJuliaEnergy] = useState<'high' | 'medium' | 'low'>('high');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  
  // Feature states
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [emailQueue, setEmailQueue] = useState<EmailDraft[]>([]);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [showDecisionPanel, setShowDecisionPanel] = useState(false);
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [showBiometricsPanel, setShowBiometricsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  // Data states
  const [colorPalette, setColorPalette] = useState<ColorPalette[]>([]);
  const [decisionAnalysis, setDecisionAnalysis] = useState<DecisionAnalysis | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData>({
    heartRate: 72,
    hrv: 45,
    stress: 'low',
    focus: 'high',
    energy: 'optimal',
    lastUpdated: new Date()
  });
  const [designSystem, setDesignSystem] = useState<DesignSystem | null>(null);
  
  // Voice states
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // Keyboard shortcuts state
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const calendarInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Motion values for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const translateX = useTransform(mouseX, [0, 1920], [-20, 20]);
  const translateY = useTransform(mouseY, [0, 1080], [-20, 20]);

  // Then ADD this useEffect:
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize audio context for voice visualization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    // Load messages
    const savedMessages = localStorage.getItem('vera-all-messages');
    if (savedMessages) {
      const messages = JSON.parse(savedMessages);
      setAllMessages(messages);
      setConversation(messages.slice(-5));
    }
    
    // Load preferences
    const savedPreferences = localStorage.getItem('vera-preferences');
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences);
      setIsVoiceEnabled(prefs.voice ?? true);
      setShortcutsEnabled(prefs.shortcuts ?? true);
      setVoiceLanguage(prefs.language ?? 'en-US');
    }
    
    // Load calendar
    const savedCalendar = localStorage.getItem('vera-calendar');
    if (savedCalendar) {
      const events = JSON.parse(savedCalendar);
      setCalendarEvents(events);
    }
    
    // Load design system
    const savedDesign = localStorage.getItem('vera-design');
    if (savedDesign) {
      const design = JSON.parse(savedDesign);
      setDesignSystem(design);
    }
  }, []);

  // Save data on change
  useEffect(() => {
    if (conversation.length > 0) {
      const updatedMessages = [...allMessages, ...conversation.filter(
        msg => !allMessages.find(m => m.id === msg.id)
      )];
      setAllMessages(updatedMessages);
      localStorage.setItem('vera-all-messages', JSON.stringify(updatedMessages));
    }
  }, [conversation]);

  // Save preferences
  useEffect(() => {
    const preferences = {
      voice: isVoiceEnabled,
      shortcuts: shortcutsEnabled,
      language: voiceLanguage
    };
    localStorage.setItem('vera-preferences', JSON.stringify(preferences));
  }, [isVoiceEnabled, shortcutsEnabled, voiceLanguage]);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Update energy based on time
      const hour = now.getHours();
      if (hour >= 6 && hour < 12) {
        setJuliaEnergy('high');
      } else if (hour >= 12 && hour < 18) {
        setJuliaEnergy('medium');
      } else {
        setJuliaEnergy('low');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Mouse movement for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // COMPLETE Voice Recognition Setup with Error Protection
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 3;
        recognitionRef.current.lang = voiceLanguage;

        recognitionRef.current.onstart = () => {
          console.log('Voice recognition started');
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: any) => {
          try {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
              } else {
                interimTranscript += transcript;
              }
            }
            
            setInterimTranscript(interimTranscript);
            
            if (finalTranscript) {
              setMessage(prev => prev + finalTranscript);
              
              // Auto-submit on certain phrases
              if (finalTranscript.toLowerCase().includes('send') || 
                  finalTranscript.toLowerCase().includes('submit')) {
                handleSubmit(message + finalTranscript);
              }
            }
          } catch (resultError) {
            console.error('Speech result processing error:', resultError);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          try {
            if (event.error === 'no-speech') {
              // Auto restart
              setTimeout(() => {
                if (recognitionRef.current && isListening) {
                  recognitionRef.current.start();
                }
              }, 1000);
            } else if (event.error === 'audio-capture') {
              console.warn('Microphone access denied');
              setIsListening(false);
            } else if (event.error === 'not-allowed') {
              console.warn('Speech recognition permission denied');
              setIsListening(false);
            } else {
              setIsListening(false);
            }
          } catch (errorHandleError) {
            console.error('Error handling speech error:', errorHandleError);
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          try {
            if (isListening) {
              // Restart if still supposed to be listening
              recognitionRef.current.start();
            } else {
              setIsListening(false);
            }
          } catch (endError) {
            console.error('Speech recognition end error:', endError);
            setIsListening(false);
          }
        };
      } else {
        console.warn('Speech recognition not supported');
      }
    } catch (speechError) {
      console.error('Speech recognition setup error:', speechError);
      // Continue without speech recognition
    }
  }, [voiceLanguage, isListening]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!shortcutsEnabled) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
      // Ctrl/Cmd + M for mic
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        startListening();
      }
      // Ctrl/Cmd + E for email
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowEmailComposer(true);
      }
      // Ctrl/Cmd + D for design
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setShowDesignPanel(true);
      }
      // Ctrl/Cmd + H for history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowMessageHistory(true);
      }
      // ESC to close panels
      if (e.key === 'Escape') {
        setShowEmailComposer(false);
        setShowDesignPanel(false);
        setShowDecisionPanel(false);
        setShowCalendarPanel(false);
        setShowMessageHistory(false);
        setShowBiometricsPanel(false);
        setShowSettingsPanel(false);
      }
      // Number keys for modes
      if (e.altKey) {
        if (e.key === '1') setExecutiveMode('executive');
        if (e.key === '2') setExecutiveMode('creative');
        if (e.key === '3') setExecutiveMode('personal');
        if (e.key === '4') setExecutiveMode('crisis');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcutsEnabled, message]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, interimTranscript]);

  // Biometric monitoring (simulated, but structured for real integration)
  useEffect(() => {
    const biometricInterval = setInterval(() => {
      updateBiometrics();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(biometricInterval);
  }, []);

  // Update biometrics
  const updateBiometrics = useCallback(() => {
    const hour = new Date().getHours();
    
    // Simulate based on time of day
    const newBiometrics: BiometricData = {
      heartRate: 60 + Math.random() * 30 + (hour > 14 && hour < 18 ? 10 : 0),
      hrv: 30 + Math.random() * 40,
      stress: hour > 14 && hour < 18 ? 'medium' : hour > 18 ? 'high' : 'low',
      focus: hour > 9 && hour < 12 ? 'high' : hour > 14 && hour < 17 ? 'medium' : 'low',
      energy: hour < 12 ? 'optimal' : hour < 18 ? 'moderate' : 'low',
      lastUpdated: new Date()
    };
    
    setBiometricData(newBiometrics);
    
    // Alert on high stress
    if (newBiometrics.stress === 'high' && biometricData.stress !== 'high') {
      const stressMessage: Message = {
        id: `stress-${Date.now()}`,
        role: 'vera',
        content: 'Stress levels elevated. Blocking next 30 minutes for recovery.',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setConversation(prev => [...prev, stressMessage]);
    }
  }, [biometricData]);

  // Complete voice synthesis with ElevenLabs
  const speakText = useCallback(async (text: string) => {
    if (!isVoiceEnabled) return;
    
    setIsSpeaking(true);
    
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: 'julija',
          emotion: executiveMode === 'crisis' ? 'urgent' : 'calm'
        })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        
        audioRef.current = new Audio(audioUrl);
        
        // Voice visualization
        if (audioContextRef.current && analyserRef.current) {
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Voice synthesis error:', error);
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled, executiveMode]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    }
  }, []);

  // COMPLETE Email generation in Julija's voice
  const generateEmail = useCallback(async (recipient: string, subject: string, context: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/vera/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          subject,
          context,
          tone: executiveMode === 'crisis' ? 'firm' : executiveMode,
          juliaEnergy
        })
      });
      
      const draft = await response.json();
      setEmailDraft(draft);
      setShowEmailComposer(true);
      
      // Add to conversation
      const emailMessage: Message = {
        id: Date.now().toString(),
        role: 'vera',
        content: `Email drafted for ${recipient}:\n\nSubject: ${draft.subject}\n\n${draft.body}`,
        timestamp: new Date().toISOString(),
        type: 'email',
        metadata: draft
      };
      setConversation(prev => [...prev, emailMessage]);
      
    } catch (error) {
      console.error('Email generation error:', error);
    }
    setIsProcessing(false);
  }, [executiveMode, juliaEnergy]);

  // Send actual email
  const sendEmail = useCallback(async (draft: EmailDraft) => {
    try {
      const response = await fetch('/api/vera/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      
      if (response.ok) {
        setEmailQueue(prev => prev.filter(e => e !== draft));
        setShowEmailComposer(false);
        
        const confirmMessage: Message = {
          id: Date.now().toString(),
          role: 'vera',
          content: `Email sent to ${draft.to}.`,
          timestamp: new Date().toISOString(),
          type: 'email'
        };
        setConversation(prev => [...prev, confirmMessage]);
      }
    } catch (error) {
      console.error('Email send error:', error);
    }
  }, []);

  // COMPLETE Decision analysis
  const analyzeDecision = useCallback(async (decision: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/vera/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          decision, 
          context: executiveMode,
          energy: juliaEnergy,
          biometrics: biometricData
        })
      });
      
      const analysis = await response.json();
      setDecisionAnalysis(analysis);
      setShowDecisionPanel(true);
      
      // Add to conversation
      const decisionMessage: Message = {
        id: Date.now().toString(),
        role: 'vera',
        content: `Decision analyzed. ${analysis.recommendation}`,
        timestamp: new Date().toISOString(),
        type: 'decision',
        metadata: analysis
      };
      setConversation(prev => [...prev, decisionMessage]);
      
      if (isVoiceEnabled) {
        await speakText(analysis.recommendation);
      }
      
    } catch (error) {
      console.error('Decision analysis error:', error);
    }
    setIsProcessing(false);
  }, [executiveMode, juliaEnergy, biometricData, isVoiceEnabled, speakText]);

  // COMPLETE Color extraction from image
  const extractColors = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Resize for performance
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Advanced color quantization
        const colorBuckets = new Map<string, number>();
        
        for (let i = 0; i < pixels.length; i += 4) {
          // Skip very dark or very light pixels
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          if (brightness < 20 || brightness > 235) continue;
          
          // Quantize to reduce similar colors
          const r = Math.round(pixels[i] / 16) * 16;
          const g = Math.round(pixels[i + 1] / 16) * 16;
          const b = Math.round(pixels[i + 2] / 16) * 16;
          const hex = rgbToHex(r, g, b);
          
          colorBuckets.set(hex, (colorBuckets.get(hex) || 0) + 1);
        }
        
        // Sort by frequency and get top colors
        const sortedColors = Array.from(colorBuckets.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        
        // Analyze each color
        const palette: ColorPalette[] = sortedColors.map(([hex], index) => {
          const rgb = hexToRgb(hex)!;
          return {
            hex,
            rgb,
            name: getColorName(hex),
            usage: suggestColorUsage(rgb, index),
            contrast: calculateContrast(rgb, { r: 255, g: 255, b: 255 })
          };
        });
        
        setColorPalette(palette);
        
        // Generate design system based on colors
        const design: DesignSystem = {
          colors: palette,
          fonts: suggestFontPairings(palette),
          materials: suggestMaterials(palette),
          spacing: [4, 8, 16, 24, 32, 48, 64],
          inspiration: generateInspiration(palette)
        };
        
        setDesignSystem(design);
        setShowDesignPanel(true);
        setIsProcessing(false);
      };
    };
    
    reader.readAsDataURL(file);
  }, []);

  // Color utility functions
  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getColorName = (hex: string): string => {
    const colors: { [key: string]: string } = {
      '#000000': 'Black',
      '#FFFFFF': 'White',
      '#FF0000': 'Red',
      '#00FF00': 'Green',
      '#0000FF': 'Blue',
      '#8A2BE2': 'Purple',
      '#FFD700': 'Gold',
      '#C0C0C0': 'Silver'
    };
    
    // Find closest named color
    let closestColor = 'Custom';
    let minDistance = Infinity;
    
    for (const [namedHex, name] of Object.entries(colors)) {
      const distance = colorDistance(hex, namedHex);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = name;
      }
    }
    
    return minDistance < 50 ? closestColor : 'Custom';
  };

  const colorDistance = (hex1: string, hex2: string): number => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return Infinity;
    
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  };

  const suggestColorUsage = (rgb: { r: number; g: number; b: number }, index: number): string => {
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    if (index === 0) return 'Primary';
    if (index === 1) return 'Secondary';
    if (brightness < 50) return 'Background';
    if (brightness > 200) return 'Text';
    if (brightness > 150) return 'Surface';
    return 'Accent';
  };

  const calculateContrast = (
    rgb1: { r: number; g: number; b: number },
    rgb2: { r: number; g: number; b: number }
  ): number => {
    const l1 = relativeLuminance(rgb1);
    const l2 = relativeLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const relativeLuminance = (rgb: { r: number; g: number; b: number }): number => {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const suggestFontPairings = (palette: ColorPalette[]): any[] => {
    const hasHighContrast = palette.some(c => c.contrast > 7);
    const isDark = palette[0].rgb.r + palette[0].rgb.g + palette[0].rgb.b < 150;
    
    if (hasHighContrast && isDark) {
      return [
        { primary: 'Bodoni', secondary: 'Helvetica Neue', accent: 'Futura' },
        { primary: 'Didot', secondary: 'Inter', accent: 'DIN' }
      ];
    }
    
    return [
      { primary: 'Playfair Display', secondary: 'Source Sans Pro' },
      { primary: 'Montserrat', secondary: 'Lato' }
    ];
  };

  const suggestMaterials = (palette: ColorPalette[]): string[] => {
    const isDark = palette[0].rgb.r + palette[0].rgb.g + palette[0].rgb.b < 150;
    const hasGold = palette.some(c => c.name.includes('Gold'));
    const hasBlue = palette.some(c => c.name.includes('Blue'));
    
    const materials = [];
    
    if (isDark) {
      materials.push('Black Oak', 'Obsidian', 'Charcoal Concrete');
    }
    if (hasGold) {
      materials.push('Brushed Brass', 'Gold Leaf', 'Champagne Metal');
    }
    if (hasBlue) {
      materials.push('Navy Velvet', 'Lapis Lazuli', 'Cobalt Glass');
    }
    
    materials.push('Carrara Marble', 'Venetian Plaster', 'Raw Silk');
    
    return materials;
  };

  const generateInspiration = (palette: ColorPalette[]): string[] => {
    return [
      'Minimalist luxury with emphasis on texture',
      'Golden ratio proportions throughout',
      'Negative space as a design element',
      'Material honesty and craftsmanship',
      'Subtle transitions between spaces'
    ];
  };

  // COMPLETE Calendar import and optimization
  const handleCalendarImport = useCallback(async (file: File) => {
    const text = await file.text();
    const events: CalendarEvent[] = [];
    const lines = text.split(/\r?\n/);
    
    let currentEvent: Partial<CalendarEvent> | null = null;
    
    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {
          id: `event-${Date.now()}-${Math.random()}`,
          energyRequired: 'medium',
          type: 'meeting'
        };
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        if (currentEvent.title && currentEvent.start && currentEvent.end) {
          events.push(currentEvent as CalendarEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('SUMMARY:')) {
          currentEvent.title = line.substring(8).replace(/\\,/g, ',').trim();
        } else if (line.startsWith('DTSTART')) {
          const dateStr = line.split(':')[1];
          currentEvent.start = parseICSDate(dateStr);
        } else if (line.startsWith('DTEND')) {
          const dateStr = line.split(':')[1];
          currentEvent.end = parseICSDate(dateStr);
        } else if (line.startsWith('LOCATION:')) {
          currentEvent.location = line.substring(9).replace(/\\,/g, ',').trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          currentEvent.brief = line.substring(12).replace(/\\,/g, ',').trim();
        }
      }
    }
    
    // Optimize calendar
    const optimizedEvents = await optimizeCalendar(events);
    setCalendarEvents(optimizedEvents);
    setShowCalendarPanel(true);
    
    // Save to localStorage
    localStorage.setItem('vera-calendar', JSON.stringify(optimizedEvents));
  }, []);

  const parseICSDate = (dateStr: string): Date => {
    // Handle different date formats
    if (dateStr.includes('T')) {
      // YYYYMMDDTHHMMSS format
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(9, 11));
      const minute = parseInt(dateStr.substring(11, 13));
      const second = parseInt(dateStr.substring(13, 15)) || 0;
      
      return new Date(year, month, day, hour, minute, second);
    } else {
      // YYYYMMDD format (all day event)
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      
      return new Date(year, month, day);
    }
  };

  const optimizeCalendar = async (events: CalendarEvent[]): Promise<CalendarEvent[]> => {
    // Sort by start time
    events.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Analyze and optimize
    const optimized: CalendarEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const hour = event.start.getHours();
      
      // Determine energy required based on time and type
      if (event.type === 'creative') {
        event.energyRequired = 'high';
      } else if (hour < 12) {
        event.energyRequired = 'high';
      } else if (hour < 15) {
        event.energyRequired = 'low'; // Post-lunch dip
      } else if (hour < 17) {
        event.energyRequired = 'medium';
      } else {
        event.energyRequired = 'low';
      }
      
      // Add buffer time
      if (i > 0) {
        const prevEvent = optimized[optimized.length - 1];
        const gap = event.start.getTime() - prevEvent.end.getTime();
        
        if (gap < 15 * 60 * 1000) { // Less than 15 minutes
          // Create buffer event
          const buffer: CalendarEvent = {
            id: `buffer-${Date.now()}-${i}`,
            title: 'Buffer Time',
            start: prevEvent.end,
            end: event.start,
            type: 'break',
            energyRequired: 'low',
            brief: 'Recovery and transition'
          };
          optimized.push(buffer);
        }
      }
      
      optimized.push(event);
      
      // Add creative blocks
      if (event.type === 'creative' && event.energyRequired === 'high') {
        // Protect 30 min after creative work
        const recovery: CalendarEvent = {
          id: `recovery-${Date.now()}-${i}`,
          title: 'Creative Recovery',
          start: event.end,
          end: new Date(event.end.getTime() + 30 * 60 * 1000),
          type: 'break',
          energyRequired: 'low',
          brief: 'Do not schedule meetings'
        };
        optimized.push(recovery);
      }
    }
    
    return optimized;
  };

  // Export calendar
  const exportCalendar = useCallback(() => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VERA//EN\n';
    
    for (const event of calendarEvents) {
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:${event.id}@vera.ai\n`;
      icsContent += `DTSTAMP:${formatICSDate(new Date())}\n`;
      icsContent += `DTSTART:${formatICSDate(event.start)}\n`;
      icsContent += `DTEND:${formatICSDate(event.end)}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      if (event.location) {
        icsContent += `LOCATION:${event.location}\n`;
      }
      if (event.brief) {
        icsContent += `DESCRIPTION:${event.brief}\n`;
      }
      icsContent += 'END:VEVENT\n';
    }
    
    icsContent += 'END:VCALENDAR';
    
    // Download
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vera-calendar-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [calendarEvents]);

  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  // Main submit handler - COMPLETE
  const handleSubmit = useCallback(async (text = message) => {
    if (!text.trim()) return;

    // Stop listening when processing
    if (isListening) {
      stopListening();
    }

    // Pattern detection
    const patterns = {
      email: /\b(email|write to|compose|draft)\b/i,
      decision: /\b(analyze|decide|decision|should i|pros and cons)\b/i,
      design: /\b(design|color|palette|interior|exterior|material)\b/i,
      calendar: /\b(calendar|schedule|meeting|appointment|book)\b/i,
      crisis: /\b(urgent|emergency|crisis|help|asap|immediately)\b/i,
      biometric: /\b(stress|energy|health|heart|focus)\b/i
    };

    // Auto-switch to crisis mode if needed
    if (patterns.crisis.test(text)) {
      setExecutiveMode('crisis');
    }

    // Handle specific patterns
    if (patterns.email.test(text)) {
      const recipientMatch = text.match(/to (\w+)/i);
      const subjectMatch = text.match(/about (.+?)(?:\.|$)/i);
      const recipient = recipientMatch ? recipientMatch[1] : 'team';
      const subject = subjectMatch ? subjectMatch[1] : 'Follow up';
      await generateEmail(recipient, subject, text);
    }

    if (patterns.decision.test(text)) {
      await analyzeDecision(text);
    }

    if (patterns.design.test(text)) {
      // Check if image is needed
      if (text.includes('image') || text.includes('photo')) {
        imageInputRef.current?.click();
      } else {
        setShowDesignPanel(true);
      }
    }

    if (patterns.calendar.test(text)) {
      setShowCalendarPanel(true);
    }

    if (patterns.biometric.test(text)) {
      setShowBiometricsPanel(true);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      mode: executiveMode
    };
    
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setInterimTranscript('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/vera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode: executiveMode,
          context: {
            energy: juliaEnergy,
            biometrics: biometricData,
            recentMessages: conversation.slice(-5),
            currentTime: currentTime.toISOString(),
            calendarContext: calendarEvents.slice(0, 3)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API response error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid API response format');
      }
      
      const veraMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'vera',
        content: data.response,
        timestamp: new Date().toISOString(),
        type: data.type || 'text',
        metadata: data.metadata
      };
      
      setConversation(prev => [...prev, veraMessage]);
      
      // Speak response if enabled
      if (isVoiceEnabled && data.response) {
        try {
          await speakText(data.response);
        } catch (voiceError) {
          console.error('Voice synthesis error:', voiceError);
          // Continue without voice
        }
      }
      
      // Handle any actions
      if (data.actions) {
        try {
          for (const action of data.actions) {
            if (action.type === 'calendar') {
              setShowCalendarPanel(true);
            } else if (action.type === 'email') {
              await generateEmail(action.recipient, action.subject, action.context);
            }
          }
        } catch (actionError) {
          console.error('Action handling error:', actionError);
          // Continue without actions
        }
      }
      
    } catch (error) {
      console.error('VERA API Error:', error);
      
      // Determine error type and provide appropriate fallback
      let errorMessage = 'VERA is recalibrating. ';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Network connection issue detected.';
      } else if (error instanceof Error && error.message.includes('API response error')) {
        errorMessage += 'Server temporarily unavailable.';
      } else {
        errorMessage += 'System diagnostics in progress.';
      }
      
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        role: 'vera',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      setConversation(prev => [...prev, fallbackMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [
    message,
    executiveMode,
    juliaEnergy,
    biometricData,
    conversation,
    currentTime,
    calendarEvents,
    isListening,
    isVoiceEnabled,
    stopListening,
    generateEmail,
    analyzeDecision,
    speakText
  ]);

  // Format time utility
  const formatTime = useCallback((timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '';
    }
  }, []);

  // Export data
  const exportData = useCallback(() => {
    const data = {
      messages: allMessages,
      calendar: calendarEvents,
      design: designSystem,
      preferences: {
        voice: isVoiceEnabled,
        shortcuts: shortcutsEnabled,
        language: voiceLanguage
      },
      exported: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vera-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allMessages, calendarEvents, designSystem, isVoiceEnabled, shortcutsEnabled, voiceLanguage]);

  // Import data
  const importData = useCallback(async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (data.messages) {
      setAllMessages(data.messages);
      setConversation(data.messages.slice(-5));
    }
    
    if (data.calendar) {
      setCalendarEvents(data.calendar);
    }
    
    if (data.design) {
      setDesignSystem(data.design);
    }
    
    if (data.preferences) {
      setIsVoiceEnabled(data.preferences.voice ?? true);
      setShortcutsEnabled(data.preferences.shortcuts ?? true);
      setVoiceLanguage(data.preferences.language ?? 'en-US');
    }
    
    // Save to localStorage
    localStorage.setItem('vera-all-messages', JSON.stringify(data.messages || []));
    localStorage.setItem('vera-calendar', JSON.stringify(data.calendar || []));
    localStorage.setItem('vera-design', JSON.stringify(data.design || null));
    localStorage.setItem('vera-preferences', JSON.stringify(data.preferences || {}));
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    if (confirm('Clear all VERA data? This cannot be undone.')) {
      setAllMessages([]);
      setConversation([]);
      setCalendarEvents([]);
      setDesignSystem(null);
      setColorPalette([]);
      setDecisionAnalysis(null);
      
      localStorage.removeItem('vera-all-messages');
      localStorage.removeItem('vera-calendar');
      localStorage.removeItem('vera-design');
      localStorage.removeItem('vera-preferences');
      
      window.location.reload();
    }
  }, []);

  // Add this check BEFORE your main return
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#0F0F0F] text-white font-sans">
        <div className="flex items-center justify-center h-screen">
          <div className="text-white opacity-50">Loading VERA...</div>
        </div>
      </div>
    );
  }

  // EMERGENCY ERROR BOUNDARY WRAPPER
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#0F0F0F] text-white font-sans">
      {mounted ? (
        <>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div>
                  <h1 className="text-xl font-bold">VERA</h1>
                  <p className="text-sm text-purple-400">Executive Intelligence</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-mono">
                    {currentTime ? currentTime.toLocaleTimeString('en-US', { hour12: false }) : '--:--'}
                  </div>
                  <div className="text-xs text-purple-400 capitalize">
                    Energy: {juliaEnergy}
                  </div>
                </div>
                
                <motion.button
                  onClick={() => setShowSettingsPanel(true)}
                  className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {mounted && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
              {/* Mode Selector */}
              <div className="flex gap-2 mb-6">
                {(['executive', 'creative', 'personal', 'crisis'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setExecutiveMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      executiveMode === mode
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Conversation */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-gray-800/50 rounded-xl p-6 h-96 overflow-y-auto mb-6 space-y-4">
                  {conversation.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">
                      {mounted && (
                        <motion.div
                          className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </motion.div>
                      )}
                      <h3 className="text-lg font-medium mb-2">VERA Executive Intelligence</h3>
                      <p>Ready to assist with executive decisions, creative projects, and strategic planning.</p>
                    </div>
                  ) : (
                    <>
                      {conversation.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-100'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <span className="text-xs opacity-70">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Interim transcript */}
                      {interimTranscript && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-end"
                        >
                          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-purple-600/50 text-white">
                            <p className="text-sm italic">{interimTranscript}</p>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Processing indicator */}
                      {isProcessing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-sm text-gray-300">VERA is thinking...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="Ask VERA anything..."
                      className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={isProcessing}
                    />
                    
                    <motion.button
                      onClick={() => isListening ? stopListening() : startListening()}
                      className={`p-3 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isProcessing}
                    >
                      {mounted && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isListening ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          )}
                        </svg>
                      )}
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleSubmit()}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isProcessing || !message.trim()}
                    >
                      Send
                    </motion.button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setShowEmailComposer(true)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setShowCalendarPanel(true)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                    >
                      Calendar
                    </button>
                    <button
                      onClick={() => setShowDesignPanel(true)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                    >
                      Design
                    </button>
                    <button
                      onClick={() => setShowBiometricsPanel(true)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                    >
                      Health
                    </button>
                  </div>
                </div>
              </div>
            </main>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={calendarInputRef}
              type="file"
              accept=".ics,.csv"
              onChange={(e) => e.target.files?.[0] && handleCalendarImport(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && extractColors(e.target.files[0])}
              className="hidden"
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="text-white opacity-50">Loading VERA...</div>
        </div>
      )}
    </div>
  );
}