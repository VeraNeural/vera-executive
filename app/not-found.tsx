'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <motion.div 
        className="content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="error-code">404</div>
        <h1 className="title">Page Not Located</h1>
        <p className="message">
          This route does not exist in VERA's system.
        </p>
        <Link href="/" className="home-link">
          RETURN TO VERA
        </Link>
      </motion.div>

      <style jsx>{`
        .not-found-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .content {
          text-align: center;
          max-width: 500px;
          padding: 48px;
        }

        .error-code {
          font-size: 80px;
          font-weight: 100;
          letter-spacing: 10px;
          color: rgba(138, 43, 226, 0.3);
          margin-bottom: 24px;
        }

        .title {
          font-size: 24px;
          font-weight: 200;
          letter-spacing: 3px;
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .message {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .home-link {
          display: inline-block;
          padding: 12px 32px;
          background: rgba(138, 43, 226, 0.2);
          border: 0.5px solid rgba(138, 43, 226, 0.4);
          border-radius: 4px;
          color: #FFFFFF;
          text-decoration: none;
          font-size: 12px;
          letter-spacing: 2px;
          transition: all 0.3s;
          text-transform: uppercase;
        }

        .home-link:hover {
          background: rgba(138, 43, 226, 0.3);
          border-color: rgba(138, 43, 226, 0.5);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}