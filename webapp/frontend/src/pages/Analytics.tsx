import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, Cpu, Lock, CheckCircle, Compass } from 'lucide-react';
import HologramFrame from '../components/HologramFrame';

export default function Analytics() {
  const { user, roadmap } = useAppStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setStats({
        totalStudyHours: Math.round(user.level * 4.2 + 8),
        avgFocusScore: 84,
        weaknessesDetected: user.level < 5 ? ["SQL joins", "Variable scopes"] : ["Docker containerization", "Unit testing coverage"],
        projectedCompletionDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toLocaleDateString(),
        skillsUnlocked: user.level >= 15 ? 4 : user.level >= 5 ? 2 : 1
      });
    }
  }, [user]);

  if (!user || !stats) return null;

  return (
    <HologramFrame maxWidth="max-w-7xl">
      <div className="space-y-6 font-mono pb-16 text-cyan-100">
        
        {/* HEADER */}
        <div className="text-center md:text-left">
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white flex items-center justify-center md:justify-start gap-2 drop-shadow-[0_0_8px_#00e5ff]">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Hunter Analytics & Skill Tree</span>
          </h1>
          <p className="text-[10px] text-cyan-500/70 mt-1 uppercase tracking-wider">
            System Metrics // Adaptation Registry Log
          </p>
        </div>

        {/* CORE STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="holo-panel p-5 rounded-sm flex flex-col justify-between">
            <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">Total Training</span>
            <span className="text-2xl font-extrabold text-white mt-2">{stats.totalStudyHours} Hours</span>
            <span className="text-[10px] text-cyan-500/60 mt-2">Accumulated across timer sessions</span>
          </div>

          <div className="holo-panel p-5 rounded-sm flex flex-col justify-between">
            <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">Focus Concentration</span>
            <span className="text-2xl font-extrabold text-cyan-400 mt-2">{stats.avgFocusScore}%</span>
            <span className="text-[10px] text-cyan-500/60 mt-2">Average user-rated attention index</span>
          </div>

          <div className="holo-panel p-5 rounded-sm flex flex-col justify-between">
            <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">Skills Unlocked</span>
            <span className="text-2xl font-extrabold text-purple-400 mt-2">{stats.skillsUnlocked} / 4 Nodes</span>
            <span className="text-[10px] text-cyan-500/60 mt-2">Milestones conquered in roadmap</span>
          </div>

          <div className="holo-panel p-5 rounded-sm flex flex-col justify-between">
            <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">Projected Completion</span>
            <span className="text-xl font-extrabold text-green-400 mt-2">{stats.projectedCompletionDate}</span>
            <span className="text-[10px] text-cyan-500/60 mt-2">Adaptive calendar forecast</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SKILL TREE MAP (Visual Nodes) */}
          <div className="lg:col-span-2 holo-panel holo-panel-brackets p-6 rounded-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 border-b border-cyan-500/25 pb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Roadmap Skill Tree Path</span>
            </h3>

            <div className="relative pt-6 pb-6 flex flex-col items-center space-y-8">
              {/* Visual vertical line connecting nodes */}
              <div className="absolute left-[50%] top-6 bottom-6 w-0.5 bg-cyan-950/80 pointer-events-none" />

              {roadmap.map((week, idx) => {
                const isUnlocked = week.status === 'ACTIVE' || week.status === 'COMPLETED';
                const isCompleted = week.status === 'COMPLETED';
                const isCurrent = week.status === 'ACTIVE';

                return (
                  <motion.div 
                    key={week.id}
                    whileHover={{ scale: isUnlocked ? 1.01 : 1 }}
                    className={`w-full max-w-md p-4 rounded-sm border flex gap-4 items-center relative bg-slate-950/40 z-10 transition-all ${
                      isCompleted ? 'border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.15)]' :
                      isCurrent ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.25)] status-glow-animation' :
                      'border-cyan-950/60 opacity-40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-green-950/40 text-green-400 border-green-500/40' :
                      isCurrent ? 'bg-cyan-950/40 text-cyan-400 border-cyan-400' :
                      'bg-slate-950/80 text-cyan-950 border-cyan-950'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : isUnlocked ? <Cpu className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <span className="text-[9px] uppercase text-cyan-500/50">Node {week.week_number || idx + 1}</span>
                      <h4 className="text-xs font-extrabold uppercase text-white tracking-wide">{week.title}</h4>
                      <p className="text-[10px] text-gray-400">{week.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* WEAKNESS RADAR & REMEDIATION LOG */}
          <div className="space-y-6">
            <div className="holo-panel p-5 rounded-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 border-b border-red-500/20 pb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>System Weakness Radar</span>
              </h3>
              <p className="text-[10px] text-cyan-500/50 leading-relaxed uppercase">
                These concepts currently trigger lower scoring models. The System injects recovery tasks into your daily queues.
              </p>

              <div className="space-y-2 pt-2">
                {stats.weaknessesDetected.map((weakness: string) => (
                  <div key={weakness} className="p-3 bg-red-950/15 border border-red-500/25 rounded-sm flex items-center justify-between text-xs text-red-300">
                    <span>{weakness}</span>
                    <span className="text-[9px] uppercase bg-red-950 border border-red-500/25 px-1.5 py-0.5 rounded text-red-400">
                      Remediation Queue
                    </span>
                  </div>
                ))}
                
                {stats.weaknessesDetected.length === 0 && (
                  <div className="text-center py-4 text-xs text-cyan-550/50">
                    No weaknesses currently registered.
                  </div>
                )}
              </div>
            </div>

            <div className="holo-panel holo-panel-brackets p-5 rounded-sm space-y-3 relative overflow-hidden">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                System Evolution Mode
              </h3>
              <div className="space-y-2 pt-1 text-[11px] leading-relaxed text-gray-400">
                <p>• <span className="text-white">Month 1:</span> Adaptive Planner (Active)</p>
                <p>• <span className="text-white">Month 2:</span> Custom Study Coach (Unlocking at Lvl 5)</p>
                <p>• <span className="text-white">Month 3:</span> Project Portfolio Evaluator (LOCKED)</p>
                <p>• <span className="text-white">Month 6:</span> S-Rank Mock Interviewer (LOCKED)</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </HologramFrame>
  );
}
