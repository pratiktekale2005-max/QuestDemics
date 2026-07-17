import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store';

import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import StudyArena from './pages/StudyArena';
import TutorArena from './pages/TutorArena';
import BossArena from './pages/BossArena';
import Analytics from './pages/Analytics';
import Shop from './pages/Shop';
import JobChange from './pages/JobChange';
import CareerCoach from './pages/CareerCoach';
import StatusScreen from './pages/StatusScreen';
import ElectricBackground from './components/ElectricBackground';
import BlueprintBackground from './components/BlueprintBackground';

import { 
  Shield, Compass, Clock, BookOpen, Trophy, 
  Activity, LogOut, Flame, Sparkles, ChevronRight, Menu,
  ShoppingBag, Brain, Bell, Check
} from 'lucide-react';

function LayoutShell() {
  const { 
    user, logout, roadmap, fetchRoadmap, 
    notifications, fetchNotifications, readNotification 
  } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchRoadmap();
    fetchNotifications();
  }, [fetchRoadmap, fetchNotifications]);

  if (!user) return <Navigate to="/login" replace />;

  // Force onboarding if roadmap is empty (system not initialized)
  if (roadmap.length === 0) {
    return <Onboarding />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Compass },
    { name: 'Status Screen', path: '/status', icon: Shield },
    { name: 'Study Arena', path: '/study', icon: Clock },
    { name: 'Tutor Arena', path: '/tutor', icon: BookOpen },
    { name: 'Boss Arena', path: '/boss', icon: Trophy },
    { name: 'Analytics', path: '/analytics', icon: Activity },
    { name: 'System Shop', path: '/shop', icon: ShoppingBag },
    { name: 'Job Change', path: '/job-change', icon: Sparkles },
    { name: 'AI Coach', path: '/coach', icon: Brain },
  ];

  const xpNeeded = user.level * 1000;
  const xpPercentage = Math.min((user.xp / xpNeeded) * 100, 100);

  return (
    <div className="min-h-screen bg-rpg-bg holo-bg holo-flicker text-gray-200 flex flex-col md:flex-row relative overflow-hidden">
      <ElectricBackground />
      <BlueprintBackground />
      <div className="holo-scanline" />
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-rpg-dark/70 md:bg-rpg-dark/45 border-b md:border-b-0 md:border-r border-rpg-border flex flex-col shrink-0">
        
        {/* Logo Banner */}
        <div className="p-5 border-b border-rpg-border flex items-center gap-3">
          <div className="p-1.5 rounded bg-rpg-dark border border-rpg-gold text-rpg-gold shadow-rpg-glow">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-widest text-white uppercase">
              QuestDemics
            </h1>
            <span className="text-[9px] font-mono text-rpg-gold uppercase tracking-wider block">
              System Active
            </span>
          </div>
        </div>

        {/* User Mini HUD in Sidebar (for desktop) */}
        <div className="p-4 border-b border-rpg-border/60 bg-rpg-dark/20 hidden md:block">
          <div className="flex justify-between items-center text-xs font-mono text-gray-400 mb-1.5">
            <span>LEVEL {user.level}</span>
            <span className="text-rpg-gold font-bold">{user.rank}</span>
          </div>
          <div className="w-full bg-rpg-dark h-2 rounded border border-rpg-border overflow-hidden p-[1px]">
            <div 
              style={{ width: `${xpPercentage}%` }}
              className="bg-gradient-to-r from-rpg-xp to-indigo-500 h-full rounded shadow-xp-glow"
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-2">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> {user.streak} Days
            </span>
            <span>{user.gold} Gold</span>
          </div>
        </div>

        {/* Menu Options */}
        <nav className="flex-1 p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between p-3 rounded text-xs uppercase tracking-wider font-extrabold transition-all border ${
                  isActive 
                    ? 'bg-rpg-card text-rpg-gold border-rpg-gold shadow-rpg-glow' 
                    : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-rpg-dark/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-rpg-border">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-rpg-dark hover:bg-red-950/20 border border-rpg-border hover:border-red-500/40 text-gray-400 hover:text-red-400 rounded text-xs uppercase font-mono tracking-wider transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Link</span>
          </button>
        </div>

      </aside>

      {/* MAIN VIEW CONTENT WORKSPACE */}
      <main className="flex-1 overflow-y-auto bg-rpg-bg flex flex-col">
        
        {/* TOP HUD HEADER BAR */}
        <header className="bg-rpg-dark/60 border-b border-rpg-border p-4 flex justify-between items-center relative z-40">
          <div>
            <h2 className="text-xs font-bold text-rpg-gold tracking-widest uppercase">
              {user.class_name}
            </h2>
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block">HUNTER SPECIALIZATION</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications Droptray */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded rpg-glass hover:border-rpg-gold text-gray-400 hover:text-rpg-gold transition-all cursor-pointer shadow-sm"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rpg-health text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse border border-rpg-bg">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rpg-glass rounded-md shadow-2xl overflow-hidden text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-rpg-border bg-rpg-dark flex justify-between items-center">
                    <span className="font-extrabold text-white uppercase tracking-wider font-mono text-[10px]">System Alerts</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[9px] font-mono uppercase text-gray-500 hover:text-rpg-gold transition-colors"
                    >
                      Dismiss View
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-rpg-border/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 italic">No alerts in system logs.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3 transition-colors ${notif.read ? 'bg-transparent text-gray-400' : 'bg-rpg-dark/40 text-white border-l-2 border-rpg-gold'}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <p className="leading-relaxed">{notif.message}</p>
                            {!notif.read && (
                              <button 
                                onClick={() => readNotification(notif.id)}
                                className="text-rpg-gold hover:text-rpg-goldLight p-0.5 rounded hover:bg-rpg-dark/80 shrink-0"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[8px] text-gray-500 font-mono mt-1.5 block">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Stats Panel */}
            <div className="flex items-center gap-3 text-[11px] font-mono bg-rpg-dark/80 border border-rpg-border/80 px-3 py-1.5 rounded">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-gray-300 font-bold">{user.streak}D</span>
              </div>
              <div className="w-px h-3 bg-rpg-border" />
              <div className="flex items-center gap-1 text-rpg-gold">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="font-bold">{user.gold}G</span>
              </div>
              <div className="w-px h-3 bg-rpg-border" />
              <div className="text-rpg-xp font-bold">LV {user.level}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/status" element={<StatusScreen />} />
            <Route path="/study" element={<StudyArena />} />
            <Route path="/tutor" element={<TutorArena />} />
            <Route path="/boss" element={<BossArena />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/job-change" element={<JobChange />} />
            <Route path="/coach" element={<CareerCoach />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

    </div>
  );
}

export default function App() {
  const { isAuthenticated, token, fetchProfile, user } = useAppStore();

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  if (token && !user) {
    return (
      <div className="min-h-screen bg-rpg-bg flex flex-col items-center justify-center font-mono text-gray-500">
        <div className="animate-spin h-8 w-8 border-4 border-rpg-gold border-t-transparent rounded-full mb-4" />
        <span>Synchronizing with System...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/*" 
          element={isAuthenticated ? <LayoutShell /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
