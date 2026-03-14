"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Bot, Send, Hash, Loader2, Search, Menu, X, Layers, BrainCircuit, User, Plus, Clock, Edit2, Trash2, Check, SquareSquare } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// The full, correct Markdown & Math stack
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';

import { getAiContexts, getUserSessions, getSessionHistory, processAiQuery, updateSessionName, deleteSession } from "@/app/actions/ai";

// --- Types ---
type Unit = { id: number; unit_number: number; unit_title: string; };
type Subject = { id: number; course_code: string; course_title: string; semester_id: number; semesters?: { semester_number: number }; units: Unit[]; };
type ChatMessage = { id: number; role: string; message: string; created_at?: string; };
type Session = { id: number; session_name: string; created_at: string; unit_id: number; units: { unit_number: number; unit_title: string; subjects: { course_code: string; course_title: string; } } };

// --- IMPROVED LATEX PREPROCESSOR ---
const preprocessLaTeX = (content: string) => {
  if (!content) return "";
  
  let processed = content
    // Replace \[ and \] with $$ block math
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    // Replace \( and \) with $ inline math
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    // Fix common matrix patterns
    .replace(/\\begin\{matrix\}/g, '\\begin{matrix}')
    .replace(/\\end\{matrix\}/g, '\\end{matrix}')
    .replace(/\\begin\{bmatrix\}/g, '\\begin{bmatrix}')
    .replace(/\\end\{bmatrix\}/g, '\\end{bmatrix}')
    .replace(/\\begin\{pmatrix\}/g, '\\begin{pmatrix}')
    .replace(/\\end\{pmatrix\}/g, '\\end{pmatrix}')
    .replace(/\\begin\{vmatrix\}/g, '\\begin{vmatrix}')
    .replace(/\\end\{vmatrix\}/g, '\\end{vmatrix}')
    // Ensure proper line breaks around matrices
    .replace(/\$\$\\begin\{([a-z]+)matrix\}/g, '\n$$\\begin{$1matrix}')
    .replace(/\\end\{([a-z]+)matrix\}\$\$/g, '\\end{$1matrix}$$\n');
  
  return processed;
};

// --- ISOLATED INPUT COMPONENT ---
const ChatInput = ({ onSend, isTyping, placeholder, isWaitingForNetwork }: { onSend: (msg: string) => void, isTyping: boolean, placeholder: string, isWaitingForNetwork: boolean }) => {
  const [localMessage, setLocalMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localMessage.trim() || isWaitingForNetwork) return;
    onSend(localMessage);
    setLocalMessage(""); 
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 border border-transparent focus-within:border-[#00BC7D]/50 transition-colors shadow-sm">
      <textarea 
        value={localMessage} 
        onChange={(e) => setLocalMessage(e.target.value)} 
        onKeyDown={(e) => { 
          if (e.key === 'Enter' && !e.shiftKey) { 
            if(window.innerWidth > 768) { e.preventDefault(); handleSubmit(e); }
          } 
        }} 
        placeholder={placeholder} 
        className="w-full bg-transparent border-none py-2.5 sm:py-4 pl-3 sm:pl-5 pr-2 text-[13px] sm:text-[15px] font-medium resize-none outline-none max-h-24 sm:max-h-32 custom-scrollbar placeholder:text-muted-foreground/60" 
        rows={1} 
        disabled={isWaitingForNetwork} 
      />
      <button type="submit" disabled={!localMessage.trim() || isWaitingForNetwork} className="p-2 sm:p-3.5 bg-foreground text-background rounded-xl sm:rounded-2xl hover:bg-[#00BC7D] hover:text-white disabled:opacity-50 transition-all shrink-0 mb-0.5 mr-0.5">
        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </form>
  );
};

