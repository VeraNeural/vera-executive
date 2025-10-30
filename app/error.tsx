'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('VERA Error:', error);
    
    // Send error report if critical
    if (error.message.includes('API') || error.message.includes('critical')) {
      // In production, send to error tracking service
      sendErrorReport(error);
    }
  }, [error]);

  const sendErrorReport = (error: Error) => {
    // Would integrate with Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      user: 'Julija',
      severity: determineSeverity(error.message)
    };
    
    // Save to localStorage for now
    const reports = JSON.parse(localStorage.getItem('vera-error-reports') || '[]');
    reports.push(errorReport);
    localStorage.setItem('vera-error-reports', JSON.stringify(reports.slice(-50)));
  };

  const determineSeverity = (message: string): string => {
    if (message.includes('critical') || message.includes('API')) return 'high';
    if (message.includes('network') || message.includes('timeout')) return 'medium';
    return 'low';
  };

  const handleReset = () => {
    // Clear any problematic state
    localStorage.removeItem('vera-temp-state');
    reset();
  };

  return (
    <div className="error-container" role="alert" aria-live="assertive">
      <motion.div 
        className="error-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="error-orb">
          <motion.div
            className="orb-pulse"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </div>

        <h1 className="error-title">System Recalibration Required</h1>
        
        <div className="error-details">
          <div className="error-message">
            {error.message === 'Failed to fetch' 
              ? 'Network connection issue detected.'
              : error.message.includes('API')
              ? 'API connection interrupted.'
              : 'Unexpected system state encountered.'}
          </div>
          
          {error.digest && (
            <div className="error-code">
              Reference: {error.digest}
            </div>
          )}
        </div>

        <div className="error-actions">
          <button 
            onClick={handleReset}
            className="reset-btn primary"
            aria-label="Reset system"
          >
            RESET SYSTEM
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="reset-btn secondary"
            aria-label="Full reload"
          >
            FULL RELOAD
          </button>
        </div>

        <div className="error-help">
          <p>If this persists, Eva has been notified.</p>
        </div>
      </motion.div>

      <style jsx>{`
        .error-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: #FFFFFF;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .error-content {
          max-width: 600px;
          text-align: center;
        }

        .error-orb {
          width: 80px;
          height: 80px;
          margin: 0 auto 32px;
          position: relative;
        }

        .orb-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 68, 68, 0.4) 0%,
            transparent 70%
          );
        }

        .error-title {
          font-size: 24px;
          font-weight: 200;
          letter-spacing: 3px;
          margin-bottom: 24px;
          text-transform: uppercase;
        }

        .error-details {
          margin-bottom: 32px;
        }

        .error-message {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 16px;
        }

        .error-code {
          font-size: 12px;
          font-family: monospace;
          color: rgba(138, 43, 226, 0.6);
          background: rgba(138, 43, 226, 0.1);
          padding: 8px 16px;
          border-radius: 4px;
          display: inline-block;
        }

        .error-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .reset-btn {
          padding: 12px 32px;
          background: rgba(255, 255, 255, 0.05);
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: #FFFFFF;
          font-size: 12px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          font-weight: 400;
        }

        .reset-btn.primary {
          background: rgba(138, 43, 226, 0.2);
          border-color: rgba(138, 43, 226, 0.4);
        }

        .reset-btn:hover {
          background: rgba(138, 43, 226, 0.3);
          border-color: rgba(138, 43, 226, 0.5);
          transform: translateY(-1px);
        }

        .error-help {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 768px) {
          .error-container {
            padding: 24px;
          }

          .error-actions {
            flex-direction: column;
            width: 100%;
          }

          .reset-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}