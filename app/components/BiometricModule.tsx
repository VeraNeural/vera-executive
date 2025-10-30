"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Activity, 
  Brain, 
  Zap, 
  Camera, 
  Play, 
  Pause, 
  BarChart3,
  TrendingUp,
  Shield,
  Sparkles
} from "lucide-react";

interface BiometricData {
  energyLevel: number; // 1-100
  stressLevel: number; // 1-100
  heartRate?: number;
  hrv?: number;
  timestamp: Date;
  mood: 'excellent' | 'good' | 'neutral' | 'low' | 'stressed';
}

interface BiometricPattern {
  optimalEnergyTime: string[];
  stressTriggers: string[];
  recoveryMethods: string[];
  energyTrends: { time: string; level: number }[];
}

interface BiometricModuleProps {
  onBiometricUpdate: (data: BiometricData) => void;
  className?: string;
}

export default function BiometricModule({ onBiometricUpdate, className = "" }: BiometricModuleProps) {
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData>({
    energyLevel: 75,
    stressLevel: 25,
    timestamp: new Date(),
    mood: 'good'
  });
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [patterns, setPatterns] = useState<BiometricPattern | null>(null);
  const [showPulseDetection, setShowPulseDetection] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Load patterns from localStorage
  useEffect(() => {
    const savedPatterns = localStorage.getItem('vera-biometric-patterns');
    if (savedPatterns) {
      setPatterns(JSON.parse(savedPatterns));
    }
  }, []);

  // Save patterns to localStorage
  const savePatterns = (newPatterns: BiometricPattern) => {
    localStorage.setItem('vera-biometric-patterns', JSON.stringify(newPatterns));
    setPatterns(newPatterns);
  };

  // Manual energy input with smooth animation
  const updateEnergyLevel = (level: number) => {
    setIsAnalyzing(true);
    
    // Simulate 2-second analysis
    setTimeout(() => {
      const stressLevel = Math.max(0, 100 - level - Math.random() * 20);
      const mood = level > 80 ? 'excellent' : level > 60 ? 'good' : level > 40 ? 'neutral' : level > 20 ? 'low' : 'stressed';
      
      const newData: BiometricData = {
        energyLevel: level,
        stressLevel,
        timestamp: new Date(),
        mood
      };
      
      setCurrentBiometrics(newData);
      onBiometricUpdate(newData);
      
      // Learn patterns
      learnFromInput(newData);
      setIsAnalyzing(false);
    }, 2000);
  };

  // Pattern learning
  const learnFromInput = (data: BiometricData) => {
    const currentHour = data.timestamp.getHours();
    const timeSlot = `${currentHour}:00`;
    
    const updatedPatterns: BiometricPattern = patterns || {
      optimalEnergyTime: [],
      stressTriggers: [],
      recoveryMethods: [],
      energyTrends: []
    };
    
    // Track energy trends
    updatedPatterns.energyTrends.push({
      time: timeSlot,
      level: data.energyLevel
    });
    
    // Keep only last 50 data points
    updatedPatterns.energyTrends = updatedPatterns.energyTrends.slice(-50);
    
    // Identify optimal energy times
    if (data.energyLevel > 70) {
      if (!updatedPatterns.optimalEnergyTime.includes(timeSlot)) {
        updatedPatterns.optimalEnergyTime.push(timeSlot);
      }
    }
    
    savePatterns(updatedPatterns);
  };

  // Camera-based pulse detection
  const startPulseDetection = async () => {
    try {
      setShowPulseDetection(true);
      setIsCapturing(true);
      setCaptureProgress(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start pulse detection algorithm
        detectPulse();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setShowPulseDetection(false);
      setIsCapturing(false);
    }
  };

  // Pulse detection algorithm
  const detectPulse = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const frameRate = 30; // FPS
    const duration = 15000; // 15 seconds
    const totalFrames = (duration / 1000) * frameRate;
    let frameCount = 0;
    const redValues: number[] = [];
    
    const processFrame = () => {
      if (frameCount >= totalFrames) {
        stopPulseDetection();
        calculateHeartRate(redValues);
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get center region for finger detection
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const regionSize = 50;
      
      const imageData = ctx.getImageData(
        centerX - regionSize/2, 
        centerY - regionSize/2, 
        regionSize, 
        regionSize
      );
      
      // Calculate average red value
      let redSum = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        redSum += imageData.data[i]; // Red channel
      }
      
      const avgRed = redSum / (imageData.data.length / 4);
      redValues.push(avgRed);
      
      frameCount++;
      setCaptureProgress((frameCount / totalFrames) * 100);
      
      animationRef.current = requestAnimationFrame(processFrame);
    };
    
    processFrame();
  };

  // Calculate heart rate from red channel variations
  const calculateHeartRate = (redValues: number[]) => {
    // Simple peak detection algorithm
    const peaks: number[] = [];
    const threshold = 2; // Sensitivity threshold
    
    for (let i = 1; i < redValues.length - 1; i++) {
      if (redValues[i] > redValues[i-1] + threshold && 
          redValues[i] > redValues[i+1] + threshold) {
        peaks.push(i);
      }
    }
    
    if (peaks.length < 2) {
      setCurrentBiometrics(prev => ({ ...prev, heartRate: undefined }));
      return;
    }
    
    // Calculate BPM
    const frameRate = 30;
    const duration = 15; // seconds
    const avgPeakInterval = peaks.reduce((sum, peak, i) => {
      return i > 0 ? sum + (peak - peaks[i-1]) : sum;
    }, 0) / (peaks.length - 1);
    
    const heartRate = Math.round((frameRate * 60) / avgPeakInterval);
    
    // Validate heart rate range
    if (heartRate >= 50 && heartRate <= 180) {
      const hrv = calculateHRV(peaks);
      setCurrentBiometrics(prev => ({
        ...prev,
        heartRate,
        hrv
      }));
    }
  };

  // Calculate Heart Rate Variability
  const calculateHRV = (peaks: number[]): number => {
    if (peaks.length < 3) return 0;
    
    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;
    
    return Math.round(Math.sqrt(variance));
  };

  const stopPulseDetection = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    
    setShowPulseDetection(false);
    setIsCapturing(false);
    setCaptureProgress(0);
  };

  // Get optimization suggestions
  const getOptimizationSuggestion = (): string => {
    const { energyLevel, stressLevel, mood } = currentBiometrics;
    
    if (stressLevel > 70) {
      return "Deep breathing recommended - I've prepared a 3-minute session";
    }
    if (energyLevel < 30) {
      return "Energy restoration needed - optimal break time detected";
    }
    if (mood === 'excellent' && energyLevel > 80) {
      return "Peak performance state - perfect for strategic decisions";
    }
    if (patterns?.optimalEnergyTime.length) {
      const currentHour = new Date().getHours();
      const currentTime = `${currentHour}:00`;
      if (patterns.optimalEnergyTime.includes(currentTime)) {
        return "You're in your optimal energy window - maximize this time";
      }
    }
    
    return "Biometric patterns optimal - continue current state";
  };

  // Energy orb animation variants
  const orbVariants = {
    excellent: { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] },
    good: { scale: [1, 1.05, 1], opacity: [0.7, 0.9, 0.7] },
    neutral: { scale: [1, 1.02, 1], opacity: [0.6, 0.8, 0.6] },
    low: { scale: [1, 0.98, 1], opacity: [0.5, 0.7, 0.5] },
    stressed: { scale: [1, 0.95, 1], opacity: [0.4, 0.6, 0.4] }
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Main Biometric Dashboard */}
      <div className="bg-gradient-to-br from-slate-900/40 to-purple-900/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-light text-white">Biometric Intelligence</h3>
          </div>
          
          <motion.button
            onClick={() => setShowPulseDetection(!showPulseDetection)}
            className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Energy Orb */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <motion.div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${
                  currentBiometrics.mood === 'excellent' ? 'from-green-400 to-emerald-600' :
                  currentBiometrics.mood === 'good' ? 'from-blue-400 to-cyan-600' :
                  currentBiometrics.mood === 'neutral' ? 'from-yellow-400 to-orange-500' :
                  currentBiometrics.mood === 'low' ? 'from-orange-400 to-red-500' :
                  'from-red-500 to-pink-600'
                } shadow-2xl relative overflow-hidden`}
                animate={orbVariants[currentBiometrics.mood]}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <motion.div
                  className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {currentBiometrics.energyLevel}%
                  </span>
                </div>
              </motion.div>
              
              {isAnalyzing && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-purple-400"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
            
            <div className="text-center">
              <p className="text-white font-medium">Energy Level</p>
              <p className="text-gray-400 text-sm capitalize">{currentBiometrics.mood}</p>
            </div>
          </div>

          {/* Stress Indicator */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke={currentBiometrics.stressLevel > 70 ? "#ef4444" : "#10b981"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 40 * (1 - currentBiometrics.stressLevel / 100)
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className={`w-8 h-8 ${currentBiometrics.stressLevel > 70 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-white font-medium">Stress Level</p>
              <p className="text-gray-400 text-sm">{Math.round(currentBiometrics.stressLevel)}%</p>
            </div>
          </div>

          {/* Heart Rate */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center"
                animate={currentBiometrics.heartRate ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            
            <div className="text-center">
              <p className="text-white font-medium">Heart Rate</p>
              <p className="text-gray-400 text-sm">
                {currentBiometrics.heartRate ? `${currentBiometrics.heartRate} BPM` : 'Not detected'}
              </p>
            </div>
          </div>
        </div>

        {/* Manual Energy Input */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white font-medium">Manual Energy Assessment</label>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="1"
              max="100"
              value={currentBiometrics.energyLevel}
              onChange={(e) => updateEnergyLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
              disabled={isAnalyzing}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Exhausted</span>
              <span>Optimal</span>
              <span>Peak</span>
            </div>
          </div>
        </div>

        {/* Optimization Suggestion */}
        <motion.div
          className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white font-medium text-sm">VERA's Optimization</p>
              <p className="text-gray-300 text-sm mt-1">{getOptimizationSuggestion()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pulse Detection Modal */}
      <AnimatePresence>
        {showPulseDetection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={stopPulseDetection}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-900 border border-white/20 rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-light text-white">Pulse Detection</h3>
                
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-48 rounded-2xl bg-black"
                    autoPlay
                    muted
                    playsInline
                  />
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={240}
                    className="hidden"
                  />
                  
                  {/* Finger placement guide */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-16 h-16 border-2 border-red-400 rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Heart className="w-6 h-6 text-red-400" />
                    </motion.div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Place your finger gently over the camera lens
                  </p>
                  
                  {isCapturing && (
                    <div className="space-y-2">
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <motion.div
                          className="h-2 bg-gradient-to-r from-red-400 to-pink-500 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${captureProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400">
                        Analyzing... {Math.round(captureProgress)}%
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  {!isCapturing ? (
                    <motion.button
                      onClick={startPulseDetection}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-5 h-5 mx-auto" />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={stopPulseDetection}
                      className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Pause className="w-5 h-5 mx-auto" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={stopPulseDetection}
                    className="px-6 py-3 border border-white/20 text-white rounded-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #a855f7);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #a855f7);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </motion.div>
  );
}