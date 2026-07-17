import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Brain, FileText, Send, User, ChevronRight, BarChart2, Briefcase, DollarSign, RotateCcw } from 'lucide-react';
import HologramFrame from '../components/HologramFrame';

export default function CareerCoach() {
  const { 
    resumeAnalysis, 
    analyzeResume, 
    interviewHistory, 
    sendInterviewMessage, 
    resetInterview 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'RESUME' | 'INTERVIEW'>('RESUME');
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewing, setInterviewing] = useState(false);
  const [started, setStarted] = useState(false);

  // Resume Analyst Submit
  const handleResumeSubmit = async () => {
    if (!resumeText.trim()) return;
    setAnalyzing(true);
    try {
      await analyzeResume(resumeText);
    } finally {
      setAnalyzing(false);
    }
  };

  // Interview Arena message send
  const handleSendResponse = async () => {
    const textToSend = userAnswer.trim();
    if (!textToSend && started) return;
    
    setInterviewing(true);
    setUserAnswer('');
    
    const msg = started ? textToSend : 'start';
    if (!started) {
      setStarted(true);
    }
    
    try {
      await sendInterviewMessage(msg);
    } finally {
      setInterviewing(false);
    }
  };

  const handleResetInterview = () => {
    resetInterview();
    setStarted(false);
  };

  // Simple formatter for critique text supporting markdown-like syntax
  const formatMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('###')) {
        return <h4 key={idx} className="text-xs font-bold text-white uppercase mt-4 mb-2">{line.replace('###', '').trim()}</h4>;
      }
      if (line.startsWith('*')) {
        return <li key={idx} className="list-disc list-inside text-gray-300 mb-1 ml-2">{line.replace('*', '').trim()}</li>;
      }
      return <p key={idx} className="text-gray-400 mb-2 leading-relaxed">{line}</p>;
    });
  };

  // Helper to split feedback and question in chat bubbles
  const parseChatBubble = (msgText: string) => {
    if (msgText.includes('*System Feedback:')) {
      const parts = msgText.split('*\n\n');
      const feedbackPart = parts[0].replace('*System Feedback:', '').trim();
      const questionPart = parts.slice(1).join('*\n\n').trim();
      return (
        <div className="space-y-3 w-full">
          {feedbackPart && (
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-sm text-[10px] text-cyan-300 font-mono leading-relaxed uppercase">
              <span className="font-extrabold text-[8px] block text-cyan-400 mb-1">SYSTEM INSIGHT</span>
              {feedbackPart}
            </div>
          )}
          <p className="text-xs text-gray-200 leading-relaxed font-sans">{questionPart}</p>
        </div>
      );
    }
    return <p className="text-xs text-gray-200 leading-relaxed font-sans">{msgText}</p>;
  };

  return (
    <HologramFrame maxWidth="max-w-7xl">
      <div className="space-y-6 font-mono pb-16 text-cyan-100">
        
        {/* Header */}
        <div>
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white flex items-center gap-2 drop-shadow-[0_0_8px_#00e5ff]">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span>AI Career Coach</span>
          </h1>
          <p className="text-[10px] text-cyan-500/70 uppercase tracking-wider mt-1">Unlock expert-level resumes and simulate technical interviews inside the Chamber.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-500/20 pb-3 gap-2">
          <button
            onClick={() => setActiveTab('RESUME')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              activeTab === 'RESUME'
                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-cyan-950/20'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Analyst</span>
          </button>
          <button
            onClick={() => setActiveTab('INTERVIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              activeTab === 'INTERVIEW'
                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-cyan-950/20'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Interview Arena</span>
          </button>
        </div>

        {/* Resume Analyst Tab */}
        {activeTab === 'RESUME' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Paste Area */}
            <div className="holo-panel holo-panel-brackets rounded-sm p-6 space-y-4 bg-slate-950/40">
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-10">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Analyze Your Profile</h3>
                <p className="text-[9px] text-cyan-500/50 uppercase tracking-widest mt-1">Paste your plain text resume or qualifications summary below.</p>
              </div>
              
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                disabled={analyzing}
                placeholder={`John Doe\nSoftware Developer\n\nExperience:\n- Built APIs using FastAPI...\n- Configured cloud networking...`}
                rows={12}
                className="w-full bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 text-gray-200 font-mono text-xs rounded-sm p-4 outline-none resize-y relative z-10 select-text"
              />

              <div className="flex justify-end relative z-10">
                <button
                  disabled={analyzing || !resumeText.trim()}
                  onClick={handleResumeSubmit}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-sm border text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                    resumeText.trim()
                      ? 'bg-cyan-550 border-cyan-400 text-slate-950 hover:bg-cyan-400 hover:text-black shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                      : 'bg-transparent border-cyan-550/20 text-gray-550 cursor-not-allowed'
                  }`}
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-3.5 h-3.5 text-slate-950" />
                      <span>Analyze Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {resumeAnalysis ? (
                <>
                  {/* Critique */}
                  <div className="holo-panel rounded-sm p-6 space-y-3 bg-slate-950/40">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-500/20 pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Recruiter Feedback
                    </h3>
                    <div className="text-xs space-y-1 select-text">
                      {formatMarkdown(resumeAnalysis.critique)}
                    </div>
                  </div>

                  {/* Customized Projects */}
                  {resumeAnalysis.projects && (
                    <div className="holo-panel rounded-sm p-6 space-y-4 bg-slate-950/40">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-cyan-500/20 pb-2 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-cyan-400" />
                        Suggested Standout Projects
                      </h3>
                      <div className="space-y-3">
                        {resumeAnalysis.projects.map((proj: any, idx: number) => (
                          <div key={idx} className="bg-slate-950/80 border border-cyan-500/20 rounded-sm p-4 space-y-2 select-text">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <ChevronRight className="w-4 h-4 text-cyan-400" />
                              {proj.title}
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-normal pl-5 font-mono">
                              {proj.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Salary Stats */}
                  {resumeAnalysis.salary_stats && (
                    <div className="holo-panel rounded-sm p-6 space-y-4 bg-slate-950/40">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-cyan-500/20 pb-2 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-cyan-400" />
                        Compensation Estimates
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/80 p-4 rounded-sm border border-cyan-500/20 flex flex-col items-center select-text">
                          <span className="text-[8px] text-gray-500 uppercase font-mono">Average Base</span>
                          <span className="text-base font-extrabold text-cyan-400 font-mono flex items-center mt-1">
                            <DollarSign className="w-4 h-4" />
                            {resumeAnalysis.salary_stats.average}
                          </span>
                        </div>
                        <div className="bg-slate-950/80 p-4 rounded-sm border border-cyan-500/20 flex flex-col items-center select-text">
                          <span className="text-[8px] text-gray-500 uppercase font-mono">Market Range</span>
                          <span className="text-xs font-extrabold text-gray-300 font-mono mt-2">
                            {resumeAnalysis.salary_stats.range}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="holo-panel rounded-sm p-12 text-center text-cyan-550/40 italic text-xs leading-relaxed uppercase bg-slate-950/40">
                  Paste your resume details on the left and trigger analysis to review System critiquing reports, suggested focus projects, and salary bounds.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview Arena Tab */}
        {activeTab === 'INTERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {/* Holographic AI Orb Panel */}
            <div className="holo-panel holo-panel-brackets p-6 rounded-sm flex flex-col items-center justify-center space-y-4 shadow-[0_0_15px_rgba(0,229,255,0.1)] min-h-[300px] lg:min-h-0 relative overflow-hidden bg-black/40">
              <div className="absolute inset-0 z-0">
                <video 
                  src="https://www.shutterstock.com/shutterstock/videos/3473921799/preview/stock-footage-glowing-particle-d-sphere-in-the-universe-abstract-glittering-energy-orb-of-purple-particles.webm"
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover mix-blend-screen opacity-75"
                />
              </div>
              
              <div className="relative z-10 text-center space-y-2">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block animate-pulse font-bold">COACH LINK ACTIVE</span>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">AI Coach Entity</h4>
                <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed mx-auto uppercase">
                  Analyzing conversational patterns and projecting technical interview milestones.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 holo-panel holo-panel-brackets rounded-sm h-[55vh] flex flex-col justify-between overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.15)] bg-slate-950/40">
              
              {/* Header info */}
              <div className="p-3 border-b border-cyan-500/20 bg-slate-950 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
                  <span className="font-extrabold text-white uppercase tracking-wider font-mono text-[9px]">Interviewer Link Active</span>
                </div>
                
                {started && (
                  <button
                    onClick={handleResetInterview}
                    className="flex items-center gap-1 text-[8px] uppercase font-mono text-red-500 hover:text-red-400 transition-colors cursor-pointer border border-red-500/25 px-2 py-0.5 rounded bg-red-950/10"
                  >
                    <RotateCcw className="w-3 h-3 text-red-500" />
                    <span>Reset Arena</span>
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {!started ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <Briefcase className="w-10 h-10 text-cyan-500/30 animate-bounce" />
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase">Ready to Face the Chamber?</h4>
                      <p className="text-[10px] text-cyan-500/60 max-w-sm mt-1.5 leading-relaxed uppercase">
                        Start the Technical & Behavioral mock interview. The System Interviewer will ask queries, evaluate your feedback, and track your responses.
                      </p>
                    </div>
                    <button
                      onClick={handleSendResponse}
                      disabled={interviewing}
                      className="px-6 py-2 border border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-400 hover:text-white text-xs font-extrabold uppercase tracking-widest rounded-sm transition-all cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                    >
                      {interviewing ? 'Connecting...' : 'Initiate Interview'}
                    </button>
                  </div>
                ) : (
                  interviewHistory.map((chat) => {
                    const isSystem = chat.sender === 'SYSTEM';
                    return (
                      <div 
                        key={chat.id} 
                        className={`flex gap-3 max-w-[85%] ${isSystem ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                      >
                        <div className={`w-8 h-8 rounded-sm border flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                          isSystem 
                            ? 'bg-slate-950 border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.15)]' 
                            : 'bg-cyan-950/30 border-cyan-500/40 text-gray-300'
                        }`}>
                          {isSystem ? 'S' : <User className="w-4 h-4 text-cyan-400" />}
                        </div>
                        
                        <div className={`rounded-sm p-3 border shadow-sm ${
                          isSystem 
                            ? 'bg-slate-950/90 border-cyan-500/20' 
                            : 'bg-slate-950/60 border-cyan-500/40'
                        }`}>
                          {isSystem ? parseChatBubble(chat.message) : <p className="text-xs text-gray-200 leading-normal select-text font-sans">{chat.message}</p>}
                          <span className="text-[8px] text-gray-555 font-mono mt-1 block text-right">
                            {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Bar */}
              {started && (
                <div className="p-3 border-t border-cyan-500/20 bg-slate-950 flex gap-2">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={interviewing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendResponse();
                    }}
                    placeholder="Type your response to the interviewer..."
                    className="flex-1 bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 text-xs text-gray-200 font-mono px-4 py-2.5 rounded-sm outline-none focus:ring-1 focus:ring-cyan-500/30"
                  />
                  
                  <button
                    disabled={interviewing || !userAnswer.trim()}
                    onClick={handleSendResponse}
                    className={`p-2.5 border rounded-sm flex items-center justify-center transition-all cursor-pointer ${
                      userAnswer.trim()
                        ? 'bg-cyan-550 border-cyan-400 text-slate-950 hover:bg-cyan-400 hover:text-black shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                        : 'bg-transparent border-cyan-500/20 text-gray-550 cursor-not-allowed'
                    }`}
                  >
                    {interviewing ? (
                      <div className="animate-spin h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </HologramFrame>
  );
}
