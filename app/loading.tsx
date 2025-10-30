'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="loading-content">
        <div className="vera-orb-container">
          <motion.div
            className="orb-core"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="orb-ring"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="orb-ring"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2
            }}
          />
        </div>

        <motion.div 
          className="loading-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="sr-only">Loading VERA Executive Intelligence</span>
          <div className="loading-status">CALIBRATING</div>
        </motion.div>

        <div className="loading-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 0 
              }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                width: '2px',
                height: '2px',
                borderRadius: '50%',
                background: 'rgba(138, 43, 226, 0.6)',
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .loading-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .vera-orb-container {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .orb-core {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(138, 43, 226, 0.8) 0%,
            rgba(138, 43, 226, 0.4) 40%,
            transparent 70%
          );
          filter: blur(2px);
        }

        .orb-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid rgba(138, 43, 226, 0.3);
        }

        .loading-text {
          text-align: center;
        }

        .loading-status {
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 4px;
          color: rgba(138, 43, 226, 0.8);
          text-transform: uppercase;
        }

        .loading-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}