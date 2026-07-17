import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';
import { 
  Trophy, Flame, Shield, Award, CheckCircle, 
  Play, Lock, Calendar, Star, Compass, Clock, Zap, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HologramFrame from '../components/HologramFrame';

export default function Dashboard() {
  const { user, dailies, roadmap, fetchDailies, fetchRoadmap, completeQuest } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDailies();
    fetchRoadmap();
  }, [fetchDailies, fetchRoadmap]);

  if (!user) return null;

  // Level Up requirement calculation (level * 1000)
  const xpNeeded = user.level * 1000;
  const xpPercentage = Math.min((user.xp / xpNeeded) * 100, 100);

  // Filter out Main Quests from dailies
  const activeDailies = dailies.filter(q => q.type === 'DAILY' || q.type === 'RECOVERY');
  const recoveryQuest = dailies.find(q => q.type === 'RECOVERY');
  
  // Find current active Main Quest
  const activeMain = roadmap.find(q => q.status === 'ACTIVE');

  // Simple hardcoded activity heatmap for demo visualization
  const mockHeatmap = [
    { day: 'Mon', mins: 45, level: 2 },
    { day: 'Tue', mins: 120, level: 4 },
    { day: 'Wed', mins: 0, level: 0 },
    { day: 'Thu', mins: 60, level: 3 },
    { day: 'Fri', mins: 30, level: 1 },
    { day: 'Sat', mins: 180, level: 4 },
    { day: 'Sun', mins: 90, level: 3 }
  ];

  return (
    <HologramFrame maxWidth="max-w-7xl">
      <div className="space-y-6 font-mono pb-16">
      
      {/* 1. HUNTER STATUS CARD & QUICK STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hunter Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 holo-panel holo-panel-brackets p-6 rounded-sm relative overflow-hidden shadow-rpg-glow"
        >
          {/* Subtle Rank glow ring behind card */}
          <div className="absolute right-[-40px] top-[-40px] w-48 h-48 rounded-full bg-rpg-gold/5 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar & Rank Plate */}
            <div className="relative">
              <div className="w-20 h-20 rounded-lg bg-rpg-dark border-2 border-rpg-gold flex items-center justify-center text-rpg-gold shadow-rpg-glow relative">
                <Shield className="w-10 h-10" />
                <span className="absolute bottom-[-10px] right-[-10px] bg-rpg-gold text-rpg-bg text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border border-rpg-border">
                  LV {user.level}
                </span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-extrabold tracking-wide uppercase text-white">{user.name}</h2>
                <div className={`inline-block self-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border font-mono ${
                  user.rank.includes('S') ? 'bg-red-950/40 text-red-400 border-red-500 shadow-rank-glow' :
                  user.rank.includes('A') ? 'bg-orange-950/40 text-orange-400 border-orange-500' :
                  user.rank.includes('B') ? 'bg-purple-950/40 text-purple-400 border-purple-500' :
                  'bg-rpg-dark text-gray-400 border-rpg-border'
                }`}>
                  {user.rank}
                </div>
              </div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                Awakened Hunter Entity • Joined {new Date(user.joined_at).toLocaleDateString()}
              </p>

              {/* XP Progression Bar */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] uppercase font-mono text-gray-400">
                  <span>EXP Progress</span>
                  <span>{user.xp} / {xpNeeded} XP</span>
                </div>
                <div className="w-full bg-rpg-dark h-3 rounded border border-rpg-border overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ duration: 1 }}
                    className="bg-gradient-to-r from-rpg-xp to-indigo-500 h-full rounded shadow-xp-glow"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Currency & Streak widgets */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="holo-panel p-5 rounded-sm flex flex-col justify-between"
          >
            <div className="text-gray-400 uppercase text-[10px] font-mono tracking-wider">Gold Wealth</div>
            <div className="text-3xl font-extrabold text-rpg-gold tracking-wide mt-2">
              {user.gold} <span className="text-sm font-mono font-bold text-rpg-gold/80">G</span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-2">Earned from battle success</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="holo-panel p-5 rounded-sm flex flex-col justify-between"
          >
            <div className="text-gray-400 uppercase text-[10px] font-mono tracking-wider">Active Streak</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-orange-500">{user.streak}</span>
              <span className="text-xs text-gray-400 uppercase font-mono">Days</span>
              <Flame className="w-5 h-5 text-orange-500 animate-pulse inline self-center" />
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-2">Daily Quests completed consecutively</div>
          </motion.div>
        </div>
      </div>

      {/* 2. QUEST BOARD & HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Daily Quests and main quest info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recovery Warning Indicator */}
          {recoveryQuest && (
            <div className="p-4 bg-red-950/40 border border-red-500/60 rounded-sm text-red-200 text-sm font-mono flex flex-col gap-2 shadow-rank-glow relative holo-panel system-warning-hud">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider relative z-10">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
                <span>System Notification: Recovery Mode Locked</span>
              </div>
              <p className="text-xs text-gray-300 relative z-10">
                You failed to complete yesterday's daily quests. The System has locked active milestones. 
                Complete the Recovery Quest to resume normal progression.
              </p>
            </div>
          )}

          {/* Active Quests Board */}
          <div className="holo-panel holo-panel-brackets p-6 rounded-sm space-y-4">
            <h3 className="text-lg font-bold tracking-wide uppercase text-white font-mono border-b border-rpg-border pb-2 flex items-center gap-2">
              <Compass className="w-5 h-5 text-rpg-gold" />
              <span>Active Quest Log</span>
            </h3>

            <div className="space-y-3">
              {activeDailies.map((quest) => (
                <div 
                  key={quest.id}
                  className={`p-4 rounded-lg bg-rpg-dark border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                    quest.status === 'COMPLETED' 
                      ? 'border-green-950 bg-green-950/10 opacity-60' 
                      : quest.type === 'RECOVERY'
                      ? 'border-red-500/40 hover:border-red-500'
                      : 'border-rpg-border hover:border-rpg-gold'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border ${
                        quest.type === 'RECOVERY' ? 'bg-red-950 text-red-400 border-red-500/30' : 'bg-rpg-card text-rpg-gold border-rpg-border'
                      }`}>
                        {quest.type}
                      </span>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">{quest.title}</h4>
                    </div>
                    <p className="text-xs text-gray-400 max-w-lg">{quest.description}</p>
                    
                    {/* Rewards indicators */}
                    <div className="flex gap-3 pt-1 text-[10px] font-mono text-gray-500">
                      <span>XP: +{quest.xp_reward}</span>
                      <span>Gold: +{quest.gold_reward}G</span>
                    </div>
                  </div>

                  <button
                    onClick={() => completeQuest(quest.id)}
                    disabled={quest.status === 'COMPLETED'}
                    className={`py-1.5 px-4 rounded text-[11px] uppercase font-extrabold tracking-wider transition-all border ${
                      quest.status === 'COMPLETED'
                        ? 'bg-transparent text-green-500 border-green-500/30 cursor-default'
                        : quest.type === 'RECOVERY'
                        ? 'bg-red-950 text-red-300 border-red-500/50 hover:bg-red-900'
                        : 'bg-rpg-dark text-rpg-gold border-rpg-gold/40 hover:border-rpg-gold'
                    }`}
                  >
                    {quest.status === 'COMPLETED' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Conquered
                      </span>
                    ) : (
                      'Conquer'
                    )}
                  </button>
                </div>
              ))}

              {activeDailies.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-500 font-mono">
                  All daily parameters are complete. Check back at midnight or query the tutor in chat.
                </div>
              )}
            </div>
          </div>

          {/* Current Main Quest Week Milestone */}
          {activeMain && (
            <div className="holo-panel holo-panel-brackets p-6 rounded-sm space-y-4">
              <div className="flex justify-between items-center border-b border-rpg-border pb-2">
                <h3 className="text-base font-bold tracking-wide uppercase text-white font-mono flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span>Main Quest: Week {activeMain.week_number}</span>
                </h3>
                <span className="text-[10px] font-mono text-rpg-gold uppercase">Active Chapter</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-extrabold text-purple-300 uppercase">{activeMain.title}</h4>
                <p className="text-xs text-gray-400">{activeMain.description}</p>
                
                {/* Core Topics Checklist */}
                {activeMain.content?.topics && (
                  <div className="pt-3 space-y-1.5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Chapter Modules</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300 font-mono">
                      {activeMain.content.topics.map((topic: string) => (
                        <div key={topic} className="flex items-center gap-2 bg-rpg-dark/40 border border-rpg-border/40 p-2 rounded">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Heatmap and Boss Battle Launcher */}
        <div className="space-y-6">
          {/* Weekly Heatmap Widget */}
          <div className="holo-panel p-5 rounded-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rpg-gold" />
              <span>Training Consistency</span>
            </h3>
            
            {/* Heatmap Grid */}
            <div className="grid grid-cols-7 gap-2 pt-2 text-center">
              {mockHeatmap.map((day) => (
                <div key={day.day} className="flex flex-col items-center gap-1.5">
                  <div 
                    className={`w-7 h-7 rounded border transition-all ${
                      day.level === 0 ? 'bg-rpg-dark/55 border-rpg-border/50' :
                      day.level === 1 ? 'bg-amber-900/30 border-amber-800/40' :
                      day.level === 2 ? 'bg-amber-800/50 border-amber-700/50' :
                      day.level === 3 ? 'bg-amber-600/70 border-rpg-gold/60' :
                      'bg-rpg-gold text-rpg-bg border-white shadow-rpg-glow'
                    }`}
                    title={`${day.mins} minutes studied`}
                  />
                  <span className="text-[9px] font-mono text-gray-500">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-gray-500 font-mono pt-2 text-center">
              Consistency levels determine Hunter Rank promotion
            </div>
          </div>

          {/* Boss Battle Gateway */}
          <div className="holo-panel holo-panel-brackets p-5 rounded-sm space-y-4 relative overflow-hidden system-warning-hud shadow-rank-glow">
            {/* Pulsing warning backdrop */}
            <div className="absolute inset-0 bg-red-950/5 pointer-events-none animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 font-mono flex items-center gap-2 border-b border-red-950/60 pb-2 relative z-10">
              <Trophy className="w-4 h-4 text-red-500" />
              <span>Boss Battle Active</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Test your functional mastery against "The Gatekeeper". Deploy a fully connected relational REST API with security under a strict time threshold.
            </p>
            <button
              onClick={() => navigate('/boss')}
              disabled={!!recoveryQuest}
              className="w-full bg-red-950/80 hover:bg-red-900 border border-red-500/50 hover:border-red-500 text-red-200 py-2.5 rounded font-bold uppercase text-xs tracking-widest shadow-rank-glow transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Play className="w-3.5 h-3.5 fill-red-200" /> Enter Dungeon Arena
            </button>
          </div>
        </div>

      </div>

      </div>
    </HologramFrame>
  );
}
