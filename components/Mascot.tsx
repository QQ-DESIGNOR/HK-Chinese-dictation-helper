import React from 'react';
import { motion } from 'framer-motion';
import { RobotEmotion } from '../types';

interface MascotProps {
  emotion: RobotEmotion;
  onClick?: () => void;
}

const Mascot: React.FC<MascotProps> = ({ emotion, onClick }) => {
  // Animation variants
  const eyeVariants = {
    idle: { scaleY: [1, 1, 0.1, 1], transition: { repeat: Infinity, repeatDelay: 3, duration: 0.5 } },
    happy: { scaleY: 1, scaleX: 1.1, rotate: [0, 5, -5, 0], transition: { repeat: Infinity, duration: 0.5 } },
    thinking: { scale: 0.9, rotate: 10, transition: { duration: 0.5 } },
    speaking: { scaleY: [1, 1.2, 0.9, 1], transition: { repeat: Infinity, duration: 0.3 } },
    sad: { scaleY: 0.5, rotate: -10 },
  };

  const bodyVariants = {
    idle: { y: [0, -5, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    happy: { y: [0, -15, 0], transition: { repeat: Infinity, duration: 0.4, type: 'spring' } },
    speaking: { rotate: [0, 2, -2, 0], transition: { repeat: Infinity, duration: 0.2 } },
    thinking: { y: 0 },
    sad: { y: 10 },
  };

  // Color mapping
  const eyeColor = emotion === 'happy' ? '#10B981' : emotion === 'sad' ? '#EF4444' : '#3B82F6';

  return (
    <motion.div 
      className="relative w-48 h-48 cursor-pointer"
      onClick={onClick}
      animate={bodyVariants[emotion]}
    >
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Antenna */}
        <motion.path d="M100 50L100 20" stroke="#64748B" strokeWidth="8" strokeLinecap="round" />
        <circle cx="100" cy="15" r="10" fill={emotion === 'thinking' ? '#F59E0B' : '#EF4444'} />

        {/* Head */}
        <rect x="50" y="50" width="100" height="90" rx="20" fill="white" stroke="#334155" strokeWidth="4" />
        
        {/* Screen/Face Area */}
        <rect x="60" y="65" width="80" height="60" rx="10" fill="#E2E8F0" />

        {/* Eyes */}
        <motion.g animate={eyeVariants[emotion]} style={{ originX: "50%", originY: "50%" }}>
          <circle cx="80" cy="95" r="8" fill={eyeColor} />
          <circle cx="120" cy="95" r="8" fill={eyeColor} />
        </motion.g>

        {/* Mouth */}
        {emotion === 'speaking' ? (
           <motion.ellipse cx="100" cy="110" rx="10" ry="5" fill="#334155" 
             animate={{ ry: [2, 8, 2] }} transition={{ repeat: Infinity, duration: 0.3 }}
           />
        ) : emotion === 'happy' ? (
           <path d="M85 110 Q100 120 115 110" stroke="#334155" strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : emotion === 'sad' ? (
           <path d="M85 115 Q100 105 115 115" stroke="#334155" strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : (
           <line x1="90" y1="110" x2="110" y2="110" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Body (Simple) */}
        <path d="M60 140L50 190H150L140 140" fill="#94A3B8" stroke="#334155" strokeWidth="4" />
      </svg>
      
      {/* Speech Bubble effect if speaking */}
      {emotion === 'speaking' && (
        <motion.div 
          className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-sm border border-gray-200"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-xl">🔊</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Mascot;