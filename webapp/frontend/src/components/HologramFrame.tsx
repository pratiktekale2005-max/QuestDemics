import React from 'react';

interface HologramFrameProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export default function HologramFrame({ children, maxWidth = 'max-w-[850px]' }: HologramFrameProps) {
  return (
    <div className="relative w-full h-full min-h-[580px] p-6 md:p-12 flex items-center justify-center select-none overflow-visible">
      {/* 1. Neon Outer Glow Overlay (Behind everything) */}
      <div className="absolute inset-4 border border-cyan-500/10 pointer-events-none rounded-lg" />

      {/* 2. Top Cyber Bar */}
      <div className="absolute top-0 left-4 right-4 h-8 flex items-center pointer-events-none z-10">
        {/* Glow Line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00e5ff]" />
        
        {/* Left corner bracket */}
        <svg className="absolute left-0 top-0 h-6 w-20 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]" viewBox="0 0 80 24" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 80 0 L 70 8 L 20 8 L 10 24 L 0 24 Z" fill="currentColor" opacity="0.8" />
          <path d="M 12 16 L 16 10 H 68" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
        </svg>

        {/* Right corner bracket (Mirrored) */}
        <svg className="absolute right-0 top-0 h-6 w-20 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]" viewBox="0 0 80 24" fill="none" preserveAspectRatio="none">
          <path d="M 80 0 L 0 0 L 10 8 L 60 8 L 70 24 L 80 24 Z" fill="currentColor" opacity="0.8" />
          <path d="M 68 16 L 64 10 H 12" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
        </svg>

        {/* Center glowing badge */}
        <div className="mx-auto px-6 py-1 bg-cyan-950/80 border-b border-x border-cyan-500/50 rounded-b text-[8px] font-mono tracking-[0.3em] text-cyan-300 uppercase shadow-[0_0_10px_rgba(0,229,255,0.2)]">
          System HUD // Main Link v0.8b
        </div>
      </div>

      {/* 3. Bottom Cyber Bar */}
      <div className="absolute bottom-0 left-4 right-4 h-8 flex items-center pointer-events-none z-10">
        {/* Glow Line */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00e5ff]" />
        
        {/* Left corner bracket */}
        <svg className="absolute left-0 bottom-0 h-6 w-20 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]" viewBox="0 0 80 24" fill="none" preserveAspectRatio="none">
          <path d="M 0 24 L 80 24 L 70 16 L 20 16 L 10 0 L 0 0 Z" fill="currentColor" opacity="0.8" />
          <path d="M 12 8 L 16 14 H 68" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
        </svg>

        {/* Right corner bracket (Mirrored) */}
        <svg className="absolute right-0 bottom-0 h-6 w-20 text-cyan-400 drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]" viewBox="0 0 80 24" fill="none" preserveAspectRatio="none">
          <path d="M 80 24 L 0 24 L 10 16 L 60 16 L 70 0 L 80 0 Z" fill="currentColor" opacity="0.8" />
          <path d="M 68 8 L 64 14 H 12" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
        </svg>

        {/* Center glowing detail */}
        <div className="mx-auto w-32 h-[3px] bg-cyan-400 shadow-[0_0_8px_#00e5ff] rounded-full animate-pulse" />
      </div>

      {/* 4. Left Sidebar Cyber Structure */}
      <div className="absolute top-8 bottom-8 left-0 w-4 md:w-6 flex flex-col justify-between pointer-events-none z-10">
        <div className="w-full h-1/4 border-l-2 border-t-2 border-cyan-400/80 shadow-[inset_4px_4px_8px_rgba(0,229,255,0.1)] rounded-tl" />
        {/* Middle Tech Plate */}
        <div className="w-full h-1/3 flex flex-col justify-center items-start gap-1">
          <div className="w-[12px] h-[3px] bg-cyan-400 shadow-[0_0_6px_#00e5ff] mb-2" />
          <div className="w-[6px] h-10 border-l-2 border-cyan-400" />
          <div className="w-[10px] h-[2px] bg-cyan-500/40" />
          <div className="w-[6px] h-10 border-l-2 border-cyan-400" />
          <div className="w-[12px] h-[3px] bg-cyan-400 shadow-[0_0_6px_#00e5ff] mt-2" />
        </div>
        <div className="w-full h-1/4 border-l-2 border-b-2 border-cyan-400/80 shadow-[inset_4px_-4px_8px_rgba(0,229,255,0.1)] rounded-bl" />
      </div>

      {/* 5. Right Sidebar Cyber Structure (Mirrored) */}
      <div className="absolute top-8 bottom-8 right-0 w-4 md:w-6 flex flex-col justify-between pointer-events-none z-10">
        <div className="w-full h-1/4 border-r-2 border-t-2 border-cyan-400/80 shadow-[inset_-4px_4px_8px_rgba(0,229,255,0.1)] rounded-tr" />
        {/* Middle Tech Plate */}
        <div className="w-full h-1/3 flex flex-col justify-center items-end gap-1">
          <div className="w-[12px] h-[3px] bg-cyan-400 shadow-[0_0_6px_#00e5ff] mb-2" />
          <div className="w-[6px] h-10 border-r-2 border-cyan-400" />
          <div className="w-[10px] h-[2px] bg-cyan-500/40" />
          <div className="w-[6px] h-10 border-r-2 border-cyan-400" />
          <div className="w-[12px] h-[3px] bg-cyan-400 shadow-[0_0_6px_#00e5ff] mt-2" />
        </div>
        <div className="w-full h-1/4 border-r-2 border-b-2 border-cyan-400/80 shadow-[inset_-4px_-4px_8px_rgba(0,229,255,0.1)] rounded-br" />
      </div>

      {/* 6. Dynamic Moving Circuit Paths (SVG overlay around contents) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none text-cyan-500/20" preserveAspectRatio="none">
        {/* Left top to right bottom circuit */}
        <path d="M 30,30 L 120,30 L 150,60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
        {/* Animated packet along the path */}
        <path d="M 30,30 L 120,30 L 150,60" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="30, 200" strokeDashoffset="0" className="animate-[circuit_6s_linear_infinite]" />

        {/* Right bottom to left top circuit */}
        <path d="M 100%,100% L -100%,-100%" className="hidden" /> {/* Placeholder for width-responsive pathing */}
      </svg>

      {/* 7. Actual Inner Content */}
      <div className={`relative z-10 w-full ${maxWidth} mx-auto scale-90 sm:scale-95 md:scale-100 transition-all duration-300`}>
        {children}
      </div>

      <style>{`
        @keyframes circuit {
          0% { stroke-dashoffset: 230; }
          100% { stroke-dashoffset: -230; }
        }
      `}</style>
    </div>
  );
}
