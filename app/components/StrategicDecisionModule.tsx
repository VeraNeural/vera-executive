'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, TrendingUp, Clock, Users, AlertTriangle, Lightbulb, Calculator } from 'lucide-react';

interface DecisionFactor {
  id: string;
  category: 'pros' | 'cons';
  text: string;
  weight: number;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
}

interface Stakeholder {
  name: string;
  role: string;
  impact: 'positive' | 'negative' | 'neutral';
  influence: number;
}

interface Decision {
  id: string;
  title: string;
  description: string;
  factors: DecisionFactor[];
  stakeholders: Stakeholder[];
  roiEstimate: {
    investment: number;
    returns: number;
    timeframe: string;
  };
  fatigueScore: number;
  sleepOnItReminder?: Date;
  jobsPerspective?: string;
  finalScore: number;
  createdAt: Date;
  status: 'analyzing' | 'sleeping-on-it' | 'decided' | 'archived';
}

const StrategicDecisionModule: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [view, setView] = useState<'overview' | 'new' | 'analysis' | 'history'>('overview');
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionDescription, setDecisionDescription] = useState('');
  const [factors, setFactors] = useState<DecisionFactor[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [roiData, setRoiData] = useState({ investment: 0, returns: 0, timeframe: '6 months' });

  // Load decisions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vera-strategic-decisions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDecisions(parsed.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        sleepOnItReminder: d.sleepOnItReminder ? new Date(d.sleepOnItReminder) : undefined
      })));
    }
  }, []);

  // Save decisions to localStorage
  useEffect(() => {
    if (decisions.length > 0) {
      localStorage.setItem('vera-strategic-decisions', JSON.stringify(decisions));
    }
  }, [decisions]);

  // Decision fatigue detection
  const calculateFatigueScore = (): number => {
    const now = new Date();
    const today = now.getDate();
    const todaysDecisions = decisions.filter(d => 
      d.createdAt.getDate() === today && 
      d.createdAt.getMonth() === now.getMonth()
    ).length;
    
    const hour = now.getHours();
    const timeBonus = hour < 10 ? 0 : hour > 18 ? 30 : 10; // Higher fatigue later in day
    
    return Math.min(100, todaysDecisions * 15 + timeBonus);
  };

  // Steve Jobs perspective generator
  const generateJobsPerspective = (title: string, factors: DecisionFactor[]): string => {
    const prosCount = factors.filter(f => f.category === 'pros').length;
    const consCount = factors.filter(f => f.category === 'cons').length;
    
    const perspectives = [
      "Focus on what the user really wants, not what they say they want.",
      "Simplicity is the ultimate sophistication. Can this be simpler?",
      "Think different. Is everyone else doing this? Then maybe we shouldn't.",
      "Details are not details. They make the design. What details matter most here?",
      "Innovation distinguishes between a leader and a follower. Are we leading?",
      "Quality is more important than quantity. Better to do one thing exceptionally well.",
      "Stay hungry, stay foolish. What would the bold choice be?"
    ];
    
    if (prosCount > consCount) {
      return perspectives[Math.floor(Math.random() * 3)];
    } else {
      return perspectives[3 + Math.floor(Math.random() * 4)];
    }
  };

  // Add new factor
  const addFactor = (category: 'pros' | 'cons') => {
    const newFactor: DecisionFactor = {
      id: Date.now().toString(),
      category,
      text: '',
      weight: 5,
      impact: 'medium',
      confidence: 70
    };
    setFactors([...factors, newFactor]);
  };

  // Update factor
  const updateFactor = (id: string, updates: Partial<DecisionFactor>) => {
    setFactors(factors.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // Add stakeholder
  const addStakeholder = () => {
    const newStakeholder: Stakeholder = {
      name: '',
      role: '',
      impact: 'neutral',
      influence: 5
    };
    setStakeholders([...stakeholders, newStakeholder]);
  };

  // Calculate decision score
  const calculateDecisionScore = (factors: DecisionFactor[], roiScore: number): number => {
    const prosScore = factors
      .filter(f => f.category === 'pros')
      .reduce((sum, f) => sum + (f.weight * (f.impact === 'high' ? 3 : f.impact === 'medium' ? 2 : 1)), 0);
    
    const consScore = factors
      .filter(f => f.category === 'cons')
      .reduce((sum, f) => sum + (f.weight * (f.impact === 'high' ? 3 : f.impact === 'medium' ? 2 : 1)), 0);
    
    const baseScore = Math.max(0, Math.min(100, (prosScore - consScore) + 50));
    return Math.round((baseScore * 0.7) + (roiScore * 0.3));
  };

  // Calculate ROI score
  const calculateROIScore = (investment: number, returns: number): number => {
    if (investment === 0) return 50;
    const roi = ((returns - investment) / investment) * 100;
    return Math.max(0, Math.min(100, 50 + roi));
  };

  // Create new decision
  const createDecision = () => {
    if (!decisionTitle.trim()) return;
    
    const roiScore = calculateROIScore(roiData.investment, roiData.returns);
    const finalScore = calculateDecisionScore(factors, roiScore);
    const fatigueScore = calculateFatigueScore();
    
    const newDecision: Decision = {
      id: Date.now().toString(),
      title: decisionTitle,
      description: decisionDescription,
      factors: [...factors],
      stakeholders: [...stakeholders],
      roiEstimate: { ...roiData },
      fatigueScore,
      finalScore,
      jobsPerspective: generateJobsPerspective(decisionTitle, factors),
      createdAt: new Date(),
      status: fatigueScore > 60 ? 'sleeping-on-it' : finalScore > 70 ? 'decided' : 'analyzing',
      sleepOnItReminder: fatigueScore > 60 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
    };
    
    setDecisions([newDecision, ...decisions]);
    setCurrentDecision(newDecision);
    setView('analysis');
    
    // Reset form
    setDecisionTitle('');
    setDecisionDescription('');
    setFactors([]);
    setStakeholders([]);
    setRoiData({ investment: 0, returns: 0, timeframe: '6 months' });
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-3 rounded-full shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-4 right-4 bottom-4 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-40 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Strategic Framework</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex space-x-2 mt-4">
          {['overview', 'new', 'analysis', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                view === tab
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'overview' && (
          <div className="space-y-4">
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Decision Intelligence</h3>
              <p className="text-sm text-gray-600 mb-4">
                Advanced framework for strategic decision-making with weighted analysis and fatigue detection.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Active Decisions</div>
                <div className="text-lg font-bold text-gray-900">
                  {decisions.filter(d => d.status !== 'archived').length}
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Decision Fatigue</div>
                <div className="text-lg font-bold text-gray-900">
                  {calculateFatigueScore()}%
                </div>
              </div>
            </div>
            
            {/* Recent Decisions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recent Decisions</h4>
              {decisions.slice(0, 3).map(decision => (
                <div
                  key={decision.id}
                  onClick={() => {
                    setCurrentDecision(decision);
                    setView('analysis');
                  }}
                  className="p-3 border border-gray-200 rounded-lg mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{decision.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Score: {decision.finalScore}% • {decision.status}
                  </div>
                </div>
              ))}
              {decisions.length === 0 && (
                <p className="text-sm text-gray-500 italic">No decisions yet. Create your first one!</p>
              )}
            </div>
          </div>
        )}

        {view === 'new' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Decision Title</label>
              <input
                type="text"
                value={decisionTitle}
                onChange={(e) => setDecisionTitle(e.target.value)}
                placeholder="e.g., Launch new product line"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={decisionDescription}
                onChange={(e) => setDecisionDescription(e.target.value)}
                placeholder="Context and background..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Pros and Cons */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Factors Analysis</h4>
              
              {/* Pros */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">Pros</span>
                  <button
                    onClick={() => addFactor('pros')}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    + Add Pro
                  </button>
                </div>
                {factors.filter(f => f.category === 'pros').map(factor => (
                  <div key={factor.id} className="mb-2 p-2 bg-green-50 rounded-lg">
                    <input
                      type="text"
                      value={factor.text}
                      onChange={(e) => updateFactor(factor.id, { text: e.target.value })}
                      placeholder="Positive factor..."
                      className="w-full p-1 text-sm border-none bg-transparent focus:outline-none"
                    />
                    <div className="flex space-x-2 mt-1">
                      <select
                        value={factor.weight}
                        onChange={(e) => updateFactor(factor.id, { weight: Number(e.target.value) })}
                        className="text-xs border rounded px-1"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <select
                        value={factor.impact}
                        onChange={(e) => updateFactor(factor.id, { impact: e.target.value as any })}
                        className="text-xs border rounded px-1"
                      >
                        <option value="low">Low Impact</option>
                        <option value="medium">Medium Impact</option>
                        <option value="high">High Impact</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cons */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">Cons</span>
                  <button
                    onClick={() => addFactor('cons')}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    + Add Con
                  </button>
                </div>
                {factors.filter(f => f.category === 'cons').map(factor => (
                  <div key={factor.id} className="mb-2 p-2 bg-red-50 rounded-lg">
                    <input
                      type="text"
                      value={factor.text}
                      onChange={(e) => updateFactor(factor.id, { text: e.target.value })}
                      placeholder="Negative factor..."
                      className="w-full p-1 text-sm border-none bg-transparent focus:outline-none"
                    />
                    <div className="flex space-x-2 mt-1">
                      <select
                        value={factor.weight}
                        onChange={(e) => updateFactor(factor.id, { weight: Number(e.target.value) })}
                        className="text-xs border rounded px-1"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <select
                        value={factor.impact}
                        onChange={(e) => updateFactor(factor.id, { impact: e.target.value as any })}
                        className="text-xs border rounded px-1"
                      >
                        <option value="low">Low Impact</option>
                        <option value="medium">Medium Impact</option>
                        <option value="high">High Impact</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Calculator */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                ROI Analysis
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Investment ($)</label>
                  <input
                    type="number"
                    value={roiData.investment}
                    onChange={(e) => setRoiData({ ...roiData, investment: Number(e.target.value) })}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Expected Returns ($)</label>
                  <input
                    type="number"
                    value={roiData.returns}
                    onChange={(e) => setRoiData({ ...roiData, returns: Number(e.target.value) })}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs text-gray-600 mb-1">Timeframe</label>
                <select
                  value={roiData.timeframe}
                  onChange={(e) => setRoiData({ ...roiData, timeframe: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                >
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="1 year">1 year</option>
                  <option value="2 years">2 years</option>
                  <option value="3+ years">3+ years</option>
                </select>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={createDecision}
              disabled={!decisionTitle.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white p-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-blue-700 transition-colors"
            >
              Analyze Decision
            </button>
          </div>
        )}

        {view === 'analysis' && currentDecision && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentDecision.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{currentDecision.description}</p>
            </div>

            {/* Decision Score */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Decision Score</span>
                <span className="text-2xl font-bold text-purple-600">{currentDecision.finalScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentDecision.finalScore}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                {currentDecision.finalScore > 80 ? 'Highly Recommended' :
                 currentDecision.finalScore > 60 ? 'Recommended with Caution' :
                 currentDecision.finalScore > 40 ? 'Neutral - More Analysis Needed' :
                 'Not Recommended'}
              </div>
            </div>

            {/* Jobs Perspective */}
            {currentDecision.jobsPerspective && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Jobs Perspective</span>
                </div>
                <p className="text-sm text-gray-800 italic">"{currentDecision.jobsPerspective}"</p>
              </div>
            )}

            {/* Fatigue Warning */}
            {currentDecision.fatigueScore > 60 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                  <span className="text-sm font-medium text-amber-800">Decision Fatigue Detected</span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Consider sleeping on this decision. High fatigue level: {currentDecision.fatigueScore}%
                </p>
                {currentDecision.sleepOnItReminder && (
                  <p className="text-xs text-amber-600 mt-1">
                    Reminder set for: {currentDecision.sleepOnItReminder.toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* ROI Analysis */}
            <div className="border border-gray-200 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                ROI Analysis
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Investment: ${currentDecision.roiEstimate.investment.toLocaleString()}</div>
                <div>Expected Returns: ${currentDecision.roiEstimate.returns.toLocaleString()}</div>
                <div>Timeframe: {currentDecision.roiEstimate.timeframe}</div>
                <div className="font-medium text-gray-900">
                  ROI: {currentDecision.roiEstimate.investment > 0 ? 
                    `${(((currentDecision.roiEstimate.returns - currentDecision.roiEstimate.investment) / currentDecision.roiEstimate.investment) * 100).toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
              </div>
            </div>

            {/* Factors Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Factors Analysis</h4>
              
              {currentDecision.factors.filter(f => f.category === 'pros').length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-green-700 mb-2">Pros</div>
                  {currentDecision.factors.filter(f => f.category === 'pros').map(factor => (
                    <div key={factor.id} className="bg-green-50 p-2 rounded mb-1 text-sm">
                      <div className="text-gray-800">{factor.text}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Weight: {factor.weight}/10 • Impact: {factor.impact}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {currentDecision.factors.filter(f => f.category === 'cons').length > 0 && (
                <div>
                  <div className="text-sm font-medium text-red-700 mb-2">Cons</div>
                  {currentDecision.factors.filter(f => f.category === 'cons').map(factor => (
                    <div key={factor.id} className="bg-red-50 p-2 rounded mb-1 text-sm">
                      <div className="text-gray-800">{factor.text}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Weight: {factor.weight}/10 • Impact: {factor.impact}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Decision History</h3>
            {decisions.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-8">
                No decisions in history yet.
              </p>
            ) : (
              decisions.map(decision => (
                <div
                  key={decision.id}
                  onClick={() => {
                    setCurrentDecision(decision);
                    setView('analysis');
                  }}
                  className="border border-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-gray-900">{decision.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      decision.status === 'decided' ? 'bg-green-100 text-green-700' :
                      decision.status === 'sleeping-on-it' ? 'bg-yellow-100 text-yellow-700' :
                      decision.status === 'analyzing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {decision.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Score: {decision.finalScore}% • Fatigue: {decision.fatigueScore}%</div>
                    <div>{decision.createdAt.toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StrategicDecisionModule;