import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Heart, Zap, Brain, Eye, 
  Plus, FlaskConical, Gauge, RotateCcw, Sparkles
} from 'lucide-react';
import BlueprintBackground from '../components/BlueprintBackground';
import HologramFrame from '../components/HologramFrame';

export default function StatusScreen() {
  const { user, fetchProfile } = useAppStore();
  const [allocatedStats, setAllocatedStats] = useState<Record<string, number>>({
    str: 0,
    vit: 0,
    agi: 0,
    int: 0,
    per: 0
  });
  const [availablePoints, setAvailablePoints] = useState(0);
  const [floats, setFloats] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [floatId, setFloatId] = useState(0);

  // Initialize and load allocated stats from localStorage
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`questdemics_stats_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAllocatedStats(parsed.allocated || { str: 0, vit: 0, agi: 0, int: 0, per: 0 });
        setAvailablePoints(parsed.availablePoints ?? 0);
      } catch (e) {
        console.error("Error parsing stored stats", e);
      }
    }
  }, [user]);

  if (!user) return null;

  // Base Stats at Level 1
  const baseStats = {
    str: 10,
    vit: 10,
    agi: 10,
    int: 10,
    per: 10
  };

  // Scaling Factor per Level (gained automatically to match image at level 50)
  const autoStr = Math.round((user.level - 1) * 1.47);
  const autoVit = Math.round((user.level - 1) * 1.0);
  const autoAgi = Math.round((user.level - 1) * 1.16);
  const autoInt = Math.round((user.level - 1) * 1.0);
  const autoPer = Math.round((user.level - 1) * 1.04);

  // Final Stats (Base + Auto Level Scaling + Allocated Points)
  const str = baseStats.str + autoStr + allocatedStats.str;
  const vit = baseStats.vit + autoVit + allocatedStats.vit;
  const agi = baseStats.agi + autoAgi + allocatedStats.agi;
  const int = baseStats.int + autoInt + allocatedStats.int;
  const per = baseStats.per + autoPer + allocatedStats.per;

  // Derived RPG Attributes
  const maxHP = vit * 40 + str * 3 + 2;
  const maxMP = int * 6 + 12;
  const currentHP = maxHP; // Auto-healed/full
  const currentMP = maxMP; // Auto-restored/full
  const fatigue = 0; // Default fatigue

  const hpPercent = 100;
  const mpPercent = 100;

  // Save current allocated stats helper
  const saveStats = (newAllocated: typeof allocatedStats, newAvailable: number) => {
    localStorage.setItem(`questdemics_stats_${user.id}`, JSON.stringify({
      allocated: newAllocated,
      availablePoints: newAvailable
    }));
  };

  // Allocate 1 point to a stat
  const handleAllocate = (statKey: string, e: React.MouseEvent) => {
    if (availablePoints <= 0) return;
    
    const nextAllocated = {
      ...allocatedStats,
      [statKey]: allocatedStats[statKey] + 1
    };
    const nextAvailable = availablePoints - 1;
    
    setAllocatedStats(nextAllocated);
    setAvailablePoints(nextAvailable);
    saveStats(nextAllocated, nextAvailable);

    // Spawn float text at click location
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setFloats(prev => [...prev, { id: floatId, x, y, text: '+1' }]);
    setFloatId(prev => prev + 1);
  };

  // Remove floating elements after animation
  useEffect(() => {
    if (floats.length === 0) return;
    const timer = setTimeout(() => {
      setFloats(prev => prev.slice(1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [floats]);

  // Reset allocated stats
  const handleReset = () => {
    // Return all allocated points back to available
    const pointsToRefund = Object.values(allocatedStats).reduce((a, b) => a + b, 0);
    const nextAllocated = { str: 0, vit: 0, agi: 0, int: 0, per: 0 };
    const nextAvailable = availablePoints + pointsToRefund;
    
    setAllocatedStats(nextAllocated);
    setAvailablePoints(nextAvailable);
    saveStats(nextAllocated, nextAvailable);
  };

  // Simulate Level Up / Granting Ability Points
  const handleGainPoints = () => {
    const nextAvailable = availablePoints + 5;
    setAvailablePoints(nextAvailable);
    saveStats(allocatedStats, nextAvailable);
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full flex items-center justify-center p-4">
      {/* Blueprint / Tech Background */}
      <BlueprintBackground />

      <HologramFrame>
        {/* Centered Status HUD Board */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-[620px] bg-slate-950/60 border border-cyan-500/40 rounded shadow-[0_0_25px_rgba(0,229,255,0.15)] backdrop-filter backdrop-blur-md p-6 font-mono text-cyan-100 overflow-hidden"
        >
          {/* Subtle diagnostic grids inside the card */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Centered STATUS Header Box */}
          <div className="flex justify-center mb-6">
            <div className="border border-cyan-500/50 px-8 py-1.5 bg-cyan-950/30 text-center tracking-[0.25em] text-white font-extrabold text-sm md:text-base shadow-[0_0_10px_rgba(0,229,255,0.1)]">
              STATUS
            </div>
          </div>

          {/* Level, Job and Title block */}
          <div className="flex items-center justify-between px-4 mb-6">
            {/* Level Group */}
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-black text-white leading-none tracking-tight drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]">
                {user.level}
              </span>
              <span className="text-[10px] font-bold text-cyan-400 mt-1 uppercase tracking-widest">
                LEVEL
              </span>
            </div>

            {/* Job and Title Group */}
            <div className="space-y-2 text-right text-xs md:text-sm font-sans tracking-wide text-gray-300">
              <div>
                <span className="text-gray-500 font-mono text-xs uppercase tracking-wider">JOB:</span>{' '}
                <span className="font-extrabold text-white uppercase">{user.class_name || 'None'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-mono text-xs uppercase tracking-wider">TITLE:</span>{' '}
                <span className="font-extrabold text-white uppercase">{user.rank || 'None'}</span>
              </div>
            </div>
          </div>

          {/* HP / MP / Fatigue HUD Bar */}
          <div className="border-y border-cyan-500/30 py-4 px-2 md:px-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-cyan-950/10">
            {/* HP */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-red-500 font-black">
                  <Plus className="w-3.5 h-3.5 fill-red-500/20" />
                  <span>HP</span>
                </div>
              </div>
              <div className="w-full bg-cyan-950/40 border border-cyan-500/30 h-3.5 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="bg-gradient-to-r from-red-500 to-rose-400 h-full rounded-full shadow-[0_0_8px_#f43f5e]"
                />
              </div>
              <div className="text-right text-[10px] text-gray-400 font-mono">
                {currentHP} / {maxHP}
              </div>
            </div>

            {/* MP */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-cyan-400 font-black">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>MP</span>
                </div>
              </div>
              <div className="w-full bg-cyan-950/40 border border-cyan-500/30 h-3.5 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${mpPercent}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full shadow-[0_0_8px_#06b6d4]"
                />
              </div>
              <div className="text-right text-[10px] text-gray-400 font-mono">
                {currentMP} / {maxMP}
              </div>
            </div>

            {/* Fatigue */}
            <div className="flex justify-center sm:justify-end items-center h-full pt-1 sm:pt-0">
              <div className="flex items-center gap-2 border border-cyan-500/20 px-3 py-1.5 bg-cyan-950/20 rounded-md">
                <Gauge className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">FATIGUE:</span>
                <span className="text-xs font-extrabold text-white">{fatigue}</span>
              </div>
            </div>
          </div>

          {/* Stats & Available Points Grid */}
          <div className="border border-cyan-500/30 rounded p-4 md:p-6 bg-cyan-950/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Left Column (STR, AGI, PER) */}
              <div className="space-y-4">
                {/* STR */}
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 hover:bg-cyan-950/10 p-1 rounded transition-colors group relative">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_#00e5ff]" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">STR:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">{str}</span>
                    {availablePoints > 0 && (
                      <button 
                        onClick={(e) => handleAllocate('str', e)}
                        className="w-5 h-5 flex items-center justify-center bg-cyan-500 text-slate-950 hover:bg-white hover:scale-110 active:scale-95 transition-all text-xs font-bold rounded-sm cursor-pointer shadow-[0_0_6px_rgba(0,229,255,0.8)]"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* AGI */}
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 hover:bg-cyan-950/10 p-1 rounded transition-colors group relative">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_#00e5ff]" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">AGI:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">{agi}</span>
                    {availablePoints > 0 && (
                      <button 
                        onClick={(e) => handleAllocate('agi', e)}
                        className="w-5 h-5 flex items-center justify-center bg-cyan-500 text-slate-950 hover:bg-white hover:scale-110 active:scale-95 transition-all text-xs font-bold rounded-sm cursor-pointer shadow-[0_0_6px_rgba(0,229,255,0.8)]"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* PER */}
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 hover:bg-cyan-950/10 p-1 rounded transition-colors group relative">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_#00e5ff]" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">PER:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">{per}</span>
                    {availablePoints > 0 && (
                      <button 
                        onClick={(e) => handleAllocate('per', e)}
                        className="w-5 h-5 flex items-center justify-center bg-cyan-500 text-slate-950 hover:bg-white hover:scale-110 active:scale-95 transition-all text-xs font-bold rounded-sm cursor-pointer shadow-[0_0_6px_rgba(0,229,255,0.8)]"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (VIT, INT, Available Ability Points) */}
              <div className="space-y-4">
                {/* VIT */}
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 hover:bg-cyan-950/10 p-1 rounded transition-colors group relative">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_#00e5ff]" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">VIT:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">{vit}</span>
                    {availablePoints > 0 && (
                      <button 
                        onClick={(e) => handleAllocate('vit', e)}
                        className="w-5 h-5 flex items-center justify-center bg-cyan-500 text-slate-950 hover:bg-white hover:scale-110 active:scale-95 transition-all text-xs font-bold rounded-sm cursor-pointer shadow-[0_0_6px_rgba(0,229,255,0.8)]"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* INT */}
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 hover:bg-cyan-950/10 p-1 rounded transition-colors group relative">
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_4px_#00e5ff]" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">INT:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">{int}</span>
                    {availablePoints > 0 && (
                      <button 
                        onClick={(e) => handleAllocate('int', e)}
                        className="w-5 h-5 flex items-center justify-center bg-cyan-500 text-slate-950 hover:bg-white hover:scale-110 active:scale-95 transition-all text-xs font-bold rounded-sm cursor-pointer shadow-[0_0_6px_rgba(0,229,255,0.8)]"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* Available Ability Points */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Available Ability Points</span>
                    <span className="text-[10px] text-cyan-400/70 font-bold">SPENT IN BATTLE</span>
                  </div>
                  <span className={`text-2xl font-black ${availablePoints > 0 ? 'text-white animate-pulse drop-shadow-[0_0_6px_rgba(0,229,255,0.8)]' : 'text-cyan-500/60'}`}>
                    {availablePoints}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Utility Controls (Reset / Gain points) */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-cyan-500/20">
            <button
              onClick={handleReset}
              disabled={Object.values(allocatedStats).reduce((a, b) => a + b, 0) === 0}
              className="flex items-center gap-2 px-3 py-1.5 border border-red-500/30 hover:border-red-500 bg-red-950/15 hover:bg-red-950/40 text-red-400 rounded text-xs transition-all uppercase tracking-wider cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Stats</span>
            </button>

            <button
              onClick={handleGainPoints}
              className="flex items-center gap-2 px-3 py-1.5 border border-cyan-500/35 hover:border-cyan-500 bg-cyan-950/10 hover:bg-cyan-950/30 text-cyan-400 hover:text-white rounded text-xs transition-all uppercase tracking-wider cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.1)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gain Ability Points (+5)</span>
            </button>
          </div>

          {/* Floating Text Particles Overlay */}
          <AnimatePresence>
            {floats.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 1, y: f.y, scale: 0.8 }}
                animate={{ opacity: 0, y: f.y - 50, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ left: f.x, top: f.y }}
                className="absolute text-sm font-black text-cyan-400 pointer-events-none drop-shadow-[0_0_4px_#00e5ff]"
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </HologramFrame>
    </div>
  );
}
