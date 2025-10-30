"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, 
  Smile, 
  Frown, 
  Zap, 
  Coffee, 
  Droplets, 
  Moon, 
  Sun,
  Heart,
  Shield,
  Target,
  TrendingUp,
  Bell
} from "lucide-react";

interface WellnessData {
  moodScore: number; // 1-100
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

interface WellnessModuleProps {
  onWellnessUpdate: (data: WellnessData) => void;
  messages: any[];
  className?: string;
}

export default function WellnessModule({ onWellnessUpdate, messages, className = "" }: WellnessModuleProps) {
  const [wellnessData, setWellnessData] = useState<WellnessData>({
    moodScore: 75,
    stressLevel: 25,
    energyLevel: 80,
    typingPattern: { speed: 0, pauses: 0, errors: 0 },
    recommendations: [],
    alerts: []
  });
  
  const [typingMetrics, setTypingMetrics] = useState({
    startTime: 0,
    keystrokes: 0,
    pauses: 0,
    errors: 0
  });

  const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());

  // Analyze typing patterns for stress detection
  useEffect(() => {
    const analyzeTypingPattern = () => {
      if (messages.length < 2) return;

      const recentMessages = messages.slice(-5);
      let totalStressScore = 0;
      let moodScore = 75;

      recentMessages.forEach(msg => {
        if (msg.type === 'user') {
          const text = msg.content.toLowerCase();
          
          // Stress indicators in text
          const stressWords = ['urgent', 'asap', 'help', 'problem', 'issue', 'stuck', 'frustrated', 'overwhelmed'];
          const stressCount = stressWords.filter(word => text.includes(word)).length;
          
          // Positive mood indicators
          const positiveWords = ['great', 'excellent', 'perfect', 'love', 'amazing', 'wonderful', 'fantastic'];
          const positiveCount = positiveWords.filter(word => text.includes(word)).length;
          
          // Negative mood indicators
          const negativeWords = ['tired', 'exhausted', 'stressed', 'difficult', 'hard', 'impossible', 'terrible'];
          const negativeCount = negativeWords.filter(word => text.includes(word)).length;
          
          // Calculate stress based on urgency words and punctuation
          const urgencyPunctuation = (text.match(/[!?]{2,}/g) || []).length;
          const allCaps = (text.match(/[A-Z]{3,}/g) || []).length;
          
          totalStressScore += (stressCount * 15) + (urgencyPunctuation * 10) + (allCaps * 5);
          
          // Calculate mood
          moodScore += (positiveCount * 10) - (negativeCount * 8);
          
          // Text length analysis (very short or very long messages can indicate stress)
          if (text.length < 10 || text.length > 200) {
            totalStressScore += 5;
          }
        }
      });

      // Cap scores
      const finalStressLevel = Math.min(100, Math.max(0, totalStressScore));
      const finalMoodScore = Math.min(100, Math.max(20, moodScore));
      
      // Generate recommendations based on analysis
      const recommendations = generateRecommendations(finalStressLevel, finalMoodScore);
      const alerts = generateAlerts(finalStressLevel, finalMoodScore);

      const newWellnessData: WellnessData = {
        moodScore: finalMoodScore,
        stressLevel: finalStressLevel,
        energyLevel: wellnessData.energyLevel,
        typingPattern: {
          speed: typingMetrics.keystrokes,
          pauses: typingMetrics.pauses,
          errors: typingMetrics.errors
        },
        recommendations,
        alerts
      };

      setWellnessData(newWellnessData);
      onWellnessUpdate(newWellnessData);
      setLastAnalysis(new Date());
    };

    analyzeTypingPattern();
  }, [messages]);

  // Generate wellness recommendations
  const generateRecommendations = (stress: number, mood: number): string[] => {
    const recommendations = [];
    const currentHour = new Date().getHours();

    if (stress > 70) {
      recommendations.push("🧘‍♀️ Take a 5-minute breathing break - I'll guide you through it");
      recommendations.push("🌿 Step away from the screen for 10 minutes");
      recommendations.push("☕ Hydrate - stress depletes your energy reserves");
    }

    if (mood < 50) {
      recommendations.push("🎵 Play your favorite energizing playlist");
      recommendations.push("☀️ Get some natural light exposure");
      recommendations.push("🏃‍♀️ Try a quick 2-minute movement break");
    }

    if (currentHour > 22 || currentHour < 6) {
      recommendations.push("🌙 Consider winding down - your brain needs restoration");
      recommendations.push("📱 Blue light filter activated for better sleep");
    }

    if (stress < 30 && mood > 80) {
      recommendations.push("🚀 You're in peak state - perfect time for creative work");
      recommendations.push("🎯 Tackle your most challenging task while energy is high");
    }

    return recommendations.slice(0, 3); // Limit to top 3
  };

