"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Focus, 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Eye, 
  Brain, 
  Timer, 
  Target, 
  TrendingUp,
  Shield,
  Sun,
  Moon,
  Coffee,
  Lightbulb,
  Waves,
  Zap,
  CheckCircle,
  BarChart3,
  Settings
} from "lucide-react";

interface FocusSession {
  id: string;
  type: 'deep-work' | 'creative' | 'strategic' | 'break';
  duration: number;
  startTime: Date;
  endTime?: Date;
  interruptions: number;
  completionRate: number;
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

interface DeepWorkModuleProps {
  onFocusUpdate: (data: DeepWorkData) => void;
  energyLevel: number;
  stressLevel: number;
  className?: string;
}

export default function DeepWorkModule({ onFocusUpdate, energyLevel, stressLevel, className = "" }: DeepWorkModuleProps) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(25); // Pomodoro default
  const [focusData, setFocusData] = useState<DeepWorkData>({
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
  
  const [ambientSound, setAmbientSound] = useState<string>('none');
  const [soundVolume, setSoundVolume] = useState(30);
  const [environmentMode, setEnvironmentMode] = useState<'focus' | 'creative' | 'rest'>('focus');
  const [distractionBlocked, setDistractionBlocked] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>();

  // Timer management
  useEffect(() => {
    if (isSessionActive && currentSession) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          
          // Check for flow state (25+ minutes without interruption)
          if (newTime >= 1500 && currentSession.interruptions === 0) {
            setFocusData(prev => ({ ...prev, flowStateAchieved: true }));
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSessionActive, currentSession]);

  // Auto-complete session when time reached
  useEffect(() => {
    if (sessionTime >= selectedDuration * 60 && isSessionActive) {
      completeSession();
    }
  }, [sessionTime, selectedDuration, isSessionActive]);

  // Ambient sound management
  useEffect(() => {
    if (ambientSound !== 'none' && isSessionActive) {
      // In a real implementation, you'd load actual audio files
      playAmbientSound(ambientSound);
    } else {
      stopAmbientSound();
    }
  }, [ambientSound, isSessionActive]);

  const startFocusSession = () => {
    const session: FocusSession = {
      id: Date.now().toString(),
      type: environmentMode === 'creative' ? 'creative' : 
            environmentMode === 'rest' ? 'break' : 'deep-work',
      duration: selectedDuration,
      startTime: new Date(),
      interruptions: 0,
      completionRate: 0
    };
    
    setCurrentSession(session);
    setIsSessionActive(true);
    setSessionTime(0);
    setDistractionBlocked(true);
    
    // Update focus data
    setFocusData(prev => ({
      ...prev,
      sessionsToday: prev.sessionsToday + 1,
      flowStateAchieved: false
    }));
  };

  const pauseSession = () => {
    setIsSessionActive(false);
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        interruptions: prev.interruptions + 1
      } : null);
    }
  };

  const resumeSession = () => {
    setIsSessionActive(true);
  };

  const completeSession = () => {
    if (currentSession) {
      const completedSession = {
        ...currentSession,
        endTime: new Date(),
        completionRate: Math.round((sessionTime / (selectedDuration * 60)) * 100)
      };
      
      // Update total focus time and performance tracking
      const newTotalTime = focusData.totalFocusTime + sessionTime;
      const currentHour = new Date().getHours();
      const hourString = `${currentHour}:00`;
      
      const updatedData: DeepWorkData = {
        ...focusData,
        totalFocusTime: newTotalTime,
        peakPerformanceHours: completedSession.completionRate > 90 && !focusData.peakPerformanceHours.includes(hourString)
          ? [...focusData.peakPerformanceHours, hourString]
          : focusData.peakPerformanceHours
      };
      
      setFocusData(updatedData);
      onFocusUpdate(updatedData);
    }
    
    setCurrentSession(null);
    setIsSessionActive(false);
    setSessionTime(0);
    setDistractionBlocked(false);
    setAmbientSound('none');
  };

  const playAmbientSound = (sound: string) => {
    // Simulate ambient sound playing
    console.log(`Playing ${sound} ambient sound at ${soundVolume}% volume`);
  };

