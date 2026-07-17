import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Sparkles, Code, AlertTriangle, CheckCircle, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import HologramFrame from '../components/HologramFrame';

export default function JobChange() {
  const { 
    user, 
    bossBattle, 
    fetchBossChallenge, 
    fetchJobChoices, 
    challengeJobChange, 
    submitBossSolution,
    fetchProfile
  } = useAppStore();

  const [choices, setChoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [solutionCode, setSolutionCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const loadChoices = async () => {
      if (user && user.level >= 5) {
        const c = await fetchJobChoices();
        setChoices(c);
      }
      await fetchBossChallenge();
      setLoading(false);
    };
    loadChoices();
  }, [user, fetchBossChallenge, fetchJobChoices]);

  // Timer for active trial
  useEffect(() => {
    if (!bossBattle || bossBattle.status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      const diff = new Date(bossBattle.due_date).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Trial Expired');
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${mins}m ${secs}s remaining`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [bossBattle]);

  const selectClass = async (className: string) => {
    setLoading(true);
    try {
      await challengeJobChange(className);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeSubmit = async () => {
    if (!bossBattle || !solutionCode.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitBossSolution(bossBattle.id, solutionCode);
      setFeedback(result);
      await fetchProfile();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-cyan-550/70 font-mono">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
        <span>Loading Class Portals...</span>
      </div>
    );
  }

  // Check level lock
  if (user && user.level < 5) {
    return (
      <HologramFrame maxWidth="max-w-[620px]">
        <div className="holo-panel holo-panel-brackets rounded-sm p-8 md:p-12 text-center space-y-6 shadow-[0_0_20px_rgba(239,68,68,0.15)] border-red-500/40 font-mono text-cyan-100">
          <div className="mx-auto w-16 h-16 rounded-sm bg-red-950/20 border border-red-500/35 flex items-center justify-center text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black uppercase tracking-widest text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">Class Awakening Locked</h2>
            <p className="text-[10px] font-bold text-red-400">MINIMUM LEVEL REQUIRED: 5</p>
          </div>
          <p className="text-xs text-gray-400 leading-normal uppercase">
            Hunter, your current Level is {user.level}. The Job Change trials require a baseline rank. Return here once you have conquered enough Daily Quests to unlock specialized career paths.
          </p>
          <div className="w-full bg-slate-950 border border-cyan-500/20 h-2.5 rounded-sm overflow-hidden p-[1px]">
            <div 
              style={{ width: `${(user.level / 5) * 100}%` }}
              className="bg-gradient-to-r from-red-500 to-cyan-400 h-full rounded-sm"
            />
          </div>
        </div>
      </HologramFrame>
    );
  }

  // Active Job Change Trial (Boss Battle)
  const isJobChangeBoss = bossBattle && (bossBattle.title.includes("Awakening") || (bossBattle.content && bossBattle.content.is_job_change));
  
  if (bossBattle && bossBattle.status === 'ACTIVE' && isJobChangeBoss) {
    const requirements = bossBattle.content?.requirements || [];
    return (
      <HologramFrame maxWidth="max-w-4xl">
        <div className="space-y-6 font-mono text-cyan-100 pb-16">
          <div className="holo-panel holo-panel-brackets rounded-sm p-6 space-y-4 bg-slate-950/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-4">
              <div>
                <span className="text-[9px] text-cyan-400 uppercase tracking-widest block font-bold">ACTIVE AWAKENING TRIAL</span>
                <h2 className="text-xl font-extrabold text-white uppercase tracking-wider drop-shadow-[0_0_8px_#00e5ff]">{bossBattle.title}</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/20 border border-red-500/30 rounded-sm text-red-400 text-xs font-bold animate-pulse">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-cyan-400 uppercase mb-1">Objectives</h3>
                <p className="text-xs text-gray-300 leading-normal">{bossBattle.description}</p>
              </div>

              {requirements.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2">Requirements</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {requirements.map((req: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-950/80 border border-cyan-500/20 p-2.5 rounded-sm text-[11px] text-gray-300">
                        <Code className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span className="leading-normal">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Submission Panel */}
          <div className="holo-panel rounded-sm p-6 space-y-4 bg-slate-950/40">
            <div>
              <h3 className="text-xs font-bold text-white uppercase">Awakening Trial Chamber</h3>
              <p className="text-[9px] text-cyan-500/50 uppercase tracking-widest mt-1">Paste your trial code solution or implementation details below.</p>
            </div>

            <textarea
              value={solutionCode}
              onChange={(e) => setSolutionCode(e.target.value)}
              disabled={submitting}
              placeholder={`# Write your solution code here...`}
              rows={12}
              className="w-full bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 text-gray-200 font-mono text-xs rounded-sm p-4 outline-none resize-y select-text"
            />

            <div className="flex justify-end gap-3">
              <button
                disabled={submitting || !solutionCode.trim()}
                onClick={handleChallengeSubmit}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-sm border text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                  solutionCode.trim()
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 hover:bg-cyan-400 hover:text-black shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-transparent border-cyan-550/20 text-gray-550 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Submit Awakening Solution</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Panel */}
          {feedback && (
            <div className={`border rounded-sm p-6 space-y-4 ${feedback.passed ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-red-950/20 border-red-500/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}>
              <div className="flex items-center gap-2.5">
                {feedback.passed ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Trial Evaluated: {feedback.passed ? 'AWAKENED SUCCESS' : 'AWAKENING FAILED'}
                  </h3>
                  <span className="text-[9px] font-mono uppercase">Score: {feedback.score} / 100</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-950 rounded border border-cyan-500/20 font-mono text-xs leading-normal text-gray-300 select-text">
                {feedback.feedback}
              </div>

              {feedback.passed ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer"
                  >
                    Enter Awakened Dashboard
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 bg-red-900 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </HologramFrame>
    );
  }

  // Render Job Change Choices
  return (
    <HologramFrame maxWidth="max-w-6xl">
      <div className="space-y-6 font-mono text-cyan-100 pb-16">
        <div>
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white flex items-center gap-2 drop-shadow-[0_0_8px_#00e5ff]">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Class Awakening Portal</span>
          </h1>
          <p className="text-[10px] text-cyan-500/70 uppercase mt-1 tracking-wider">Select your specialized path. Solving the Class trial updates your Hunter Title and refines your roadmap.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {choices.map((choice) => (
            <div 
              key={choice.class_name} 
              className="holo-panel holo-panel-brackets p-6 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden group shadow-[0_0_12px_rgba(0,229,255,0.05)] bg-slate-950/40"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    {choice.class_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-sm bg-slate-950 text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest border border-cyan-500/30">
                    {choice.difficulty}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-normal font-sans">
                  {choice.description}
                </p>
              </div>

              <div className="pt-2 flex justify-end relative z-10">
                <button
                  onClick={() => selectClass(choice.class_name)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold uppercase tracking-wider text-cyan-400 rounded-sm hover:bg-cyan-950/20 transition-all cursor-pointer"
                >
                  <span>Awaken Path</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </HologramFrame>
  );
}
