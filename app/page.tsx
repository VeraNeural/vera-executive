'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'vera';
  content: string;
  timestamp: Date;
}

// Add bounce animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export default function VeraExecutive() {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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

    // Simulate VERA thinking and responding
    setTimeout(() => {
      const veraMsg: Message = {
        id: `vera-${Date.now()}`,
        role: 'vera',
        content: `I understand you'd like to: "${userMsg.content}". I'm here to help you with executive decisions, strategic planning, and personal wellness. How can I assist you further?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, veraMsg]);
      setIsThinking(false);
    }, 1500);
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
      background: 'linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%)',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }}>
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
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>V</span>
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
      <main style={{ 
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
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '32px' }}>V</span>
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
                      borderRadius: '16px',
                      padding: '12px 20px',
                      background: msg.role === 'user' ? '#7c3aed' : '#2a2a2a',
                      color: '#fff'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        {msg.role === 'vera' && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '4px'
                          }}>
                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>V</span>
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
                            {msg.content}
                          </p>
                          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>
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
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>V</span>
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
          borderTop: '1px solid #333',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          padding: '16px 24px',
          flexShrink: 0
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
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
                    background: '#2a2a2a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    resize: 'none',
                    minHeight: '48px',
                    maxHeight: '120px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || isThinking}
                style={{
                  padding: '12px 24px',
                  background: (!message.trim() || isThinking) ? '#444' : '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '500',
                  cursor: (!message.trim() || isThinking) ? 'not-allowed' : 'pointer',
                  height: '48px',
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => {
                  if (!(!message.trim() || isThinking)) {
                    e.currentTarget.style.background = '#6d28d9';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!message.trim() || isThinking)) {
                    e.currentTarget.style.background = '#7c3aed';
                  }
                }}
              >
                Send
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
              VERA Executive Intelligence v1.0
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}