  const stopAmbientSound = () => {
    // Simulate stopping ambient sound
    console.log('Stopping ambient sound');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getOptimalSessionSuggestion = (): { duration: number; type: string; reason: string } => {
    if (stressLevel > 70) {
      return { duration: 15, type: 'break', reason: 'High stress detected - short restoration break recommended' };
    }
    if (energyLevel > 80) {
      return { duration: 50, type: 'deep-work', reason: 'Peak energy state - optimal for challenging tasks' };
    }
    if (energyLevel < 40) {
      return { duration: 20, type: 'creative', reason: 'Lower energy - perfect for creative exploration' };
    }
    return { duration: 25, type: 'focus', reason: 'Balanced state - standard Pomodoro session' };
  };

  const environmentModes = [
    { id: 'focus', name: 'Deep Focus', icon: Focus, color: 'blue' },
    { id: 'creative', name: 'Creative Flow', icon: Lightbulb, color: 'purple' },
    { id: 'rest', name: 'Restoration', icon: Moon, color: 'green' }
  ];

  const ambientSounds = [
    { id: 'none', name: 'Silent', icon: VolumeX },
    { id: 'nature', name: 'Forest Sounds', icon: Waves },
    { id: 'rain', name: 'Rain', icon: Waves },
    { id: 'cafe', name: 'Coffee Shop', icon: Coffee },
    { id: 'white-noise', name: 'White Noise', icon: Volume2 },
    { id: 'binaural', name: 'Focus Beats', icon: Brain }
  ];

  const durations = [15, 25, 45, 60, 90];
  const suggestion = getOptimalSessionSuggestion();

  return (
    <motion.div 
      className={`${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Focus className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-light text-white">Deep Work Enhancement</h3>
          </div>
          
          <div className="flex items-center gap-4">
            {focusData.flowStateAchieved && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full"
              >
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">Flow State</span>
              </motion.div>
            )}
            
            <div className="text-indigo-300 text-sm">
              Today: {Math.round(focusData.totalFocusTime / 60)}min • {focusData.sessionsToday} sessions
            </div>
          </div>
        </div>

        {/* AI Suggestion */}
        <motion.div
          className="mb-8 p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-indigo-400 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">VERA's Focus Optimization</p>
              <p className="text-indigo-200 text-sm mt-1">
                {suggestion.reason} - Recommended: {suggestion.duration} minute {suggestion.type} session
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timer and Controls */}
          <div className="space-y-6">
            {/* Timer Display */}
            <div className="text-center">
              <motion.div
                className="relative inline-block"
                animate={isSessionActive ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - sessionTime / (selectedDuration * 60))}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-light text-white mb-2">
                    {formatTime(sessionTime)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedDuration} min {environmentMode}
                  </div>
                  {currentSession && (
                    <div className="text-xs text-indigo-300 mt-1">
                      {currentSession.interruptions} interruptions
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4">
              {!isSessionActive && !currentSession ? (
                <motion.button
                  onClick={startFocusSession}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" />
                  Start Session
                </motion.button>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    onClick={isSessionActive ? pauseSession : resumeSession}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSessionActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isSessionActive ? 'Pause' : 'Resume'}
                  </motion.button>
                  
                  <motion.button
                    onClick={completeSession}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </motion.button>
                </div>
              )}
            </div>

            {/* Duration Selection */}
            {!isSessionActive && (
              <div className="space-y-3">
                <label className="text-white font-medium text-sm">Session Duration</label>
                <div className="flex gap-2">
                  {durations.map((duration) => (
                    <motion.button
                      key={duration}
                      onClick={() => setSelectedDuration(duration)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedDuration === duration
                          ? 'bg-indigo-500/30 border border-indigo-500/50 text-indigo-200'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {duration}m
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Environment Controls */}
          <div className="space-y-6">
            {/* Environment Mode */}
            <div className="space-y-3">
              <label className="text-white font-medium text-sm">Environment Mode</label>
              <div className="grid grid-cols-1 gap-3">
                {environmentModes.map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => setEnvironmentMode(mode.id as any)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                      environmentMode === mode.id
                        ? `bg-${mode.color}-500/20 border-${mode.color}-500/30`
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSessionActive}
                  >
                    <mode.icon className={`w-5 h-5 ${
                      environmentMode === mode.id ? `text-${mode.color}-400` : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      environmentMode === mode.id ? `text-${mode.color}-200` : 'text-gray-300'
                    }`}>
                      {mode.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Ambient Sound */}
            <div className="space-y-3">
              <label className="text-white font-medium text-sm">Ambient Soundscape</label>
              <div className="grid grid-cols-2 gap-2">
                {ambientSounds.map((sound) => (
                  <motion.button
                    key={sound.id}
                    onClick={() => setAmbientSound(sound.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-all duration-300 ${
                      ambientSound === sound.id
                        ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <sound.icon className="w-4 h-4" />
                    {sound.name}
                  </motion.button>
                ))}
              </div>
              
              {ambientSound !== 'none' && (
                <div className="space-y-2">
                  <label className="text-gray-400 text-xs">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Distraction Blocking */}
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-medium text-sm">Distraction Blocking</p>
                  <p className="text-gray-400 text-xs">Block non-essential websites</p>
                </div>
              </div>
              <motion.button
                onClick={() => setDistractionBlocked(!distractionBlocked)}
                className={`w-12 h-6 rounded-full transition-all duration-300 ${
                  distractionBlocked ? 'bg-red-500' : 'bg-gray-600'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: distractionBlocked ? 26 : 2 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        {focusData.sessionsToday > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl"
          >
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Today's Performance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {Math.round(focusData.totalFocusTime / 60)}
                </div>
                <div className="text-green-200 text-sm">Minutes Focused</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {focusData.sessionsToday}
                </div>
                <div className="text-blue-200 text-sm">Sessions Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {focusData.peakPerformanceHours.length}
                </div>
                <div className="text-purple-200 text-sm">Peak Hours Identified</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}