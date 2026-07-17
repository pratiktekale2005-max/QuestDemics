import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause, RotateCcw, CheckCircle, ShieldAlert, Award } from 'lucide-react';
import HologramFrame from '../components/HologramFrame';

export default function StudyArena() {
  const { logStudySession, user } = useAppStore();
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'FOCUS' | 'BREAK' | 'REFLECTION'>('FOCUS');
  const [distractions, setDistractions] = useState(0);
  const [focusRating, setFocusRating] = useState(80);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      if (phase === 'FOCUS') {
        setPhase('REFLECTION');
      } else {
        setPhase('FOCUS');
        setSecondsLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, phase]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(phase === 'BREAK' ? 5 * 60 : 25 * 60);
    setDistractions(0);
    setResult(null);
  };

  const handlePhaseChange = (newPhase: 'FOCUS' | 'BREAK' | 'REFLECTION') => {
    setPhase(newPhase);
    setSecondsLeft(newPhase === 'BREAK' ? 5 * 60 : 25 * 60);
    setIsActive(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const logDistraction = () => {
    if (isActive && phase === 'FOCUS') {
      setDistractions((d) => d + 1);
    }
  };

  const handleSubmitReflection = async () => {
    setIsSaving(true);
    const minutesStudied = phase === 'FOCUS' 
      ? Math.ceil((25 * 60 - secondsLeft) / 60)
      : 25;

    const response = await logStudySession(
      minutesStudied || 1,
      distractions,
      focusRating
    );

    setResult(response);
    setIsSaving(false);
    setPhase('FOCUS');
    setSecondsLeft(25 * 60);
    setDistractions(0);
  };

  return (
    <HologramFrame maxWidth="max-w-5xl">
      <div className="space-y-6 font-mono pb-16 text-cyan-100">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white flex items-center justify-center gap-2 drop-shadow-[0_0_8px_#00e5ff]">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Focus Study Arena</span>
          </h1>
          <p className="text-[10px] text-cyan-500/70 mt-1 uppercase tracking-wider">
            Maintain momentum // The System observes attention limits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Timer & Controls */}
          <div className="md:col-span-2 holo-panel holo-panel-brackets p-6 md:p-8 rounded-sm flex flex-col items-center justify-center space-y-6 relative overflow-hidden bg-slate-950/40">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Phase togglers */}
            <div className="flex gap-2 bg-slate-950/80 p-1 rounded-sm border border-cyan-500/30 text-xs font-mono relative z-10">
              <button
                onClick={() => handlePhaseChange('FOCUS')}
                className={`px-4 py-1.5 rounded-sm transition-all uppercase font-bold tracking-wider cursor-pointer ${
                  phase === 'FOCUS' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,229,255,0.15)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => handlePhaseChange('BREAK')}
                className={`px-4 py-1.5 rounded-sm transition-all uppercase font-bold tracking-wider cursor-pointer ${
                  phase === 'BREAK' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,229,255,0.15)]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Short Break (5m)
              </button>
            </div>

            {/* Time Display */}
            <div className="relative flex items-center justify-center w-56 h-56 rounded-full border-2 border-cyan-500/30 relative bg-cyan-950/10 z-10 shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]">
              {/* Visual Ring Glow */}
              <div className={`absolute inset-0 rounded-full border-2 border-t-cyan-400 ${isActive ? 'animate-[spin_4s_linear_infinite]' : ''} border-r-transparent border-b-transparent border-l-transparent pointer-events-none`} />
              
              <div className="text-center space-y-1">
                <span className="text-5xl font-extrabold tracking-widest text-white drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
                  {formatTime(secondsLeft)}
                </span>
                <div className="text-[9px] text-cyan-400/60 font-bold uppercase tracking-widest">
                  {phase} Session
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 relative z-10">
              <button
                onClick={resetTimer}
                className="p-3 border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/50 rounded-full text-cyan-400 hover:text-white transition-all cursor-pointer shadow-[0_0_8px_rgba(0,229,255,0.05)]"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleTimer}
                className="py-2.5 px-8 bg-cyan-950/40 hover:bg-cyan-950/60 text-cyan-400 hover:text-white border border-cyan-500/50 hover:border-cyan-400 font-extrabold rounded uppercase tracking-widest text-xs shadow-[0_0_10px_rgba(0,229,255,0.1)] transition-all cursor-pointer"
              >
                {isActive ? <span className="flex items-center gap-1.5"><Pause className="w-3.5 h-3.5 text-cyan-400" /> Pause</span> : <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5 text-cyan-400" /> Start training</span>}
              </button>
              
              {phase === 'FOCUS' && isActive && (
                <button
                  onClick={() => setPhase('REFLECTION')}
                  className="py-2.5 px-4 bg-cyan-950/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-mono rounded text-xs transition-all cursor-pointer"
                >
                  Conclude early
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Distractions & Metrics */}
          <div className="space-y-6">
            {/* Distraction logger */}
            <div className="holo-panel p-6 rounded-sm text-center space-y-4 bg-slate-950/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Distraction Counter
              </h3>
              
              <div className="text-4xl font-extrabold text-red-500 py-2 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]">
                {distractions}
              </div>

              <button
                onClick={logDistraction}
                disabled={!isActive || phase !== 'FOCUS'}
                className="w-full bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-500/60 text-red-300 py-2.5 rounded font-mono text-xs uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                Log Distraction
              </button>
              <p className="text-[9px] text-cyan-550/40 leading-relaxed uppercase">
                Log interruptions immediately. The System updates your focus rating.
              </p>
            </div>

            {/* Reward log response display */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 rounded-sm border border-green-500/40 bg-green-950/15 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-xs font-mono">
                    <CheckCircle className="w-5 h-5" />
                    <span>Session Logged</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono py-1">
                    <div className="bg-slate-950/60 p-2 rounded border border-green-950/40">
                      <span className="text-gray-500 block uppercase text-[9px]">XP Earned</span>
                      <span className="text-sm font-bold text-cyan-400">+{result.xp_earned} XP</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded border border-green-950/40">
                      <span className="text-gray-500 block uppercase text-[9px]">Gold Gained</span>
                      <span className="text-sm font-bold text-cyan-400">+{result.gold_earned} G</span>
                    </div>
                  </div>

                  {result.fatigue_lock && (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded flex gap-2 items-start mt-2">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block">Fatigue Alert</span>
                        <p className="text-[9px] text-gray-300 font-mono leading-normal mt-0.5 uppercase">
                          Daily study threshold exceeded. Workspace locked for recovery.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Reflection overlay (triggers when phase is REFLECTION) */}
        <AnimatePresence>
          {phase === 'REFLECTION' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 font-mono"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md p-6 rounded-sm holo-panel holo-panel-brackets bg-slate-950/80 border border-cyan-500/50 relative shadow-[0_0_25px_rgba(0,229,255,0.2)]"
              >
                <div className="text-center mb-6">
                  <Award className="w-12 h-12 text-cyan-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
                  <h3 className="text-lg font-bold uppercase text-white tracking-wider">
                    Session Reflection
                  </h3>
                  <p className="text-[10px] text-cyan-500/70 mt-1 uppercase">
                    Report parameters to the System.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
                      <span>Self-Rated Concentration</span>
                      <span className="text-cyan-400 font-bold">{focusRating}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={focusRating}
                      onChange={(e) => setFocusRating(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 bg-cyan-950/60 rounded-lg h-2 cursor-pointer outline-none border border-cyan-500/20"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-cyan-500/50 mt-1 uppercase">
                      <span>Highly Distracted</span>
                      <span>Absolute Focus</span>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-950/20 rounded border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>Active distractions recorded:</span>
                      <span className="text-red-400 font-bold">{distractions}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitReflection}
                    disabled={isSaving}
                    className="w-full bg-cyan-950/40 hover:bg-cyan-950/60 text-cyan-400 hover:text-white border border-cyan-500/40 hover:border-cyan-400 py-3 rounded font-extrabold uppercase text-xs tracking-widest shadow-[0_0_12px_rgba(0,229,255,0.1)] transition-all cursor-pointer"
                  >
                    {isSaving ? 'Submitting Log...' : 'Synchronize stats'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </HologramFrame>
  );
}
