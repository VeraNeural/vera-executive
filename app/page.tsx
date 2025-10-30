'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'vera';
  content: string;
  timestamp: Date;
}

// Add breathing orb animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    @keyframes breathe {
      0%, 100% { 
        transform: scale(1);
        box-shadow: 0 0 20px rgba(124, 58, 237, 0.4),
                    0 0 40px rgba(124, 58, 237, 0.2),
                    0 0 60px rgba(124, 58, 237, 0.1);
        filter: brightness(1);
      }
      50% { 
        transform: scale(1.15);
        box-shadow: 0 0 40px rgba(124, 58, 237, 0.7),
                    0 0 80px rgba(124, 58, 237, 0.5),
                    0 0 120px rgba(124, 58, 237, 0.3);
        filter: brightness(1.3);
      }
    }
    
    @keyframes pulse-ring {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }
    
    @keyframes slideInRight {
      0% {
        transform: translateX(100%);
        opacity: 0;
      }
      100% {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .breathing-orb {
      animation: breathe 4s ease-in-out infinite;
      position: relative;
    }
    
    .breathing-orb::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(124, 58, 237, 0.5);
      animation: pulse-ring 2s ease-out infinite;
    }
    
    .breathing-orb::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid rgba(124, 58, 237, 0.3);
      animation: pulse-ring 2s ease-out infinite 1s;
    }
  `;
  document.head.appendChild(style);
}

export default function VeraExecutive() {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Initialize audio element
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setIsThinking(true);

    try {
      // Call VERA API with real AI integration
      const response = await fetch('/api/vera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.content,
          mode: 'executive',
          context: {
            energy: 'medium',
            currentTime: new Date().toISOString(),
            recentMessages: messages.slice(-3).map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        }),
      });

      const data = await response.json();
      
      const veraMsg: Message = {
        id: `vera-${Date.now()}`,
        role: 'vera',
        content: data.response || 'Processing...',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, veraMsg]);

      // Generate voice response with ElevenLabs
      if (voiceEnabled && data.response) {
        await speakText(data.response);
      }
    } catch (error) {
      console.error('VERA error:', error);
      const errorMsg: Message = {
        id: `vera-${Date.now()}`,
        role: 'vera',
        content: 'System recalibration in progress. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Voice error:', error);
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff', fontSize: '20px' }}>Initializing VERA...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 25%, #0d0520 50%, #1a0a1a 75%, #0a0a0a 100%)',
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '60px',
        background: 'linear-gradient(180deg, rgba(20, 10, 30, 0.95) 0%, rgba(10, 5, 20, 0.98) 100%)',
        borderRight: '1px solid rgba(124, 58, 237, 0.2)',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        backdropFilter: 'blur(20px)',
        boxShadow: sidebarOpen ? '0 0 40px rgba(124, 58, 237, 0.15)' : 'none'
      }}>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '-15px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            border: '2px solid rgba(10, 10, 10, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)'
          }}
        >
          <span style={{ color: '#fff', fontSize: '14px' }}>
            {sidebarOpen ? '←' : '→'}
          </span>
        </button>

        {/* Sidebar Content */}
        <div style={{ padding: '24px 16px', flex: 1, overflowY: 'auto' }}>
          {/* VERA Branding */}
          <div style={{ 
            marginBottom: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}>
            <div 
              className="breathing-orb"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.9), rgba(124, 58, 237, 0.95), rgba(91, 33, 182, 1))',
                flexShrink: 0,
                position: 'relative'
              }}>
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '60%',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent)',
                top: '15%',
                left: '15%'
              }}></div>
            </div>
            {sidebarOpen && (
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>VERA</h2>
                <p style={{ color: '#a78bfa', fontSize: '11px', margin: 0 }}>Neural Intelligence</p>
              </div>
            )}
          </div>

          {/* Feature Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Email', id: 'email', color: '#7c3aed', glow: 'rgba(124, 58, 237, 0.4)' },
              { label: 'Calendar', id: 'calendar', color: '#c9a961', glow: 'rgba(201, 169, 97, 0.4)' },
              { label: 'Design', id: 'design', color: '#ff69b4', glow: 'rgba(255, 105, 180, 0.4)' },
              { label: 'Biometrics', id: 'biometrics', color: '#00ced1', glow: 'rgba(0, 206, 209, 0.4)' },
              { label: 'Decisions', id: 'decision', color: '#ff4500', glow: 'rgba(255, 69, 0, 0.4)' },
              { label: 'Settings', id: 'settings', color: '#888', glow: 'rgba(136, 136, 136, 0.4)' },
            ].map((panel) => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: activePanel === panel.id 
                    ? `linear-gradient(135deg, ${panel.color}33 0%, ${panel.color}11 100%)` 
                    : 'transparent',
                  border: `1px solid ${activePanel === panel.id ? panel.color + '55' : 'transparent'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: activePanel === panel.id ? panel.color : '#999',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  width: '100%'
                }}
                onMouseOver={(e) => {
                  if (activePanel !== panel.id) {
                    e.currentTarget.style.background = `${panel.color}11`;
                    e.currentTarget.style.borderColor = `${panel.color}33`;
                  }
                }}
                onMouseOut={(e) => {
                  if (activePanel !== panel.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {/* Neuron/Orb Icon */}
                <div 
                  className={activePanel === panel.id ? 'breathing-orb' : ''}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${panel.color}dd, ${panel.color}aa, ${panel.color})`,
                    flexShrink: 0,
                    position: 'relative',
                    boxShadow: activePanel === panel.id 
                      ? `0 0 15px ${panel.glow}, 0 0 25px ${panel.glow}` 
                      : `0 0 8px ${panel.glow}`,
                    transition: 'all 0.3s'
                  }}>
                  <div style={{
                    position: 'absolute',
                    width: '50%',
                    height: '50%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), transparent)',
                    top: '15%',
                    left: '15%'
                  }}></div>
                  {/* Neural connections when active */}
                  {activePanel === panel.id && (
                    <>
                      <div style={{
                        position: 'absolute',
                        width: '1px',
                        height: '8px',
                        background: `linear-gradient(180deg, ${panel.color}, transparent)`,
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        opacity: 0.6
                      }}></div>
                      <div style={{
                        position: 'absolute',
                        width: '1px',
                        height: '8px',
                        background: `linear-gradient(0deg, ${panel.color}, transparent)`,
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        opacity: 0.6
                      }}></div>
                    </>
                  )}
                </div>
                {sidebarOpen && (
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{panel.label}</span>
                )}
              </button>
            ))}
          </div>

          {/* Voice Toggle */}
          {sidebarOpen && (
            <div style={{
              marginTop: '32px',
              padding: '16px',
              background: 'rgba(124, 58, 237, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(124, 58, 237, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: voiceEnabled 
                      ? 'radial-gradient(circle at 30% 30%, #a78bfa, #7c3aed, #5b21b6)'
                      : 'radial-gradient(circle at 30% 30%, #555, #333, #222)',
                    boxShadow: voiceEnabled ? '0 0 10px rgba(124, 58, 237, 0.5)' : 'none',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      width: '50%',
                      height: '50%',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), transparent)',
                      top: '15%',
                      left: '15%'
                    }}></div>
                  </div>
                  <span style={{ color: '#a78bfa', fontSize: '13px', fontWeight: '500' }}>Voice</span>
                </div>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  style={{
                    width: '40px',
                    height: '20px',
                    borderRadius: '10px',
                    background: voiceEnabled ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : '#333',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: voiceEnabled ? '22px' : '2px',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}></div>
                </button>
              </div>
              {isSpeaking && (
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '12px',
                  height: '24px'
                }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #a78bfa, #7c3aed)',
                        animation: 'bounce 1.2s infinite ease-in-out',
                        animationDelay: `${i * 0.1}s`,
                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)'
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Active Panel Overlay */}
        {activePanel && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '400px',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(20, 10, 30, 0.98) 0%, rgba(10, 5, 20, 0.99) 100%)',
              borderLeft: '1px solid rgba(124, 58, 237, 0.3)',
              backdropFilter: 'blur(20px)',
              zIndex: 50,
              boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5)',
              animation: 'slideInRight 0.3s ease-out',
              overflow: 'auto'
            }}
          >
            {/* Panel Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, ${
                    activePanel === 'email' ? '#7c3aeddd' :
                    activePanel === 'calendar' ? '#c9a961dd' :
                    activePanel === 'design' ? '#ff69b4dd' :
                    activePanel === 'biometrics' ? '#00ced1dd' :
                    activePanel === 'decision' ? '#ff4500dd' : '#888dd'
                  }, ${
                    activePanel === 'email' ? '#7c3aed' :
                    activePanel === 'calendar' ? '#c9a961' :
                    activePanel === 'design' ? '#ff69b4' :
                    activePanel === 'biometrics' ? '#00ced1' :
                    activePanel === 'decision' ? '#ff4500' : '#888'
                  })`,
                  boxShadow: `0 0 20px ${
                    activePanel === 'email' ? 'rgba(124, 58, 237, 0.4)' :
                    activePanel === 'calendar' ? 'rgba(201, 169, 97, 0.4)' :
                    activePanel === 'design' ? 'rgba(255, 105, 180, 0.4)' :
                    activePanel === 'biometrics' ? 'rgba(0, 206, 209, 0.4)' :
                    activePanel === 'decision' ? 'rgba(255, 69, 0, 0.4)' : 'rgba(136, 136, 136, 0.4)'
                  }`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    width: '50%',
                    height: '50%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), transparent)',
                    top: '15%',
                    left: '15%'
                  }}></div>
                </div>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0, textTransform: 'capitalize' }}>
                  {activePanel}
                </h2>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ×
              </button>
            </div>

            {/* Panel Content */}
            <div style={{ padding: '24px' }}>
              {activePanel === 'email' && (
                <div style={{ color: '#fff' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#7c3aed' }}>
                    Email Intelligence
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { 
                        from: 'Sarah Chen', 
                        email: 'sarah@veraneural.com',
                        subject: 'Q4 Strategy Review - Board Approval Needed', 
                        preview: 'Hi Julija, I have prepared the Q4 strategic overview. We need your sign-off before Thursday...',
                        time: '10 min ago', 
                        urgent: true,
                        attachments: 2 
                      },
                      { 
                        from: 'Marcus Rodriguez', 
                        email: 'marcus.r@investor-group.com',
                        subject: 'Board Meeting Prep - Financial Projections', 
                        preview: 'Attached are the updated financial models for Q1 2026. Please review the growth assumptions...',
                        time: '1 hour ago', 
                        urgent: false,
                        attachments: 5 
                      },
                      { 
                        from: 'Design Team', 
                        email: 'design@veraneural.com',
                        subject: 'New Brand Guidelines & Mockups Ready', 
                        preview: 'The new visual identity is complete. We have included 3 variations for your review...',
                        time: '2 hours ago', 
                        urgent: false,
                        attachments: 12 
                      },
                    ].map((email, i) => (
                      <div key={i} style={{
                        padding: '18px',
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: `1px solid ${email.urgent ? 'rgba(255, 69, 0, 0.4)' : 'rgba(124, 58, 237, 0.25)'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        position: 'relative'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                      >
                        {email.urgent && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ff4500',
                            boxShadow: '0 0 10px rgba(255, 69, 0, 0.6)',
                            animation: 'breathe 2s ease-in-out infinite'
                          }}></div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{email.from}</div>
                            <div style={{ fontSize: '11px', color: '#999' }}>{email.email}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '500' }}>{email.time}</div>
                            {email.attachments > 0 && (
                              <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                {email.attachments} files
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#ccc', fontWeight: '500', marginBottom: '6px' }}>
                          {email.subject}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
                          {email.preview}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'calendar' && (
                <div style={{ color: '#fff' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#c9a961' }}>
                    Executive Calendar
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { title: 'Board Meeting', time: '14:00 - 15:30', attendees: 8 },
                      { title: 'Design Review', time: '16:00 - 16:45', attendees: 3 },
                      { title: 'Investor Call', time: '17:00 - 17:30', attendees: 2 },
                    ].map((event, i) => (
                      <div key={i} style={{
                        padding: '16px',
                        background: 'rgba(201, 169, 97, 0.1)',
                        border: '1px solid rgba(201, 169, 97, 0.2)',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{event.title}</div>
                        <div style={{ fontSize: '13px', color: '#c9a961' }}>{event.time}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          {event.attendees} attendees
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'design' && (
                <div style={{ color: '#fff' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#ff69b4' }}>
                    Design System
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {['#7c3aed', '#c9a961', '#ff69b4', '#00ced1', '#ff4500', '#a78bfa'].map((color, i) => (
                      <div key={i} style={{
                        height: '80px',
                        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        {color}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'biometrics' && (
                <div style={{ color: '#fff' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#00ced1' }}>
                    Wellness Metrics
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Heart Rate', value: '72 BPM', status: 'optimal' },
                      { label: 'Stress Level', value: 'Low', status: 'good' },
                      { label: 'Focus Score', value: '85%', status: 'high' },
                      { label: 'Energy', value: 'Moderate', status: 'moderate' },
                    ].map((metric, i) => (
                      <div key={i} style={{
                        padding: '16px',
                        background: 'rgba(0, 206, 209, 0.1)',
                        border: '1px solid rgba(0, 206, 209, 0.2)',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{metric.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#00ced1' }}>{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'decision' && (
                <div style={{ color: '#fff' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#ff4500' }}>
                    Strategic Decisions
                  </h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#ccc' }}>
                    <p>Decision matrix and strategic analysis tools coming soon...</p>
                    <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255, 69, 0, 0.1)', border: '1px solid rgba(255, 69, 0, 0.2)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Active Decisions</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>• Q4 Budget Allocation</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>• New Hire Approvals</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>• Product Roadmap</div>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'settings' && (
                <div style={{ color: '#fff' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#888' }}>
                    System Settings
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'AI Model', value: 'Claude 3 Sonnet' },
                      { label: 'Voice', value: 'ElevenLabs Premium' },
                      { label: 'Theme', value: 'Neural Dark' },
                      { label: 'Notifications', value: 'Executive Mode' },
                    ].map((setting, i) => (
                      <div key={i} style={{
                        padding: '16px',
                        background: 'rgba(136, 136, 136, 0.1)',
                        border: '1px solid rgba(136, 136, 136, 0.2)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '14px' }}>{setting.label}</span>
                        <span style={{ fontSize: '13px', color: '#999' }}>{setting.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #333',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        padding: '16px 24px',
        flexShrink: 0
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              className="breathing-orb"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.9), rgba(124, 58, 237, 0.95), rgba(91, 33, 182, 1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '60%',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent)',
                top: '15%',
                left: '15%'
              }}></div>
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '600', margin: 0 }}>VERA</h1>
              <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Executive Intelligence</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#999' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%'
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            {messages.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '60vh', 
                textAlign: 'center' 
              }}>
                <div 
                  className="breathing-orb"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.9), rgba(124, 58, 237, 0.95), rgba(91, 33, 182, 1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    position: 'relative'
                  }}>
                  <div style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent)',
                    top: '15%',
                    left: '15%'
                  }}></div>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: '300', color: '#fff', marginBottom: '12px' }}>
                  Welcome to VERA
                </h2>
                <p style={{ color: '#999', maxWidth: '500px', marginBottom: '32px' }}>
                  Your Executive Intelligence system. I'm here to help with strategic decisions, 
                  time management, wellness optimization, and executive support.
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '12px', 
                  width: '100%', 
                  maxWidth: '700px' 
                }}>
                  {[
                    'Optimize my calendar for tomorrow',
                    'Brief me on today\'s priorities',
                    'Design thinking session prep',
                    'Check my wellness metrics',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(suggestion)}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(60, 60, 60, 0.5)',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#ccc',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(80, 80, 80, 0.5)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(60, 60, 60, 0.5)'}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      maxWidth: '600px',
                      borderRadius: '20px',
                      padding: '16px 24px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(201, 169, 97, 0.25) 0%, rgba(184, 149, 80, 0.2) 50%, rgba(167, 133, 64, 0.18) 100%)'
                        : 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(91, 33, 182, 0.1) 100%)',
                      color: msg.role === 'user' ? '#e8d4a0' : '#fff',
                      border: msg.role === 'user' 
                        ? '1px solid rgba(201, 169, 97, 0.25)'
                        : '1px solid rgba(124, 58, 237, 0.3)',
                      boxShadow: msg.role === 'user'
                        ? '0 4px 24px rgba(201, 169, 97, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                        : '0 8px 32px rgba(124, 58, 237, 0.2)',
                      position: 'relative',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {/* Luxury shine effect */}
                      {msg.role === 'user' && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                          borderRadius: '20px 20px 0 0',
                          pointerEvents: 'none'
                        }}></div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        {msg.role === 'vera' && (
                          <div 
                            className="breathing-orb"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.9), rgba(124, 58, 237, 0.95), rgba(91, 33, 182, 1))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px',
                              position: 'relative'
                            }}>
                            <div style={{
                              position: 'absolute',
                              width: '60%',
                              height: '60%',
                              borderRadius: '50%',
                              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent)',
                              top: '15%',
                              left: '15%'
                            }}></div>
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          {msg.role === 'user' && (
                            <div style={{ 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              marginBottom: '6px',
                              color: 'rgba(201, 169, 97, 0.7)',
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase'
                            }}>
                              Julija • CEO
                            </div>
                          )}
                          {msg.role === 'vera' && (
                            <div style={{ 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              marginBottom: '6px',
                              color: '#a78bfa',
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase'
                            }}>
                              VERA Neural
                            </div>
                          )}
                          <p style={{ 
                            fontSize: '15px', 
                            lineHeight: '1.7', 
                            whiteSpace: 'pre-wrap', 
                            margin: 0,
                            fontWeight: msg.role === 'user' ? '500' : '400'
                          }}>
                            {msg.content}
                          </p>
                          <div style={{ 
                            fontSize: '11px', 
                            opacity: 0.5, 
                            marginTop: '8px',
                            fontWeight: '500',
                            letterSpacing: '0.3px'
                          }}>
                            {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ maxWidth: '600px', borderRadius: '16px', padding: '12px 20px', background: '#2a2a2a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div 
                          className="breathing-orb"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.9), rgba(124, 58, 237, 0.95), rgba(91, 33, 182, 1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                          <div style={{
                            position: 'absolute',
                            width: '60%',
                            height: '60%',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent)',
                            top: '15%',
                            left: '15%'
                          }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <div style={{ width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                          <div style={{ width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}></div>
                          <div style={{ width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div style={{
          borderTop: '1px solid rgba(124, 58, 237, 0.3)',
          background: 'linear-gradient(180deg, rgba(20, 10, 30, 0.5) 0%, rgba(10, 5, 20, 0.8) 100%)',
          backdropFilter: 'blur(20px)',
          padding: '20px 24px',
          flexShrink: 0,
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              {/* Breathing Orb Input Icon */}
              <div 
                className="breathing-orb"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.9), rgba(124, 58, 237, 0.95), rgba(91, 33, 182, 1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                  boxShadow: '0 0 30px rgba(124, 58, 237, 0.6), 0 0 60px rgba(124, 58, 237, 0.3)',
                }}>
                <div style={{
                  position: 'absolute',
                  width: '60%',
                  height: '60%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5), transparent)',
                  top: '15%',
                  left: '15%'
                }}></div>
              </div>
              
              <div style={{ flex: 1 }}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask VERA anything..."
                  disabled={isThinking}
                  rows={1}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(40, 40, 60, 0.6) 0%, rgba(30, 30, 50, 0.8) 100%)',
                    color: '#fff',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '16px',
                    padding: '14px 20px',
                    fontSize: '15px',
                    resize: 'none',
                    minHeight: '48px',
                    maxHeight: '120px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(124, 58, 237, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.6)';
                    e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 30px rgba(124, 58, 237, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
                    e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(124, 58, 237, 0.1)';
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || isThinking}
                style={{
                  padding: '14px 28px',
                  background: (!message.trim() || isThinking) 
                    ? 'linear-gradient(135deg, #333, #222)' 
                    : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
                  color: '#fff',
                  border: (!message.trim() || isThinking) 
                    ? '1px solid #444' 
                    : '1px solid rgba(124, 58, 237, 0.5)',
                  borderRadius: '16px',
                  fontWeight: '600',
                  cursor: (!message.trim() || isThinking) ? 'not-allowed' : 'pointer',
                  height: '48px',
                  transition: 'all 0.3s',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  boxShadow: (!message.trim() || isThinking) 
                    ? 'none' 
                    : '0 4px 20px rgba(124, 58, 237, 0.4)',
                }}
                onMouseOver={(e) => {
                  if (!(!message.trim() || isThinking)) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)';
                    e.currentTarget.style.boxShadow = '0 6px 30px rgba(124, 58, 237, 0.6)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!message.trim() || isThinking)) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.4)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Send
              </button>
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '8px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span>VERA Executive Intelligence v2.0</span>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: voiceEnabled 
                  ? 'radial-gradient(circle, #7c3aed, #5b21b6)'
                  : 'radial-gradient(circle, #444, #222)',
                boxShadow: voiceEnabled ? '0 0 6px rgba(124, 58, 237, 0.6)' : 'none'
              }}></div>
              <span style={{ color: voiceEnabled ? '#7c3aed' : '#444', fontSize: '11px' }}>
                {voiceEnabled ? 'Voice Active' : 'Voice Off'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}