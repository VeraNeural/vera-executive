"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Plane, 
  Coffee, 
  Utensils, 
  Car, 
  Star, 
  MapPin, 
  Clock, 
  Phone,
  Wine,
  Sparkles,
  Crown,
  Gem,
  Globe,
  Camera,
  ShoppingBag,
  Users,
  Heart,
  Music
} from "lucide-react";

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

interface LuxuryConciergeProps {
  onServiceRequest: (service: ConciergeService) => void;
  userContext: {
    location?: string;
    preferences?: string[];
    calendar?: any[];
    mood?: string;
    stressLevel?: number;
  };
  className?: string;
}

export default function LuxuryConcierge({ onServiceRequest, userContext, className = "" }: LuxuryConciergeProps) {
  const [activeServices, setActiveServices] = useState<ConciergeService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<ConciergeService[]>([]);

  // Concierge services definition
  const allServices: ConciergeService[] = [
    // Dining
    {
      id: 'restaurant-reservation',
      title: 'Private Dining Reservation',
      description: 'Secure table at Michelin-starred establishments',
      category: 'dining',
      priority: 'high',
      status: 'available',
      estimatedTime: '15 minutes',
      icon: Utensils,
      action: () => handleServiceRequest('restaurant-reservation')
    },
    {
      id: 'wine-pairing',
      title: 'Wine Curator Consultation',
      description: 'Expert sommelier pairing for client dinner',
      category: 'dining',
      priority: 'medium',
      status: 'available',
      estimatedTime: '30 minutes',
      icon: Wine,
      action: () => handleServiceRequest('wine-pairing')
    },
    
    // Travel
    {
      id: 'private-jet',
      title: 'Private Jet Charter',
      description: 'Executive aircraft booking with preferred routes',
      category: 'travel',
      priority: 'high',
      status: 'available',
      estimatedTime: '45 minutes',
      icon: Plane,
      action: () => handleServiceRequest('private-jet')
    },
    {
      id: 'luxury-transport',
      title: 'Executive Transportation',
      description: 'Premium vehicle service with security detail',
      category: 'travel',
      priority: 'medium',
      status: 'available',
      estimatedTime: '10 minutes',
      icon: Car,
      action: () => handleServiceRequest('luxury-transport')
    },
    
    // Wellness
    {
      id: 'spa-booking',
      title: 'Wellness Retreat Booking',
      description: 'Exclusive spa access when stress is detected',
      category: 'wellness',
      priority: 'high',
      status: 'available',
      estimatedTime: '20 minutes',
      icon: Heart,
      action: () => handleServiceRequest('spa-booking')
    },
    
    // Culture
    {
      id: 'art-gallery',
      title: 'Gallery Opening Invitations',
      description: 'Curated cultural events and private viewings',
      category: 'culture',
      priority: 'medium',
      status: 'available',
      estimatedTime: '5 minutes',
      icon: Camera,
      action: () => handleServiceRequest('art-gallery')
    },
    {
      id: 'fashion-week',
      title: 'Fashion Week Schedule',
      description: 'Exclusive access to runway shows and presentations',
      category: 'culture',
      priority: 'high',
      status: 'available',
      estimatedTime: '1 hour',
      icon: Crown,
      action: () => handleServiceRequest('fashion-week')
    },
    
    // Shopping
    {
      id: 'personal-shopping',
      title: 'Personal Shopping Curator',
      description: 'Luxury fashion and lifestyle consultation',
      category: 'shopping',
      priority: 'medium',
      status: 'available',
      estimatedTime: '2 hours',
      icon: ShoppingBag,
      action: () => handleServiceRequest('personal-shopping')
    },
    
    // Business
    {
      id: 'venue-booking',
      title: 'Executive Venue Booking',
      description: 'Premium locations for business meetings',
      category: 'business',
      priority: 'high',
      status: 'available',
      estimatedTime: '30 minutes',
      icon: Users,
      action: () => handleServiceRequest('venue-booking')
    }
  ];

  // Generate smart recommendations based on context
  useEffect(() => {
    const generateRecommendations = () => {
      const recs: ConciergeService[] = [];
      const currentHour = new Date().getHours();
      
      // Stress-based recommendations
      if (userContext.stressLevel && userContext.stressLevel > 70) {
        recs.push(allServices.find(s => s.id === 'spa-booking')!);
        recs.push(allServices.find(s => s.id === 'luxury-transport')!);
      }
      
      // Time-based recommendations
      if (currentHour >= 17 && currentHour <= 22) {
        recs.push(allServices.find(s => s.id === 'restaurant-reservation')!);
        recs.push(allServices.find(s => s.id === 'wine-pairing')!);
      }
      
      // Mood-based recommendations
      if (userContext.mood === 'excellent') {
        recs.push(allServices.find(s => s.id === 'art-gallery')!);
        recs.push(allServices.find(s => s.id === 'fashion-week')!);
      }
      
      // Business hours recommendations
      if (currentHour >= 9 && currentHour <= 17) {
        recs.push(allServices.find(s => s.id === 'venue-booking')!);
        recs.push(allServices.find(s => s.id === 'private-jet')!);
      }
      
      setRecommendations(recs.filter(Boolean).slice(0, 4));
    };
    
    generateRecommendations();
  }, [userContext]);

  const handleServiceRequest = (serviceId: string) => {
    const service = allServices.find(s => s.id === serviceId);
    if (service) {
      const updatedService = { ...service, status: 'booking' as const };
      setActiveServices(prev => {
        const existing = prev.find(s => s.id === serviceId);
        if (existing) {
          return prev.map(s => s.id === serviceId ? updatedService : s);
        }
        return [...prev, updatedService];
      });
      
      onServiceRequest(updatedService);
      
      // Simulate booking process
      setTimeout(() => {
        setActiveServices(prev => 
          prev.map(s => s.id === serviceId ? { ...s, status: 'confirmed' } : s)
        );
      }, 2000);
    }
  };

  const categories = [
    { id: 'all', name: 'All Services', icon: Star },
    { id: 'dining', name: 'Dining', icon: Utensils },
    { id: 'travel', name: 'Travel', icon: Plane },
    { id: 'wellness', name: 'Wellness', icon: Heart },
    { id: 'culture', name: 'Culture', icon: Camera },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBag },
    { id: 'business', name: 'Business', icon: Users }
  ];

  const filteredServices = selectedCategory === 'all' 
    ? allServices 
    : allServices.filter(s => s.category === selectedCategory);

  return (
    <motion.div 
      className={`${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-light text-white">Luxury Concierge</h3>
          </div>
          
          <div className="flex items-center gap-2 text-amber-300">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">
              {activeServices.length} Active Services
            </span>
          </div>
        </div>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Recommended for You
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((service) => (
                <motion.div
                  key={service.id}
                  className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={service.action}
                >
                  <div className="flex items-start gap-3">
                    <service.icon className="w-5 h-5 text-amber-400 mt-1" />
                    <div className="flex-1">
                      <h5 className="text-white font-medium text-sm">{service.title}</h5>
                      <p className="text-amber-200 text-xs mt-1">{service.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-300 text-xs">{service.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-amber-500/30 border border-amber-500/50 text-amber-200'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </motion.button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const activeService = activeServices.find(s => s.id === service.id);
            const isActive = !!activeService;
            
            return (
              <motion.div
                key={service.id}
                className={`p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500/20 border-amber-500/40' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={service.action}
                layout
              >
                <div className="flex items-start justify-between mb-4">
                  <service.icon className={`w-8 h-8 ${
                    isActive ? 'text-amber-400' : 'text-gray-400'
                  }`} />
                  
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activeService.status === 'booking' ? 'bg-yellow-500/20 text-yellow-300' :
                        activeService.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {activeService.status}
                    </motion.div>
                  )}
                </div>
                
                <h4 className="text-white font-medium mb-2">{service.title}</h4>
                <p className="text-gray-300 text-sm mb-4">{service.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 text-sm">{service.estimatedTime}</span>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    service.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    service.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {service.priority} priority
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Active Services Summary */}
        {activeServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-2xl"
          >
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Service Status Summary
            </h4>
            <div className="space-y-3">
              {activeServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <service.icon className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-200 text-sm">{service.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'booking' ? 'bg-yellow-400 animate-pulse' :
                      service.status === 'confirmed' ? 'bg-green-400' :
                      'bg-blue-400'
                    }`} />
                    <span className="text-emerald-300 text-sm capitalize">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}