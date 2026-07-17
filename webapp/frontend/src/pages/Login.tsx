import React, { useState } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, User as UserIcon, Lock, Mail } from 'lucide-react';
import BlueprintBackground from '../components/BlueprintBackground';
import HologramFrame from '../components/HologramFrame';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register, isLoading, error } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (isLogin) {
      await login(email, password);
    } else {
      if (!name) return;
      await register(email, password, name);
    }
  };

  return (
    <div className="min-h-screen bg-rpg-bg flex items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Dynamic tech grid background */}
      <BlueprintBackground />
      
      <HologramFrame maxWidth="max-w-[480px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full relative z-10 holo-panel holo-panel-brackets p-6 md:p-8 rounded bg-slate-950/60 border border-cyan-500/40 text-cyan-100 shadow-[0_0_25px_rgba(0,229,255,0.15)] backdrop-filter backdrop-blur-md"
        >
          {/* Subtle diagnostics background inside card */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* RPG Title Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="inline-flex p-3 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 mb-2 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-wider text-white uppercase drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
              QuestDemics
            </h1>
            <p className="text-[10px] text-cyan-400 mt-1 uppercase tracking-widest font-mono">
              AI Operating System // Active
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 rounded text-red-200 text-xs font-mono flex items-center gap-2 relative z-10">
              <Terminal className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="block text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">Hunter Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-cyan-500/60" />
                    <input
                      type="text"
                      required
                      placeholder="E.g., Jinwoo Sung"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-cyan-950/40 border border-cyan-500/30 focus:border-cyan-400 rounded px-10 py-2 text-sm text-white placeholder-cyan-950 outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">Hunter Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-cyan-500/60" />
                <input
                  type="email"
                  required
                  placeholder="hunter@system.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-cyan-500/30 focus:border-cyan-400 rounded px-10 py-2 text-sm text-white placeholder-cyan-950 outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase tracking-wider text-cyan-400/70 font-mono">Access Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-cyan-500/60" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cyan-950/40 border border-cyan-500/30 focus:border-cyan-400 rounded px-10 py-2 text-sm text-white placeholder-cyan-950 outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-cyan-550 border border-cyan-400 text-slate-950 hover:bg-cyan-400 hover:text-black font-extrabold uppercase text-xs tracking-widest shadow-[0_0_12px_rgba(0,229,255,0.4)] transition-all py-2.5 px-4 rounded cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Link Initializing...
                </span>
              ) : (
                isLogin ? "Connect to System" : "Awaken Profile"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-[10px] text-gray-500 relative z-10">
            {isLogin ? (
              <p>
                New entity detected?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="text-cyan-400 hover:underline font-mono"
                >
                  Create Hunter Account
                </button>
              </p>
            ) : (
              <p>
                Already registered in database?{' '}
                <button 
                  onClick={() => setIsLogin(true)}
                  className="text-cyan-400 hover:underline font-mono"
                >
                  Log In
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </HologramFrame>
    </div>
  );
}
