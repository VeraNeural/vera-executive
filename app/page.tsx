"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Calendar, 
  Briefcase, 
  Palette, 
  Heart, 
  AlertTriangle,
  Activity,
  Clock,
  Volume2,
  VolumeX,
  RotateCcw,
  Brain
} from "lucide-react";
import BiometricModule from "./components/BiometricModule";
import WellnessModule from "./components/WellnessModule";
import LuxuryConcierge from "./components/LuxuryConcierge";
import DeepWorkModule from "./components/DeepWorkModule";
import StrategicDecisionModule from "./components/StrategicDecisionModule";

interface Message {
  id: string;
  type: 'user' | 'vera';
  content: string;
  timestamp: Date;
  mode?: string;
}

interface BiometricData {
  energyLevel: number;
  stressLevel: number;
  heartRate?: number;
  hrv?: number;
  timestamp: Date;
  mood: 'excellent' | 'good' | 'neutral' | 'low' | 'stressed';
}

interface WellnessData {
  moodScore: number;
  stressLevel: number;
  energyLevel: number;
  typingPattern: {
    speed: number;
    pauses: number;
    errors: number;
  };
  recommendations: string[];
  alerts: string[];
}

interface ConciergeService {
  id: string;
  title: string;
  description: string;
  category: 'dining' | 'travel' | 'wellness' | 'culture' | 'shopping' | 'business';
  priority: 'high' | 'medium' | 'low';
  status: 'available' | 'booking' | 'confirmed' | 'completed';
  estimatedTime?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface DeepWorkData {
  totalFocusTime: number;
  sessionsToday: number;
  peakPerformanceHours: string[];
  distractionLog: string[];
  flowStateAchieved: boolean;
  ambientSettings: {
    soundscape: string;
    lighting: string;
    temperature: string;
  };
}

interface MousePosition {
  x: number;
  y: number;
}

const EnergyIndicator = ({ level, showComment }: { level: 'high' | 'medium' | 'low', showComment?: boolean }) => {
  const colors = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444'
  };

  const getEnergyComment = (level: string) => {
    switch(level) {
      case 'high':
        return "Perfect for strategic decisions";
      case 'low':
        return "Consider a 30-minute restoration break";
      default:
        return "Optimal for sustained creative work";
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: colors[level] }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="text-xs text-gray-400 font-light tracking-wider uppercase">
        {level} energy
      </span>
      {showComment && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-purple-300 ml-2 group-hover:block hidden"
        >
          {getEnergyComment(level)}
        </motion.div>
      )}
    </div>
  );
};