  // Generate wellness alerts
  const generateAlerts = (stress: number, mood: number): string[] => {
    const alerts = [];

    if (stress > 85) {
      alerts.push("⚠️ High stress detected - Eva's wellness protocols activated");
    }

    if (mood < 30) {
      alerts.push("💙 Low mood pattern - consider reaching out to your support network");
    }

    const now = new Date();
    const timeSinceLastBreak = now.getTime() - lastAnalysis.getTime();
    if (timeSinceLastBreak > 2 * 60 * 60 * 1000) { // 2 hours
      alerts.push("⏰ Break reminder - you've been focused for 2+ hours");
    }

    return alerts;
  };

  // Wellness optimization suggestions
  const getWellnessOptimization = () => {
    const { stressLevel, moodScore, energyLevel } = wellnessData;
    
    if (stressLevel > 80) {
      return {
        title: "Crisis Mode Activated",
        action: "Immediate stress relief protocol",
        icon: Shield,
        color: "text-red-400"
      };
    }
    
    if (moodScore > 85 && energyLevel > 80) {
      return {
        title: "Peak Performance",
        action: "Optimize for high-impact work",
        icon: Target,
        color: "text-green-400"
      };
    }
    
    if (moodScore < 40) {
      return {
        title: "Mood Enhancement",
        action: "Gentle restoration needed",
        icon: Heart,
        color: "text-pink-400"
      };
    }
    
    return {
      title: "Balanced State",
      action: "Maintain current wellness",
      icon: Sun,
      color: "text-yellow-400"
    };
  };

  const optimization = getWellnessOptimization();

  return (
    <motion.div 
      className={`${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gradient-to-br from-emerald-900/40 to-blue-900/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-light text-white">Wellness Intelligence</h3>
          </div>
          
          <div className="text-xs text-gray-400">
            Last analysis: {lastAnalysis.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Mood Score */}
          <div className="text-center">
            <div className="relative mb-3">
              <motion.div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  wellnessData.moodScore > 70 ? 'bg-green-500/20' :
                  wellnessData.moodScore > 40 ? 'bg-yellow-500/20' :
                  'bg-red-500/20'
                }`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {wellnessData.moodScore > 70 ? 
                  <Smile className="w-8 h-8 text-green-400" /> :
                  wellnessData.moodScore > 40 ?
                  <Brain className="w-8 h-8 text-yellow-400" /> :
                  <Frown className="w-8 h-8 text-red-400" />
                }
              </motion.div>
            </div>
            <p className="text-white font-medium">Mood Score</p>
            <p className="text-gray-400 text-sm">{wellnessData.moodScore}%</p>
          </div>

          {/* Stress Level */}
          <div className="text-center">
            <div className="relative mb-3">
              <svg className="w-16 h-16 mx-auto">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={wellnessData.stressLevel > 70 ? "#ef4444" : "#10b981"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 28 * (1 - wellnessData.stressLevel / 100)
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className={`w-6 h-6 ${wellnessData.stressLevel > 70 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </div>
            <p className="text-white font-medium">Stress Level</p>
            <p className="text-gray-400 text-sm">{wellnessData.stressLevel}%</p>
          </div>

          {/* Optimization Status */}
          <div className="text-center">
            <div className="relative mb-3">
              <motion.div
                className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <optimization.icon className={`w-8 h-8 ${optimization.color}`} />
              </motion.div>
            </div>
            <p className="text-white font-medium">{optimization.title}</p>
            <p className="text-gray-400 text-sm">{optimization.action}</p>
          </div>
        </div>

        {/* Wellness Alerts */}
        {wellnessData.alerts.length > 0 && (
          <div className="mb-4">
            {wellnessData.alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-2"
              >
                <Bell className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm">{alert}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {wellnessData.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white font-medium text-sm mb-3">Wellness Recommendations</h4>
            {wellnessData.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5" />
                <span className="text-emerald-200 text-sm">{rec}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <motion.button
            className="flex-1 py-2 px-4 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Coffee className="w-4 h-4 inline mr-2" />
            Hydration Break
          </motion.button>
          
          <motion.button
            className="flex-1 py-2 px-4 bg-green-500/20 border border-green-500/30 text-green-300 rounded-xl text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sun className="w-4 h-4 inline mr-2" />
            Breathing Exercise
          </motion.button>
          
          <motion.button
            className="flex-1 py-2 px-4 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Moon className="w-4 h-4 inline mr-2" />
            Rest Mode
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}