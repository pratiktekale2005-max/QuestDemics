import React, { useState } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Target, Clock, BookOpen, Briefcase, GraduationCap, Compass, ShieldAlert } from 'lucide-react';
import BlueprintBackground from '../components/BlueprintBackground';
import HologramFrame from '../components/HologramFrame';

const QUESTIONS = [
  {
    key: 'goal',
    title: 'What do you want to master?',
    subtitle: 'The primary skill or technology you want to build competency in.',
    placeholder: 'E.g., Become a Machine Learning Engineer, Master Relational Databases...',
    icon: Target,
  },
  {
    key: 'duration',
    title: 'What is your target deadline?',
    subtitle: 'How much time do you want to dedicate to this main quest?',
    placeholder: 'E.g., 3 months, 180 days, 6 months...',
    icon: Clock,
  },
  {
    key: 'level',
    title: 'What is your current level?',
    subtitle: 'Self-assessment of your current skills in this area.',
    type: 'select',
    options: ['Novice', 'Beginner', 'Intermediate', 'Advanced'],
    icon: GraduationCap,
  },
  {
    key: 'hours',
    title: 'Hours available per day?',
    subtitle: 'Be honest. The System adapts your roadmap density accordingly.',
    placeholder: 'E.g., 2, 4, 6...',
    type: 'number',
    icon: BookOpen,
  },
  {
    key: 'style',
    title: 'Preferred learning style?',
    subtitle: 'How do you absorb knowledge most effectively?',
    type: 'select',
    options: ['Hands-on (Coding/Projects)', 'Video-heavy', 'Reading documentation', 'Interactive exercises'],
    icon: Compass,
  },
  {
    key: 'career',
    title: 'What is your career goal?',
    subtitle: 'The ultimate job role or application you are aiming to unlock.',
    placeholder: 'E.g., ML Engineer at Google, Fullstack Startup Founder...',
    icon: Briefcase,
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    goal: '',
    duration: '',
    level: 'Beginner',
    hours: '2',
    style: 'Hands-on (Coding/Projects)',
    career: '',
  });
  
  const [isInitializing, setIsInitializing] = useState(false);
  const { initializeGoal } = useAppStore();

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      triggerSystemAwakening();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const triggerSystemAwakening = async () => {
    setIsInitializing(true);
    
    const onboardingText = `
      Goal: ${answers.goal}
      Deadline: ${answers.duration}
      Current Skill Level: ${answers.level}
      Hours Available: ${answers.hours} hr/day
      Preferred Learning Style: ${answers.style}
      Career Goal: ${answers.career}
    `.trim();

    await initializeGoal(onboardingText);
  };

  const question = QUESTIONS[currentStep];
  const Icon = question.icon;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-rpg-bg flex flex-col items-center justify-center p-6 relative font-mono">
        <BlueprintBackground />
        
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 360, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)] mb-8"
        >
          <Sparkles className="w-8 h-8 text-cyan-400" />
        </motion.div>

        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2 drop-shadow-[0_0_8px_#00e5ff]">
          SYSTEM INITIALIZING
        </h2>
        <motion.p 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs text-cyan-400 uppercase tracking-widest font-mono"
        >
          Awakening Hunter Profile & Parsing Intent...
        </motion.p>
        
        <div className="mt-8 text-[10px] text-cyan-500/60 max-w-sm text-center leading-relaxed font-mono uppercase">
          <p>• Extracting career parameters...</p>
          <p className="mt-1 text-cyan-400">• Generating Main Quest chapters...</p>
          <p className="mt-1">• Configuring study arena matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rpg-bg flex items-center justify-center p-4 relative overflow-hidden font-mono">
      <BlueprintBackground />
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-4 px-2 font-mono text-[10px]">
          <span className="uppercase text-cyan-500/70 tracking-widest">SYSTEM INTAKE // PARAMETERS</span>
          <span className="text-cyan-400 font-bold">QUEST {currentStep + 1} OF {QUESTIONS.length}</span>
        </div>

        {/* Quest Card */}
        <HologramFrame maxWidth="max-w-[640px]">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="holo-panel holo-panel-brackets p-6 md:p-8 rounded bg-slate-950/60 border border-cyan-500/40 text-cyan-100 shadow-[0_0_20px_rgba(0,229,255,0.1)] backdrop-filter backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-cyan-950/40 rounded border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.15)]">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold tracking-wide text-white uppercase">{question.title}</h2>
                <p className="text-xs text-gray-400 leading-normal">{question.subtitle}</p>
              </div>
            </div>

            {/* Input / Choice Section */}
            <div className="mt-6">
              {question.type === 'select' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => setAnswers({ ...answers, [question.key]: option })}
                      className={`p-4 rounded border text-left text-xs font-bold uppercase transition-all tracking-wider cursor-pointer ${
                        answers[question.key] === option
                          ? 'bg-cyan-950/60 text-white border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                          : 'bg-cyan-950/15 text-gray-400 border-cyan-500/25 hover:border-cyan-500/50 hover:text-cyan-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type={question.type || 'text'}
                  placeholder={question.placeholder}
                  value={answers[question.key]}
                  onChange={(e) => setAnswers({ ...answers, [question.key]: e.target.value })}
                  className="w-full bg-cyan-950/40 border border-cyan-500/30 focus:border-cyan-400 rounded p-3 text-sm text-white placeholder-cyan-950 outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center mt-10 pt-4 border-t border-cyan-500/20 font-mono">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-[10px] uppercase tracking-wider text-gray-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Previous Parameter
              </button>
              
              <button
                onClick={handleNext}
                disabled={question.type !== 'select' && !answers[question.key]}
                className="bg-cyan-950/40 hover:bg-cyan-950/60 text-cyan-400 hover:text-white border border-cyan-500/40 hover:border-cyan-400 py-2 px-5 rounded flex items-center gap-2 text-[10px] uppercase tracking-widest font-extrabold shadow-[0_0_10px_rgba(0,229,255,0.1)] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <span>{currentStep === QUESTIONS.length - 1 ? 'Awaken System' : 'Next Parameter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </HologramFrame>
      </div>
    </div>
  );
}
