import React from 'react';
import { motion } from 'framer-motion';

export default function KashiMascot({ stage = 0, className = "w-full h-full" }) {
  // Return different SVG configurations or animated states based on the stage:
  // 0: Waving (Ethical Sourcing)
  // 1: Shades (Sun-Drying)
  // 2: Shivering (Cryo Milling)
  // 3: Cooking (Ghee Roasting)
  // 4: Packaging (Nitrogen Pack)
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
        animate={
          stage === 2 
            ? { x: [-2, 2, -2, 2, -2], y: [-1, 1, -1, 1, -1] } // Shivering
            : stage === 3
            ? { y: [0, -10, 0], scaleY: [1, 0.95, 1.05, 1] } // Dancing/Cooking
            : { y: [0, -4, 0] }
        }
        transition={
          stage === 2 
            ? { repeat: Infinity, duration: 0.15 } 
            : stage === 3
            ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
            : { repeat: Infinity, duration: 3, ease: "easeInOut" }
        }
      >
        {/* Ambient Glow behind mascot */}
        <circle cx="100" cy="130" r="60" fill="url(#ambient-glow)" opacity="0.3" />

        {/* 1. Glass Jar Body */}
        <rect x="50" y="80" width="100" height="110" rx="30" fill="url(#glass-body)" stroke="#E65100" strokeWidth="3" />
        
        {/* Spice Level Indicator inside (orange powder) */}
        <motion.path 
          d="M 52 140 Q 100 135 148 140 L 148 175 Q 120 188 100 188 Q 80 188 52 175 Z" 
          fill="url(#spice-gradient)" 
          opacity="0.85"
          animate={stage === 3 ? { d: [
            "M 52 140 Q 100 135 148 140 L 148 175 Q 120 188 100 188 Q 80 188 52 175 Z",
            "M 52 145 Q 100 148 148 145 L 148 175 Q 120 188 100 188 Q 80 188 52 175 Z",
            "M 52 140 Q 100 135 148 140 L 148 175 Q 120 188 100 188 Q 80 188 52 175 Z"
          ] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />

        {/* 2. Jar Lid (Metallic base) */}
        <rect x="65" y="70" width="70" height="12" rx="3" fill="#D84315" stroke="#BF360C" strokeWidth="2" />

        {/* 3. Saffron Chili Hat (Saffron hat on top of lid) */}
        <g>
          {/* Hat body */}
          <path d="M 68 70 C 65 30, 100 15, 100 15 C 100 15, 135 30, 132 70 Z" fill="url(#chili-gradient)" stroke="#BF360C" strokeWidth="2.5" />
          
          {/* Stem/Chili tail */}
          <path d="M 100 15 C 102 5, 115 0, 120 8 C 115 10, 105 12, 100 15 Z" fill="#2E7D32" />
        </g>

        {/* 4. Cute Face Elements */}
        <g>
          {/* Eyes */}
          {stage === 2 ? (
            // Shivering eyes (squeezed closed)
            <>
              <path d="M 75 118 L 87 114" stroke="#37474F" strokeWidth="3" strokeLinecap="round" />
              <path d="M 75 110 L 87 114" stroke="#37474F" strokeWidth="3" strokeLinecap="round" />
              <path d="M 125 118 L 113 114" stroke="#37474F" strokeWidth="3" strokeLinecap="round" />
              <path d="M 125 110 L 113 114" stroke="#37474F" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : stage === 1 ? (
            // Sunglasses for Sun-Drying stage
            <g>
              {/* Left Lens */}
              <rect x="65" y="105" width="30" height="16" rx="8" fill="#212121" />
              {/* Right Lens */}
              <rect x="105" y="105" width="30" height="16" rx="8" fill="#212121" />
              {/* Connection bridge */}
              <path d="M 95 110 L 105 110" stroke="#212121" strokeWidth="3.5" />
              {/* Lens shine */}
              <circle cx="72" cy="110" r="2.5" fill="white" />
              <circle cx="112" cy="110" r="2.5" fill="white" />
            </g>
          ) : (
            // Standard happy shiny eyes
            <>
              {/* Left Eye */}
              <circle cx="80" cy="115" r="7" fill="#37474F" />
              <circle cx="78" cy="112" r="2" fill="white" />
              {/* Right Eye */}
              <circle cx="120" cy="115" r="7" fill="#37474F" />
              <circle cx="118" cy="112" r="2" fill="white" />
            </>
          )}

          {/* Blush Cheeks */}
          <circle cx="70" cy="126" r="5" fill="#FF8A80" opacity="0.8" />
          <circle cx="130" cy="126" r="5" fill="#FF8A80" opacity="0.8" />

          {/* Smiling Mouth */}
          <path 
            d={stage === 2 ? "M 92 128 Q 100 131 108 128" : "M 90 125 Q 100 138 110 125"} 
            stroke="#37474F" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none" 
          />
        </g>

        {/* 5. Mascot Arms */}
        <g>
          {/* Left arm waving in stage 0 */}
          <motion.path 
            d="M 50 135 C 30 130, 25 110, 30 100" 
            stroke="#E65100" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            fill="none"
            animate={stage === 0 ? { rotate: [0, 20, 0, 20, 0], originY: "135px", originX: "50px" } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />

          {/* Right arm holding a spice element or waving */}
          <motion.path 
            d="M 150 135 C 170 140, 175 145, 170 155" 
            stroke="#E65100" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            fill="none"
            animate={stage === 3 ? { rotate: [0, -15, 0, -15, 0], originY: "135px", originX: "150px" } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </g>

        {/* 6. Special Accessories per stage */}
        {stage === 2 && (
          // Ice cubes floating around
          <g opacity="0.6">
            <rect x="35" y="150" width="12" height="12" rx="2" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="1" />
            <rect x="155" y="100" width="10" height="10" rx="2" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="1" />
          </g>
        )}
        {stage === 3 && (
          // Steaming waves
          <path d="M 85 5 Q 90 0 90 -5 M 100 5 Q 105 0 105 -5 M 115 5 Q 120 0 120 -5" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        )}

        {/* Defs/Gradients */}
        <defs>
          <radialGradient id="ambient-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF7A1A" />
            <stop offset="100%" stopColor="#800020" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="glass-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#FFF8E1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFE082" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="spice-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB300" />
            <stop offset="60%" stopColor="#FF8F00" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="chili-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3D00" />
            <stop offset="60%" stopColor="#DD2C00" />
            <stop offset="100%" stopColor="#800020" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