// --- SUPER-FAST TYPEWRITER COMPONENT ---
const TypewriterMessage = ({ content, speed = 1, onComplete }: { content: string, speed?: number, onComplete: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState("");

  useEffect(() => {
    let currentLength = 0;
    setDisplayedContent(""); 
    
    const timer = setInterval(() => {
      // Chunking: print 25 characters at a time to make it faster
      currentLength += 25;
      if (currentLength >= content.length) {
        setDisplayedContent(content);
        clearInterval(timer);
        onComplete();
      } else {
        setDisplayedContent(content.substring(0, currentLength));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [content, speed, onComplete]);

  return (
    <div className="prose prose-zinc dark:prose-invert prose-sm sm:prose-base max-w-none 
      prose-p:leading-relaxed prose-p:mb-5
      prose-headings:font-black prose-headings:tracking-tight prose-headings:mt-8 prose-headings:mb-4
      prose-li:marker:text-[#00BC7D] prose-li:my-1.5
      prose-ul:mb-5 prose-ol:mb-5
      prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-2xl prose-pre:p-5
      prose-code:text-[#00BC7D] prose-code:bg-[#00BC7D]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold prose-code:before:content-none prose-code:after:content-none
      prose-table:w-full prose-table:border-collapse prose-table:mb-6
      prose-th:border prose-th:border-border prose-th:bg-zinc-100 dark:prose-th:bg-zinc-900 prose-th:p-3 prose-th:text-left
      prose-td:border prose-td:border-border prose-td:p-3
      prose-strong:text-foreground prose-strong:font-black
      [&_.katex-display]:overflow-x-auto [&_.katex-display]:custom-scrollbar [&_.katex-display]:py-4 [&_.katex-display]:my-6 [&_.katex-display]:bg-background/50 [&_.katex-display]:border [&_.katex-display]:border-border/50 [&_.katex-display]:rounded-xl
    ">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        // Strict false and inherit error color ensures NO RED TEXT on bad LLM output
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: 'inherit' }]]}
      >
        {preprocessLaTeX(displayedContent)}
      </ReactMarkdown>
    </div>
  );
};


export default function AiAskPage() {
  const [sidebarTab, setSidebarTab] = useState<'new' | 'history'>('new');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editSessionName, setEditSessionName] = useState("");

  const [loadingChannels, setLoadingChannels] = useState(true);
  const [isWaitingForNetwork, setIsWaitingForNetwork] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const [ctxRes, sessRes] = await Promise.all([getAiContexts(), getUserSessions()]);
      if (ctxRes.channels) setSubjects(ctxRes.channels);
      if (sessRes.sessions) setSessions(sessRes.sessions);
      
      if (ctxRes.channels) {
        const firstSub = ctxRes.channels.find((s: Subject) => s.units.length > 0);
        if (firstSub) {
          setActiveSubject(firstSub);
          setActiveUnit(firstSub.units.sort((a: Unit, b: Unit) => a.unit_number - b.unit_number)[0]);
        }
      }
      setLoadingChannels(false);
    }
    loadData();
  }, []);

  const loadSessionChat = async (session: Session) => {
    setCurrentSessionId(session.id);
    setActiveUnit({ id: session.unit_id, unit_number: session.units.unit_number, unit_title: session.units.unit_title });
    setActiveSubject({ id: 0, course_code: session.units.subjects.course_code, course_title: session.units.subjects.course_title, semester_id: 0, units: [] });
    
    setMessages([]); 
    setIsWaitingForNetwork(true);
    setMobileMenuOpen(false);

    const res = await getSessionHistory(session.id);
    if (res.messages) {
      setMessages(res.messages);
      setTypingMessageId(null); 
    }
    setIsWaitingForNetwork(false);
    scrollToBottom();
  };

  const startNewChat = (unit: Unit, subject: Subject) => {
    setActiveUnit(unit);
    setActiveSubject(subject);
    setCurrentSessionId(null);
    setMessages([]);
    setTypingMessageId(null);
    setMobileMenuOpen(false);
  };

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  // Auto-scroll while typewriter is active
  useEffect(() => {
    if (typingMessageId) {
      const interval = setInterval(scrollToBottom, 200);
      return () => clearInterval(interval);
    }
  }, [typingMessageId]);

  const uniqueSemesters = useMemo(() => {
    const sems = new Map<number, number>();
    subjects.forEach(sub => { if (!sems.has(sub.semester_id)) sems.set(sub.semester_id, sub.semesters?.semester_number || sub.semester_id); });
    return Array.from(sems.entries()).map(([id, num]) => ({ id, num })).sort((a, b) => a.num - b.num);
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => {
      if (selectedSemester !== 'ALL' && sub.semester_id !== selectedSemester) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return sub.course_code.toLowerCase().includes(q) || sub.course_title.toLowerCase().includes(q) || sub.units.some(u => u.unit_title.toLowerCase().includes(q));
      }
      return true;
    });
  }, [subjects, searchQuery, selectedSemester]);

  const handleEditSave = async (id: number) => {
    if (!editSessionName.trim()) return setEditingSessionId(null);
    const res = await updateSessionName(id, editSessionName);
    if (res.success) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, session_name: editSessionName } : s));
      toast.success("Transmission renamed");
    } else toast.error(res.error);
    setEditingSessionId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this transmission log forever?")) return;
    const res = await deleteSession(id);
    if (res.success) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast.success("Transmission purged");
    } else toast.error(res.error);
  };

  const handleSendMessage = async (msgText: string) => {
    if (!activeUnit) return;
    
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, role: "user", message: msgText }]);
    setIsWaitingForNetwork(true);
    setTypingMessageId(null);
    scrollToBottom();

    const res = await processAiQuery(activeUnit.id, msgText, currentSessionId);
    
    if (res.error) {
      toast.error(res.error);
      setMessages(prev => prev.filter(m => m.id !== tempId)); 
    } else {
      if (res.sessionId && !currentSessionId) {
        setCurrentSessionId(res.sessionId);
        getUserSessions().then(r => r.sessions && setSessions(r.sessions));
      }
      if (res.message) {
        setMessages(prev => [...prev, res.message]);
        setTypingMessageId(res.message.id); // Trigger typewriter
      }
    }
    setIsWaitingForNetwork(false);
  };

  if (loadingChannels) return (
    <div className="h-[calc(100dvh-130px)] lg:h-[calc(100vh-140px)] flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#00BC7D] mb-4" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Neural Link...</p></div>
  );

  return (
    <div className="h-[calc(100dvh-130px)] lg:h-[calc(100vh-140px)] bg-background sm:border border-border sm:rounded-[2rem] shadow-sm flex overflow-hidden relative mt-2 sm:mt-0">
      
      <button className="lg:hidden absolute top-4 right-4 z-[60] p-2 bg-background rounded-xl shadow-sm border border-border" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {/* --- LEFT SIDEBAR --- */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        absolute lg:relative inset-0 lg:inset-auto z-50 w-full lg:w-[320px] h-full bg-background lg:bg-zinc-50 lg:dark:bg-zinc-950/50 
        border-r border-border flex flex-col transition-transform duration-300 ease-in-out
      `}>
        <div className="p-4 sm:p-5 border-b border-border bg-background shrink-0">
          <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-foreground mb-4">
            <BrainCircuit className="w-5 h-5 text-[#00BC7D]" /> AI Architect
          </h2>
          
          <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 mb-4">
            <button onClick={() => setSidebarTab('new')} className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-colors ${sidebarTab === 'new' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Plus className="w-3.5 h-3.5" /> Vectors
            </button>
            <button onClick={() => setSidebarTab('history')} className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-colors ${sidebarTab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Clock className="w-3.5 h-3.5" /> History
            </button>
          </div>

          {sidebarTab === 'new' && (
            <>
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search contexts..." className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:border-[#00BC7D]/50 outline-none transition-colors" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <button onClick={() => setSelectedSemester('ALL')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-colors ${selectedSemester === 'ALL' ? 'bg-[#00BC7D] text-white' : 'bg-zinc-200 dark:bg-zinc-900 text-muted-foreground hover:bg-zinc-300 dark:hover:bg-zinc-800'}`}>All</button>
                {uniqueSemesters.map(sem => (
                  <button key={sem.id} onClick={() => setSelectedSemester(sem.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-colors ${selectedSemester === sem.id ? 'bg-[#00BC7D] text-white' : 'bg-zinc-200 dark:bg-zinc-900 text-muted-foreground hover:bg-zinc-300 dark:hover:bg-zinc-800'}`}>S-0{sem.num}</button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-6">
          {sidebarTab === 'new' ? (
            filteredSubjects.length === 0 ? (
              <div className="text-center opacity-50 pt-8"><Layers className="w-8 h-8 mx-auto mb-2" /><p className="text-xs font-bold uppercase tracking-widest">No Vectors Found</p></div>
            ) : (
              filteredSubjects.map(subject => (
                <div key={subject.id}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-2 px-2">{subject.course_code}</h3>
                  <div className="space-y-1">
                    {subject.units.length === 0 ? <p className="text-[10px] sm:text-xs text-muted-foreground italic px-2">No units mapped</p> : [...subject.units].sort((a,b) => a.unit_number - b.unit_number).map(unit => {
                      const isActive = !currentSessionId && activeUnit?.id === unit.id;
                      return (
                        <button key={unit.id} onClick={() => startNewChat(unit, subject)} className={`w-full flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all ${isActive ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-foreground"}`}>
                          <Hash className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-[#00BC7D]' : 'text-muted-foreground opacity-50 shrink-0'}`} /><span className="truncate text-left">Unit {unit.unit_number}: {unit.unit_title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-1">
              {sessions.length === 0 ? (
                 <div className="text-center opacity-50 pt-8"><Clock className="w-8 h-8 mx-auto mb-2" /><p className="text-xs font-bold uppercase tracking-widest">No History</p></div>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className={`group relative flex flex-col p-3 rounded-xl border transition-all cursor-pointer ${currentSessionId === session.id ? 'bg-zinc-100 dark:bg-zinc-900 border-border' : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                    {editingSessionId === session.id ? (
                      <div className="flex gap-2 items-center mb-1">
                        <input autoFocus value={editSessionName} onChange={(e)=>setEditSessionName(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter') handleEditSave(session.id);}} className="flex-1 bg-background border border-[#00BC7D] rounded text-xs px-2 py-1 outline-none" />
                        <button onClick={()=>handleEditSave(session.id)} className="text-[#00BC7D]"><Check size={14}/></button>
                        <button onClick={()=>setEditingSessionId(null)} className="text-muted-foreground"><X size={14}/></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start mb-1" onClick={() => loadSessionChat(session)}>
                        <span className="font-bold text-sm text-foreground truncate pr-2">{session.session_name}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1.5 shrink-0 bg-gradient-to-l from-zinc-100 dark:from-zinc-900 pl-2">
                          <button onClick={(e)=>{e.stopPropagation(); setEditSessionName(session.session_name); setEditingSessionId(session.id);}} className="text-muted-foreground hover:text-foreground"><Edit2 size={14}/></button>
                          <button onClick={(e)=>{e.stopPropagation(); handleDelete(session.id);}} className="text-muted-foreground hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center opacity-60" onClick={() => editingSessionId !== session.id && loadSessionChat(session)}>
                      <span className="text-[9px] font-bold uppercase tracking-widest">{session.units.subjects.course_code} • U{session.units.unit_number}</span>
                      <span className="text-[9px]">{formatDistanceToNow(new Date(session.created_at))} ago</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT MAIN AREA (AI CHAT) --- */}
      <div className="flex-1 flex flex-col bg-background relative min-w-0">
        {activeUnit && activeSubject ? (
          <>
            <div className="h-16 sm:h-20 border-b border-border px-4 sm:px-6 flex justify-between items-center shrink-0 bg-background z-20 pr-16 sm:pr-6 shadow-sm">
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 text-foreground">
                  <div className="p-1.5 bg-[#00BC7D]/10 rounded-lg shrink-0"><Bot className="w-4 h-4 sm:w-5 sm:h-5 text-[#00BC7D]" /></div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight truncate">Ask AI: Unit {activeUnit.unit_number}</h2>
                </div>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground truncate mt-1">Context: {activeSubject.course_title}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* STOP BUTTON */}
                {typingMessageId && (
                  <button onClick={() => setTypingMessageId(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20">
                    <SquareSquare className="w-3.5 h-3.5" /> Stop
                  </button>
                )}
                {/* NEW THREAD BUTTON */}
                {currentSessionId && (
                  <button onClick={() => startNewChat(activeUnit, activeSubject)} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors">
                    <Plus className="w-3.5 h-3.5" /> New Thread
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative flex flex-col gap-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                  <BrainCircuit className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-muted-foreground" />
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest text-foreground">Neural Link Ready</h3>
                  <p className="text-xs sm:text-sm font-medium mt-2 max-w-sm text-muted-foreground">The AI is grounded in the syllabus for Unit {activeUnit.unit_number}. Ask about concepts, request summaries, or solve specific problems.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 sm:gap-4 max-w-[98%] sm:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden border border-border mt-1 ${msg.role === 'user' ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-[#00BC7D]/10 text-[#00BC7D]'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" /> : <Bot className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} min-w-0 w-full`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1">
                        {msg.role === 'user' ? 'You' : 'PeerGraph AI'}
                      </span>
                      <div className={`px-5 sm:px-8 py-4 sm:py-6 rounded-[2rem] w-full
                        ${msg.role === 'user' ? 'bg-[#00BC7D] text-white rounded-tr-sm text-[14px] sm:text-[15px]' : 'bg-transparent text-foreground'}
                      `}>
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                        ) : (
                          typingMessageId === msg.id ? (
                            <TypewriterMessage content={msg.message} speed={1} onComplete={() => setTypingMessageId(null)} />
                          ) : (
                            <div className="prose prose-zinc dark:prose-invert prose-sm sm:prose-base max-w-none 
                              prose-p:leading-relaxed prose-p:mb-5
                              prose-headings:font-black prose-headings:tracking-tight prose-headings:mt-8 prose-headings:mb-4
                              prose-li:marker:text-[#00BC7D] prose-li:my-1.5
                              prose-ul:mb-5 prose-ol:mb-5
                              prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-2xl prose-pre:p-5
                              prose-code:text-[#00BC7D] prose-code:bg-[#00BC7D]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-bold prose-code:before:content-none prose-code:after:content-none
                              prose-table:w-full prose-table:border-collapse prose-table:mb-6
                              prose-th:border prose-th:border-border prose-th:bg-zinc-100 dark:prose-th:bg-zinc-900 prose-th:p-3 prose-th:text-left
                              prose-td:border prose-td:border-border prose-td:p-3
                              prose-strong:text-foreground prose-strong:font-black
                              [&_.katex-display]:overflow-x-auto [&_.katex-display]:custom-scrollbar [&_.katex-display]:py-4 [&_.katex-display]:my-6 [&_.katex-display]:bg-background/50 [&_.katex-display]:border [&_.katex-display]:border-border/50 [&_.katex-display]:rounded-xl
                            ">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: 'inherit' }]]}
                              >
                                {preprocessLaTeX(msg.message)}
                              </ReactMarkdown>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isWaitingForNetwork && (
                <div className="mr-auto flex gap-3 max-w-[85%] mt-2">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border border-border bg-[#00BC7D]/10 text-[#00BC7D]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-5 py-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-border rounded-tl-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#00BC7D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#00BC7D] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#00BC7D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-3 sm:p-6 bg-background border-t border-border shrink-0 z-20">
              <ChatInput 
                onSend={handleSendMessage} 
                isTyping={isWaitingForNetwork || typingMessageId !== null} 
                isWaitingForNetwork={isWaitingForNetwork}
                placeholder={`Ask about #${activeUnit.unit_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}...`} 
              />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
            <BrainCircuit className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-foreground">Awaiting Context</h3>
            <p className="text-xs sm:text-sm mt-2 font-medium">Select a vector from the sidebar to initialize the AI.</p>
          </div>
        )}
      </div>
    </div>
  );
}