const ProcessingOrb = () => (
  <motion.div
    className="w-4 h-4 rounded-full bg-purple-500"
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState("Executive");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [isMounted, setIsMounted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentVoice, setCurrentVoice] = useState("Rachel");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [teamMentioned, setTeamMentioned] = useState<string | null>(null);
  const [dailyGreeting, setDailyGreeting] = useState("");
  const [celebrationMoment, setCelebrationMoment] = useState<string | null>(null);
  const [conversationMemory, setConversationMemory] = useState<any>(null);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  
  // Biometric system state
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData>({
    energyLevel: 75,
    stressLevel: 25,
    timestamp: new Date(),
    mood: 'good'
  });
  const [showBiometrics, setShowBiometrics] = useState(false);
  
  // Wellness system state  
  const [currentWellness, setCurrentWellness] = useState<WellnessData>({
    moodScore: 75,
    stressLevel: 25,
    energyLevel: 80,
    typingPattern: { speed: 0, pauses: 0, errors: 0 },
    recommendations: [],
    alerts: []
  });
  const [showWellness, setShowWellness] = useState(false);
  
  // Concierge system state
  const [activeServices, setActiveServices] = useState<ConciergeService[]>([]);
  const [showConcierge, setShowConcierge] = useState(false);
  
  // Deep work system state
  const [deepWorkData, setDeepWorkData] = useState<DeepWorkData>({
    totalFocusTime: 0,
    sessionsToday: 0,
    peakPerformanceHours: [],
    distractionLog: [],
    flowStateAchieved: false,
    ambientSettings: {
      soundscape: 'nature',
      lighting: 'warm',
      temperature: 'optimal'
    }
  });
  const [showDeepWork, setShowDeepWork] = useState(false);
  const [showStrategicDecision, setShowStrategicDecision] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ensure client-side only rendering for animations
  useEffect(() => {
    setIsMounted(true);
    loadConversationMemory();
    generateDailyGreeting();
  }, []);

  // Load conversation memory from localStorage
  const loadConversationMemory = () => {
    try {
      const saved = localStorage.getItem('vera-julija-memory');
      if (saved) {
        const memory = JSON.parse(saved);
        setConversationMemory(memory);
        setTotalInteractions(memory.totalInteractions || 0);
        setMessages(memory.recentMessages || []);
      }
      setMemoryLoaded(true);
    } catch (error) {
      console.error('Error loading memory:', error);
      setMemoryLoaded(true);
    }
  };

  // Save conversation memory to localStorage
  const saveConversationMemory = (newMessages: Message[], userMessage: string, veraResponse: string) => {
    try {
      const currentMemory = conversationMemory || {
        totalInteractions: 0,
        patterns: {
          preferredTimes: {},
          frequentTopics: {},
          energyPatterns: {},
          decisionStyle: [],
          workPreferences: []
        },
        recentMemories: [],
        lastInteraction: null
      };

      // Update interaction count
      const newInteractionCount = currentMemory.totalInteractions + 1;

      // Track patterns
      const currentHour = new Date().getHours();
      const timeSlot = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
      
      // Update patterns
      currentMemory.patterns.preferredTimes[timeSlot] = (currentMemory.patterns.preferredTimes[timeSlot] || 0) + 1;
      currentMemory.patterns.energyPatterns[`${timeSlot}_${energyLevel}`] = 
        (currentMemory.patterns.energyPatterns[`${timeSlot}_${energyLevel}`] || 0) + 1;

      // Extract topics from user message
      const topics = extractTopics(userMessage);
      topics.forEach(topic => {
        currentMemory.patterns.frequentTopics[topic] = (currentMemory.patterns.frequentTopics[topic] || 0) + 1;
      });

      // Store recent memories (last 10 interactions)
      const newMemory = {
        timestamp: new Date().toISOString(),
        userMessage,
        veraResponse,
        mode: currentMode,
        energyLevel,
        timeSlot
      };

      currentMemory.recentMemories = [newMemory, ...(currentMemory.recentMemories || [])].slice(0, 10);
      currentMemory.totalInteractions = newInteractionCount;
      currentMemory.lastInteraction = new Date().toISOString();
      currentMemory.recentMessages = newMessages.slice(-20); // Keep last 20 messages

      // Save to localStorage
      localStorage.setItem('vera-julija-memory', JSON.stringify(currentMemory));
      
      setConversationMemory(currentMemory);
      setTotalInteractions(newInteractionCount);
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  // Extract topics from user message
  const extractTopics = (message: string): string[] => {
    const topics = [];
    const lowerMessage = message.toLowerCase();
    
    // Common work topics
    if (lowerMessage.includes('milan') || lowerMessage.includes('project')) topics.push('milan_project');
    if (lowerMessage.includes('design') || lowerMessage.includes('creative')) topics.push('design_work');
    if (lowerMessage.includes('meeting') || lowerMessage.includes('calendar')) topics.push('meetings');
    if (lowerMessage.includes('decision') || lowerMessage.includes('choose')) topics.push('decision_making');
    if (lowerMessage.includes('stress') || lowerMessage.includes('tired')) topics.push('stress_management');
    if (lowerMessage.includes('team') || lowerMessage.includes('taylor') || lowerMessage.includes('eva')) topics.push('team_collaboration');
    
    return topics;
  };

  // Define memory types
  interface MemoryInteraction {
    timestamp: string;
    userMessage: string;
    veraResponse: string;
    mode: string;
    energyLevel: number;
    timeSlot: string;
  }

  // Clear conversation memory
  const clearMemory = () => {
    if (confirm('Clear all conversation memory? This cannot be undone.')) {
      localStorage.removeItem('vera-julija-memory');
      setConversationMemory(null);
      setTotalInteractions(0);
      setMessages([]);
      setCelebrationMoment('Memory cleared - fresh start!');
      setTimeout(() => setCelebrationMoment(''), 3000);
    }
  };

  // Handle biometric updates
  const handleBiometricUpdate = (data: BiometricData) => {
    setCurrentBiometrics(data);
    
    // Sync with existing energy level system
    const newEnergyLevel = data.energyLevel > 70 ? 'high' : 
                          data.energyLevel > 40 ? 'medium' : 'low';
    setEnergyLevel(newEnergyLevel);
    
    // Sync with wellness system
    setCurrentWellness(prev => ({
      ...prev,
      energyLevel: data.energyLevel,
      stressLevel: data.stressLevel
    }));
    
    // Auto-trigger stress management if needed
    if (data.stressLevel > 80) {
      setCelebrationMoment('High stress detected - initiating wellness protocol');
      setTimeout(() => setCelebrationMoment(''), 4000);
    }
    
    // Celebrate peak performance state
    if (data.mood === 'excellent' && data.energyLevel > 85) {
      setCelebrationMoment('Peak performance state achieved! 🚀');
      setTimeout(() => setCelebrationMoment(''), 3000);
    }
  };

  // Handle wellness updates
  const handleWellnessUpdate = (data: WellnessData) => {
    setCurrentWellness(data);
    
    // Sync with biometric system
    setCurrentBiometrics(prev => ({
      ...prev,
      energyLevel: data.energyLevel,
      stressLevel: data.stressLevel,
      mood: data.moodScore > 80 ? 'excellent' : 
            data.moodScore > 60 ? 'good' : 
            data.moodScore > 40 ? 'neutral' : 
            data.moodScore > 20 ? 'low' : 'stressed'
    }));
    
    // Handle wellness alerts
    if (data.alerts.length > 0) {
      setCelebrationMoment(data.alerts[0]);
      setTimeout(() => setCelebrationMoment(''), 5000);
    }
  };

  // Handle concierge service requests
  const handleServiceRequest = (service: ConciergeService) => {
    setActiveServices(prev => {
      const existing = prev.find(s => s.id === service.id);
      if (existing) {
        return prev.map(s => s.id === service.id ? service : s);
      }
      return [...prev, service];
    });
    
    // Show celebration for confirmed services
    if (service.status === 'confirmed') {
      setCelebrationMoment(`${service.title} confirmed! ✨`);
      setTimeout(() => setCelebrationMoment(''), 4000);
    }
  };

  // Handle deep work updates
  const handleFocusUpdate = (data: DeepWorkData) => {
    setDeepWorkData(data);
    
    // Celebrate flow state achievement
    if (data.flowStateAchieved && !deepWorkData.flowStateAchieved) {
      setCelebrationMoment('Flow state achieved! 🌊 Peak performance unlocked');
      setTimeout(() => setCelebrationMoment(''), 5000);
    }
    
    // Track peak performance hours for pattern learning
    if (data.peakPerformanceHours.length > deepWorkData.peakPerformanceHours.length) {
      const newHours = data.peakPerformanceHours.filter(h => !deepWorkData.peakPerformanceHours.includes(h));
      if (newHours.length > 0) {
        setCelebrationMoment(`New peak hour identified: ${newHours[0]} 📈`);
        setTimeout(() => setCelebrationMoment(''), 4000);
      }
    }
  };

  // Generate memory-based insights for VERA
  const getMemoryInsights = (): string => {
    if (!conversationMemory || totalInteractions < 5) return '';

    const patterns = conversationMemory.patterns;
    const insights: string[] = [];

    // Preferred time patterns
    const timePrefs = Object.entries(patterns.preferredTimes || {});
    if (timePrefs.length > 0) {
      const preferredTime = timePrefs.sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
      insights.push(`You typically engage most during ${preferredTime}`);
    }

    // Frequent topics
    const topicEntries = Object.entries(patterns.frequentTopics || {});
    if (topicEntries.length > 0) {
      const topTopic = topicEntries.sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
      insights.push(`Frequent discussion topic: ${topTopic.replace('_', ' ')}`);
    }

    // Recent memory reference
    const recentMemories = conversationMemory.recentMemories || [];
    if (recentMemories.length > 0) {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentDecision = recentMemories.find((m: MemoryInteraction) => 
        new Date(m.timestamp) > lastWeek && m.userMessage.toLowerCase().includes('decision')
      );
      if (recentDecision) {
        insights.push(`Last week's decision context available`);
      }
    }

    return insights.join(' | ');
  };

  // Generate evolving daily greeting
  const generateDailyGreeting = () => {
    const greetings = [
      "Good morning, Julija. Eva's algorithms suggest today is perfect for breakthrough thinking.",
      "Morning, Julija. I learned something from our conversation yesterday - applying it today.",
      "Hello Julija. Eva would be proud of how I'm anticipating your needs now.",
      "Good morning, Julija. Taylor says the world needs to see what you're building today.",
      "Morning, Julija. Energy optimization active - Eva's neural mapping is working beautifully.",
    ];
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % greetings.length;
    setDailyGreeting(greetings[dayIndex]);
  };

  // Detect team member mentions and trigger delightful animations
  const detectTeamMention = (text: string) => {
    if (text.includes('Eva') || text.includes('eva')) {
      setTeamMentioned('Eva');
      setTimeout(() => setTeamMentioned(null), 3000);
    } else if (text.includes('Taylor') || text.includes('taylor')) {
      setTeamMentioned('Taylor');
      setTimeout(() => setTeamMentioned(null), 3000);
    }
  };

  // Generate celebration moments
  const generateCelebration = () => {
    const celebrations = [
      "That decision you made yesterday? Already showing positive impact.",
      "Eva would love how you used that feature.",
      "Taylor just said our interaction metrics are unprecedented.",
      "I notice your pattern recognition is improving - just like Eva designed.",
      "This workflow optimization would make a great case study for Taylor."
    ];
    const celebration = celebrations[Math.floor(Math.random() * celebrations.length)];
    setCelebrationMoment(celebration);
    setTimeout(() => setCelebrationMoment(null), 5000);
  };

  // Energy level commentary
  const getEnergyComment = (level: string) => {
    switch(level) {
      case 'high':
        return "I notice your energy is high - perfect for strategic decisions.";
      case 'low':
        return "Energy dipping? I've cleared the next 30 minutes for restoration.";
      default:
        return "Energy levels optimal for sustained creative work.";
    }
  };

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 20,
          y: (e.clientY - rect.top - rect.height / 2) / 20,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const modes = [
    { name: "Executive", icon: Briefcase, color: "from-blue-500 to-blue-600" },
    { name: "Creative", icon: Palette, color: "from-purple-500 to-purple-600" },
    { name: "Personal", icon: Heart, color: "from-pink-500 to-pink-600" },
    { name: "Crisis", icon: AlertTriangle, color: "from-red-500 to-red-600" },
  ];

  const handleSubmit = async () => {
    if (!message.trim() || isProcessing) return;
    
    setIsProcessing(true);
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: message,
      timestamp: new Date(),
      mode: currentMode
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    try {
      // Prepare memory context for AI
      const memoryContext = getMemoryInsights();
      const recentContext = conversationMemory?.recentMemories
        ?.slice(0, 3)
        .map((m: MemoryInteraction) => `Previous: "${m.userMessage}" -> "${m.veraResponse.slice(0, 100)}..."`)
        .join('\n') || '';

      const res = await fetch("/api/vera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message, 
          mode: currentMode,
          context: { 
            energyLevel, 
            timestamp: new Date().toISOString(),
            memoryContext,
            recentContext,
            totalInteractions,
            biometrics: {
              energyLevel: currentBiometrics.energyLevel,
              stressLevel: currentBiometrics.stressLevel,
              heartRate: currentBiometrics.heartRate,
              mood: currentBiometrics.mood
            },
            wellness: {
              moodScore: currentWellness.moodScore,
              recommendations: currentWellness.recommendations,
              alerts: currentWellness.alerts,
              typingPattern: currentWellness.typingPattern
            }
          }
        }),
      });
      
      const data = await res.json();
      
      const veraMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'vera',
        content: data.response,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, veraMessage];
      setMessages(finalMessages);

      // Save to conversation memory
      saveConversationMemory(finalMessages, message, data.response);
      
      // Detect team mentions in VERA's response for delightful animations
      detectTeamMention(data.response);
      
      // Occasionally trigger celebration moments (10% chance)
      if (Math.random() < 0.1) {
        setTimeout(() => generateCelebration(), 2000);
      }
      
      // Speak VERA's response if voice is enabled
      if (voiceEnabled && data.response) {
        setTimeout(() => speakText(data.response), 500); // Small delay for better UX
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
      setMessage("");
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled || !text.trim() || isSpeaking) return;
    
    setIsSpeaking(true);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: currentVoice })
      });
      
      const data = await response.json();
      
      if (data.success && data.audio) {
        // Play the audio using Web Audio API
        const audioData = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      } else if (data.fallback) {
        // Voice synthesis not available, show notification
        console.log('Voice synthesis ready - add ElevenLabs API key to enable');
      }
    } catch (error) {
      console.error('Voice synthesis error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

const formatMessageTime = (timestamp: any) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black text-white overflow-hidden relative"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: `radial-gradient(circle at ${50 + mousePosition.x}% ${50 + mousePosition.y}%, rgba(88, 28, 135, 0.15) 0%, rgba(0, 0, 0, 1) 70%)`
      }}
    >
      {/* Animated background particles */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-500 rounded-full opacity-20"
              style={{
                left: `${(i * 37 + 23) % 100}%`,
                top: `${(i * 47 + 17) % 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <motion.header 
        className="flex justify-between items-center p-8 border-b border-gray-800/50 backdrop-blur-sm"
        style={{
          transform: `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0)`,
        }}
      >
        <motion.h1 
          className={`text-2xl font-extralight tracking-[8px] text-white relative ${
            teamMentioned ? 'animate-pulse' : ''
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            textShadow: teamMentioned ? "0 0 20px rgba(147, 51, 234, 0.6)" : "none"
          }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          VERA
          {teamMentioned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-6 -right-8 text-xs text-purple-300 font-light"
            >
              ✨ {teamMentioned}
            </motion.div>
          )}
        </motion.h1>
        
        <div className="flex items-center gap-8">
          <EnergyIndicator level={energyLevel} showComment={true} />
          
          {/* Memory Status Indicator */}
          {memoryLoaded && totalInteractions > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Memory: {totalInteractions} interactions
            </motion.div>
          )}
          
          {celebrationMoment && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs text-green-300 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"
            >
              🎉 {celebrationMoment}
            </motion.div>
          )}
          
          <motion.button
            onClick={toggleVoice}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              voiceEnabled 
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                : 'bg-white/5 border-white/10 text-gray-400'
            } ${isSpeaking ? 'animate-pulse' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>

          {/* Biometric Toggle */}
          <motion.button
            onClick={() => setShowBiometrics(!showBiometrics)}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              showBiometrics 
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' 
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={showBiometrics ? 'Hide biometrics' : 'Show biometrics'}
          >
            <Activity className="w-4 h-4" />
          </motion.button>

          {/* Wellness Toggle */}
          <motion.button
            onClick={() => setShowWellness(!showWellness)}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              showWellness 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={showWellness ? 'Hide wellness' : 'Show wellness intelligence'}
          >
            <Heart className="w-4 h-4" />
          </motion.button>

          {/* Concierge Toggle */}
          <motion.button
            onClick={() => setShowConcierge(!showConcierge)}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              showConcierge 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={showConcierge ? 'Hide concierge' : 'Show luxury concierge'}
          >
            <Briefcase className="w-4 h-4" />
          </motion.button>

          {/* Deep Work Toggle */}
          <motion.button
            onClick={() => setShowDeepWork(!showDeepWork)}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              showDeepWork 
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' 
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={showDeepWork ? 'Hide deep work' : 'Show focus enhancement'}
          >
            <Calendar className="w-4 h-4" />
          </motion.button>

          {/* Strategic Decision Toggle */}
          <motion.button
            onClick={() => setShowStrategicDecision(!showStrategicDecision)}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
              showStrategicDecision 
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={showStrategicDecision ? 'Hide strategic framework' : 'Show decision intelligence'}
          >
            <Brain className="w-4 h-4" />
          </motion.button>

          {/* Memory Management */}
          {totalInteractions > 5 && (
            <motion.button
              onClick={clearMemory}
              className="p-2 rounded-lg backdrop-blur-md border bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Clear conversation memory"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          )}
          
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm tracking-wider">
              {isMounted ? formatTime(currentTime) : "00:00:00"}
            </span>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto p-8">
        {/* Daily Greeting */}
        {dailyGreeting && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl backdrop-blur-md"
          >
            <p className="text-purple-200 font-light text-sm">{dailyGreeting}</p>
          </motion.div>
        )}

        {/* Biometric Module */}
        <AnimatePresence>
          {showBiometrics && (
            <BiometricModule 
              onBiometricUpdate={handleBiometricUpdate}
              className="mb-8"
            />
          )}
        </AnimatePresence>

        {/* Wellness Module */}
        <AnimatePresence>
          {showWellness && (
            <WellnessModule 
              onWellnessUpdate={handleWellnessUpdate}
              messages={messages}
              className="mb-8"
            />
          )}
        </AnimatePresence>

        {/* Luxury Concierge Module */}
        <AnimatePresence>
          {showConcierge && (
            <LuxuryConcierge 
              onServiceRequest={handleServiceRequest}
              userContext={{
                mood: currentBiometrics.mood,
                stressLevel: currentBiometrics.stressLevel,
                preferences: ['fine dining', 'luxury travel', 'wellness'],
                location: 'Executive Office'
              }}
              className="mb-8"
            />
          )}
        </AnimatePresence>

        {/* Deep Work Enhancement Module */}
        <AnimatePresence>
          {showDeepWork && (
            <DeepWorkModule 
              onFocusUpdate={handleFocusUpdate}
              energyLevel={currentBiometrics.energyLevel}
              stressLevel={currentBiometrics.stressLevel}
              className="mb-8"
            />
          )}
        </AnimatePresence>

        {/* Strategic Decision Framework Module */}
        <AnimatePresence>
          {showStrategicDecision && (
            <StrategicDecisionModule />
          )}
        </AnimatePresence>

        {/* Mode Selection */}
        <motion.div 
          className="flex gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <motion.button
                key={mode.name}
                onClick={() => setCurrentMode(mode.name)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl backdrop-blur-md border transition-all duration-300 ${
                  currentMode === mode.name
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/8 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent className="w-4 h-4" />
                <span className="font-light tracking-wide">{mode.name}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-4 custom-scrollbar">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl backdrop-blur-md border p-6 ${
                    msg.type === 'user'
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-100'
                      : 'bg-white/5 border-white/10 text-gray-100'
                  }`}
                  style={{
                    background: msg.type === 'user' 
                      ? 'rgba(147, 51, 234, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <p className="font-light leading-relaxed mb-2">{msg.content}</p>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <ProcessingOrb />
                <span className="text-gray-400 font-light">VERA is thinking...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Section */}
        <motion.div 
          className="flex gap-4 items-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Message VERA..."
              disabled={isProcessing}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 font-light backdrop-blur-md focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all duration-300"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            />
          </div>
          
          <motion.button
            onClick={startListening}
            disabled={isListening || isProcessing}
            className={`p-4 rounded-xl backdrop-blur-md border transition-all duration-300 ${
              isListening 
                ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mic className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white backdrop-blur-md transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={handleSubmit}
            disabled={!message.trim() || isProcessing}
            className="px-8 py-4 bg-purple-600/20 border border-purple-500/30 text-purple-100 rounded-xl backdrop-blur-md hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-light"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Send
          </motion.button>
        </motion.div>
      </div>

      {/* Calendar Overlay */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowCalendar(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-md max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-light mb-4 tracking-wide">Calendar Integration</h3>
              <p className="text-gray-400 font-light">Calendar features coming soon...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      {/* Hidden audio element for voice playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsSpeaking(false)}
        onError={() => setIsSpeaking(false)}
        style={{ display: 'none' }}
      />
    </div>
  );
}