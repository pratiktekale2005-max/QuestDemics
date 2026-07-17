import React from 'react';

export default function BlueprintBackground() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 bg-[#020712]">
      {/* 1. Technical Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 229, 255, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Subtle Dot Grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(0, 229, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* 2. Rotating Tech Rings & Radars */}
      <svg className="absolute w-[800px] h-[800px] -top-40 -left-40 text-cyan-500/10 pointer-events-none select-none animate-[spin_120s_linear_infinite]" viewBox="0 0 800 800">
        <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="1" strokeDasharray="5,15" fill="none" />
        <circle cx="400" cy="400" r="300" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20,10,5,10" fill="none" />
        <circle cx="400" cy="400" r="220" stroke="currentColor" strokeWidth="0.75" fill="none" />
        <path d="M 400 20 L 400 780 M 20 400 L 780 400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4,4" />
        {/* Tech markings */}
        <text x="410" y="60" fontSize="10" fill="currentColor" fontFamily="monospace" letterSpacing="1">SYS_GRID_L_01</text>
        <text x="410" y="750" fontSize="10" fill="currentColor" fontFamily="monospace" letterSpacing="1">LAT_37.7749_N</text>
      </svg>

      <svg className="absolute w-[600px] h-[600px] -bottom-20 -right-20 text-cyan-500/8 pointer-events-none select-none animate-[spin_80s_linear_infinite_reverse]" viewBox="0 0 600 600">
        <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="1.5" strokeDasharray="40,20" fill="none" />
        <circle cx="300" cy="300" r="200" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <circle cx="300" cy="300" r="120" stroke="currentColor" strokeWidth="2" strokeDasharray="2,6" fill="none" />
        <path d="M 300 20 L 300 580 M 20 300 L 580 300" stroke="currentColor" strokeWidth="0.75" />
        <text x="310" y="50" fontSize="10" fill="currentColor" fontFamily="monospace">SYS_GRID_R_09</text>
      </svg>

      {/* 3. Tech Callout HUD labels in corners */}
      <div className="absolute top-8 left-8 font-mono text-[9px] text-cyan-500/30 flex flex-col gap-1 tracking-wider uppercase select-none">
        <div>SYS.LOC // SEC_09_SECTOR_A</div>
        <div>LATENCY // 0.0034 MS</div>
        <div>STATUS // SYSTEM_ACTIVE</div>
      </div>

      <div className="absolute top-8 right-8 font-mono text-[9px] text-cyan-500/30 text-right flex flex-col gap-1 tracking-wider uppercase select-none">
        <div>CORE.TEMP // 34.2 C</div>
        <div>POWER.HUD // 98.4%</div>
        <div>MEM.STACK // 0x4FF87B</div>
      </div>

      <div className="absolute bottom-8 left-8 font-mono text-[9px] text-cyan-500/30 flex flex-col gap-1 tracking-wider uppercase select-none">
        <div>HUNTER_ENTITY // SYNCED</div>
        <div>ALGORITHM // SOL_LEV_0.8b</div>
      </div>

      {/* 4. Scanning lines */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/3 to-transparent w-full h-[300px]"
        style={{
          animation: 'scanline 14s linear infinite',
        }}
      />

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-300px); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}
