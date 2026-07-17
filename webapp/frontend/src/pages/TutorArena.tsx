import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, Sparkles, AlertCircle, BookOpen, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import HologramFrame from '../components/HologramFrame';

export default function TutorArena() {
  const { 
    chatHistory, sendMessage, fetchChatHistory, uploadDocument, user, roadmap 
  } = useAppStore();
  
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Quiz states
  const [quizTopic, setQuizTopic] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Set default quiz topic to current week title if available
  useEffect(() => {
    const activeMain = roadmap.find(q => q.status === 'ACTIVE');
    if (activeMain && !quizTopic) {
      setQuizTopic(activeMain.title);
    }
  }, [roadmap, quizTopic]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    
    setIsSending(true);
    const text = chatInput;
    setChatInput('');
    
    await sendMessage(text);
    setIsSending(false);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    const success = await uploadDocument(file);
    setIsUploading(false);
    
    if (success) {
      setUploadStatus({ type: 'success', text: `Indexed: ${file.name}` });
    } else {
      setUploadStatus({ type: 'error', text: `Failed to index file` });
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setIsGeneratingQuiz(true);
    setQuizResult(null);
    setActiveQuiz(null);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    
    try {
      const difficulty = user?.level && user.level >= 15 ? 'Advanced' : 'Intermediate';
      const response = await fetch(`http://localhost:8000/api/tutor/quiz?topic=${encodeURIComponent(quizTopic)}&difficulty=${difficulty}`, {
        headers: localStorage.getItem('questdemics_token') ? { 'Authorization': `Bearer ${localStorage.getItem('questdemics_token')}` } : {}
      });
      
      if (!response.ok) throw new Error();
      const data = await response.json();
      setActiveQuiz(data);
    } catch (err) {
      console.warn("Using local mock quiz generator.");
      const mockQuestions = [
        {
          id: 1,
          type: "MCQ",
          question: `What represents a core foundational constraint when deploying resources for "${quizTopic}"?`,
          options: ["Horizontal scalability bottlenecks", "Memory leakage loops", "Stateless synchronization limits", "Single-point storage constraints"],
          answer: "Horizontal scalability bottlenecks",
          explanation: "Scaling horizontally requires careful synchronization of state and stateless workers."
        },
        {
          id: 2,
          type: "TRUE_FALSE",
          question: `True or False: Building comprehensive integrations around "${quizTopic}" triggers immediate promotion loops within the System.`,
          answer: "True",
          explanation: "Mastery of advanced chapters provides promotion parameters."
        }
      ];
      setActiveQuiz({ topic: quizTopic, questions: mockQuestions });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectOption = (val: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIdx]: val
    });
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      setIsSubmittingQuiz(true);
      
      let correctCount = 0;
      activeQuiz.questions.forEach((q: any, idx: number) => {
        if (selectedAnswers[idx] === q.answer) {
          correctCount++;
        }
      });
      const score = Math.round((correctCount / activeQuiz.questions.length) * 100);
      
      try {
        const response = await fetch(`http://localhost:8000/api/tutor/quiz/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('questdemics_token') ? { 'Authorization': `Bearer ${localStorage.getItem('questdemics_token')}` } : {})
          },
          body: JSON.stringify({
            topic: activeQuiz.topic,
            score,
            passed: score >= 60
          })
        });
        
        if (!response.ok) throw new Error();
        const resultData = await response.json();
        setQuizResult(resultData);
      } catch (err) {
        setQuizResult({
          passed: score >= 60,
          score,
          xp_earned: score >= 60 ? 150 : 20,
          gold_earned: score >= 60 ? 50 : 5
        });
      } finally {
        setIsSubmittingQuiz(false);
      }
    }
  };

  return (
    <HologramFrame maxWidth="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-cyan-100">
        
        {/* LEFT: Tutor Chat Console & File Upload */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
          
          {/* Chat window */}
          <div className="flex-1 holo-panel holo-panel-brackets rounded-sm flex flex-col overflow-hidden bg-slate-950/40">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Header */}
            <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center bg-slate-950/80 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
                <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
                  System Interface // Mentor Mode
                </span>
              </div>
              <span className="text-[9px] text-cyan-500/50 uppercase font-bold tracking-widest">RAG INTEL LOGS</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs relative z-10">
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'USER' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div className={`p-2 rounded-sm border text-[8px] uppercase font-extrabold shrink-0 self-start ${
                    msg.sender === 'USER' ? 'bg-cyan-950/20 border-cyan-500/30 text-white' : 'bg-cyan-950/60 text-cyan-400 border-cyan-400/50 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                  }`}>
                    {msg.sender === 'USER' ? 'User' : 'SYS'}
                  </div>

                  <div className={`p-3 rounded-sm border leading-normal whitespace-pre-wrap select-text ${
                    msg.sender === 'USER' 
                      ? 'bg-slate-950/60 text-gray-200 border-cyan-500/20' 
                      : 'bg-slate-950/90 text-gray-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.05)]'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="p-2 rounded-sm bg-cyan-950/60 text-cyan-400 border border-cyan-400/30 text-[8px] uppercase font-extrabold shrink-0">
                    SYS
                  </div>
                  <div className="p-3 bg-slate-950/90 border border-cyan-500/20 rounded-sm flex items-center gap-1.5 text-xs text-gray-500 italic">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> 
                    <span>Decoding parameters...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-cyan-500/20 bg-slate-950 flex gap-2 relative z-10">
              <input
                type="text"
                placeholder="Ask the System to explain a concept, generate flashcards, or review errors..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950/80 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 rounded-sm px-3 py-2.5 text-xs text-white placeholder-cyan-950 outline-none transition-all font-mono"
              />
              <button
                type="submit"
                disabled={isSending || !chatInput.trim()}
                className="p-2.5 bg-cyan-950/40 hover:bg-cyan-950/60 text-cyan-400 hover:text-white border border-cyan-500/40 hover:border-cyan-400 rounded-sm disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,229,255,0.15)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT: Document Upload & Quiz Panel */}
        <div className="space-y-6">
          
          {/* Resource Hub (Notes Upload) */}
          <div className="holo-panel p-5 rounded-sm space-y-4 bg-slate-950/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-cyan-500/25 pb-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Resource Upload Hub</span>
            </h3>
            <p className="text-[10px] text-cyan-555 uppercase leading-normal">
              Index notes, coding references, or PDFs. The Tutor utilizes indexed pages during chat queries.
            </p>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleUploadFile}
              accept=".txt,.md"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white py-2.5 rounded-sm font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isUploading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{isUploading ? 'Indexing File...' : 'Upload Notes (.txt, .md)'}</span>
            </button>

            {uploadStatus && (
              <div className={`p-2.5 rounded-sm border text-[10px] font-mono flex items-center gap-1.5 ${
                uploadStatus.type === 'success' ? 'bg-green-950/20 border-green-500/30 text-green-300' : 'bg-red-950/20 border-red-500/30 text-red-300'
              }`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>{uploadStatus.text}</span>
              </div>
            )}
          </div>

          {/* Dynamic Quiz Module */}
          <div className="holo-panel p-5 rounded-sm space-y-4 bg-slate-950/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2 border-b border-cyan-500/25 pb-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Dynamic Quiz Engine</span>
            </h3>

            {!activeQuiz && !quizResult && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Target topic (e.g. SQL joins, Hooks)"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-sm p-2.5 text-xs text-white placeholder-cyan-950 outline-none"
                />
                
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz || !quizTopic.trim()}
                  className="w-full bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/35 hover:border-cyan-400 text-cyan-400 hover:text-white py-2.5 rounded-sm font-bold uppercase text-xs tracking-widest shadow-[0_0_8px_rgba(0,229,255,0.15)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGeneratingQuiz ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{isGeneratingQuiz ? 'Constructing Parameters...' : 'Deploy Practice Quiz'}</span>
                </button>
              </div>
            )}

            {/* Quiz Active View */}
            {activeQuiz && !quizResult && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-mono text-cyan-500/50 uppercase font-bold">
                  <span>QUIZ ACTIVE</span>
                  <span>Q {currentQuestionIdx + 1} of {activeQuiz.questions.length}</span>
                </div>

                {/* Progress Indicator dots */}
                <div className="flex gap-1">
                  {activeQuiz.questions.map((_: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`flex-1 h-1 rounded-sm ${
                        idx === currentQuestionIdx ? 'bg-cyan-400 shadow-[0_0_8px_#00e5ff]' :
                        selectedAnswers[idx] !== undefined ? 'bg-cyan-950' : 'bg-slate-950'
                      }`}
                    />
                  ))}
                </div>

                {/* Question Text */}
                <div className="bg-slate-950/60 p-4 rounded-sm border border-cyan-500/20 text-xs leading-normal text-gray-300 font-mono select-text">
                  {activeQuiz.questions[currentQuestionIdx].question}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {activeQuiz.questions[currentQuestionIdx].type === 'TRUE_FALSE' ? (
                    ['True', 'False'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full p-2.5 text-left text-xs font-mono rounded-sm border transition-all cursor-pointer ${
                          selectedAnswers[currentQuestionIdx] === opt
                            ? 'bg-cyan-950/40 text-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                            : 'bg-slate-950 hover:bg-cyan-950/10 text-gray-400 border-cyan-500/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))
                  ) : activeQuiz.questions[currentQuestionIdx].options && activeQuiz.questions[currentQuestionIdx].options.length > 0 ? (
                    activeQuiz.questions[currentQuestionIdx].options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full p-2.5 text-left text-xs font-mono rounded-sm border transition-all cursor-pointer ${
                          selectedAnswers[currentQuestionIdx] === opt
                            ? 'bg-cyan-950/40 text-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                            : 'bg-slate-950 hover:bg-cyan-950/10 text-gray-400 border-cyan-500/20'
                        }`}
                      >
                        {opt}
                      </button>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Write code or explain answer..."
                        value={selectedAnswers[currentQuestionIdx] || ''}
                        onChange={(e) => handleSelectOption(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-sm p-2 text-xs font-mono text-white outline-none select-text"
                      />
                    </div>
                  )}
                </div>

                {/* Navigation button */}
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestionIdx] === undefined || isSubmittingQuiz}
                  className="w-full bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-400 hover:text-white border border-cyan-500/40 hover:border-cyan-400 py-2.5 rounded-sm font-bold uppercase text-xs tracking-widest shadow-[0_0_8px_rgba(0,229,255,0.1)] transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSubmittingQuiz ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    currentQuestionIdx === activeQuiz.questions.length - 1 ? 'Conclude Assessment' : 'Next Parameter'
                  )}
                </button>
              </div>
            )}

            {/* Quiz Result View */}
            {quizResult && (
              <div className="space-y-4 text-center">
                <div className="inline-flex p-3 rounded bg-slate-950 border border-cyan-500/30 text-cyan-400 mb-2 shadow-[0_0_10px_rgba(0,229,255,0.15)]">
                  {quizResult.passed ? <CheckCircle className="w-8 h-8 text-green-500 animate-pulse" /> : <XCircle className="w-8 h-8 text-red-500" />}
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white font-mono">
                  Quiz Result: {quizResult.passed ? 'PASSED' : 'FAILED'}
                </h4>
                <div className="text-3xl font-extrabold text-white tracking-wide font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                  {quizResult.score}%
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-mono py-2 text-left">
                  <div className="bg-slate-950/60 p-2.5 rounded border border-cyan-500/20">
                    <span className="text-gray-500 block uppercase text-[8px] font-bold">XP Gained</span>
                    <span className="text-sm font-bold text-cyan-400">+{quizResult.xp_earned} XP</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded border border-cyan-500/20">
                    <span className="text-gray-500 block uppercase text-[8px] font-bold">Gold Wealth</span>
                    <span className="text-sm font-bold text-cyan-400">+{quizResult.gold_earned} G</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setQuizResult(null);
                    setActiveQuiz(null);
                  }}
                  className="w-full bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 py-2.5 rounded-sm font-mono text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Conclude Quiz
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </HologramFrame>
  );
}
