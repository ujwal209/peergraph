"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MessageSquare, Send, User, Hash, Loader2, Search, Menu, X, Layers, ArrowUp, MessageCircle, SmilePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { 
  getDiscussionChannels, 
  getUnitComments, 
  addUnitComment, 
  toggleCommentLike,
  toggleCommentReaction
} from "@/app/actions/discussions";

// --- Types ---
type Unit = { id: number; unit_number: number; unit_title: string; };
type Subject = { 
  id: number; course_code: string; course_title: string; semester_id: number;
  semesters?: { semester_number: number }; units: Unit[]; 
};
type Reaction = { emoji: string; count: number; hasReacted: boolean; };
type Comment = { 
  id: string; parent_id: string | null; user_id: string; author_name: string; 
  author_avatar: string | null; content: string; created_at: string; 
  likesCount: number; hasLiked: boolean; reactions: Reaction[]; 
};

const POPULAR_EMOJIS = ['🔥', '🚀', '👀', '💯', '💡', '😂', '👏'];

// --- ISOLATED INPUT COMPONENT FOR REPLIES (PREVENTS LAG) ---
const InlineReplyBox = ({ onReply, isSubmitting, authorName }: { onReply: (text: string) => void, isSubmitting: boolean, authorName: string }) => {
  const [text, setText] = useState("");
  return (
    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
      <textarea 
        autoFocus 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder={`Replying to ${authorName}...`} 
        className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-transparent rounded-2xl p-2 sm:p-3 text-[13px] sm:text-sm focus:border-[#00BC7D]/50 outline-none resize-none custom-scrollbar" 
        rows={2} 
        disabled={isSubmitting}
      />
      <button 
        disabled={!text.trim() || isSubmitting} 
        onClick={() => { onReply(text); setText(""); }} 
        className="self-end sm:self-stretch px-4 py-2 sm:py-0 bg-[#00BC7D] text-white rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-[#00BC7D]/90 disabled:opacity-50 transition-colors"
      >
        Reply
      </button>
    </div>
  );
};

// --- ISOLATED MAIN INPUT COMPONENT (PREVENTS LAG) ---
const RootCommentBox = ({ onPost, isSubmitting, unitTitle }: { onPost: (text: string) => void, isSubmitting: boolean, unitTitle: string }) => {
  const [text, setText] = useState("");
  
  const handleSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if(!text.trim() || isSubmitting) return;
    onPost(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-1.5 border border-transparent focus-within:border-[#00BC7D]/50 transition-colors">
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        onKeyDown={(e) => { 
          if (e.key === 'Enter' && !e.shiftKey) { 
            if(window.innerWidth > 768) {
              e.preventDefault(); handleSubmit(); 
            }
          } 
        }} 
        placeholder={`Start a new thread in #${unitTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} 
        className="w-full bg-transparent border-none py-2 sm:py-3 pl-3 sm:pl-4 pr-2 text-[13px] sm:text-sm font-medium resize-none outline-none max-h-24 sm:max-h-32 custom-scrollbar placeholder:text-muted-foreground/70" 
        rows={1} 
        disabled={isSubmitting} 
      />
      <button type="submit" disabled={!text.trim() || isSubmitting} className="p-2 sm:p-3 bg-[#00BC7D] text-white rounded-xl sm:rounded-2xl hover:bg-[#00BC7D]/90 disabled:opacity-50 transition-all shrink-0 mb-0.5 mr-0.5">
        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </form>
  );
};

// --- Props interface for the recursive component ---
interface CommentThreadProps {
  comment: Comment;
  allComments: Comment[];
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  handleReply: (parentId: string, content: string) => void;
  handleLike: (commentId: string, hasLiked: boolean) => void;
  handleReaction: (commentId: string, emoji: string) => void;
  showEmojiPicker: string | null;
  setShowEmojiPicker: (id: string | null) => void;
  isSubmitting: boolean;
}

const CommentThread = ({ 
  comment, allComments, replyingTo, setReplyingTo, 
  handleReply, handleLike, handleReaction, 
  showEmojiPicker, setShowEmojiPicker, isSubmitting 
}: CommentThreadProps) => {
  const childComments = allComments
    .filter(c => c.parent_id === comment.id)
    .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const isReplying = replyingTo === comment.id;

  return (
    <div className="relative pt-4">
      <div className="flex gap-2 sm:gap-3 group">
        {/* Avatar & Thread Line */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 overflow-hidden border border-border mt-1">
            {comment.author_avatar ? (
              <img src={comment.author_avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><User className="w-4 h-4" /></div>
            )}
          </div>
          {childComments.length > 0 && <div className="w-0.5 h-full bg-border mt-2 group-hover:bg-[#00BC7D]/30 transition-colors" />}
        </div>

        <div className="flex-1 min-w-0 pb-2">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-[13px] sm:text-sm text-foreground hover:underline cursor-pointer truncate">{comment.author_name}</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
          </div>
          <p className="text-[13px] sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
          
          {/* Reactions Display */}
          {comment.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {comment.reactions.map(r => (
                <button key={r.emoji} onClick={() => handleReaction(comment.id, r.emoji)} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${r.hasReacted ? 'bg-[#00BC7D]/10 border-[#00BC7D]/50 text-[#00BC7D]' : 'bg-background border-border text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
                  <span>{r.emoji}</span><span>{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action Bar (Upvote, Reply, React) */}
          <div className="flex items-center gap-3 sm:gap-4 mt-2">
            <button onClick={() => handleLike(comment.id, comment.hasLiked)} className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold transition-colors ${comment.hasLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
              <ArrowUp className={`w-3 h-3 sm:w-4 sm:h-4 ${comment.hasLiked ? "fill-red-500" : ""}`} />{comment.likesCount > 0 ? comment.likesCount : 'Vote'}
            </button>
            <button onClick={() => { setReplyingTo(isReplying ? null : comment.id); setShowEmojiPicker(null); }} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Reply
            </button>
            
            {/* Emoji Picker Popover */}
            <div className="relative">
              <button onClick={() => { setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id); setReplyingTo(null); }} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                <SmilePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> React
              </button>
              {showEmojiPicker === comment.id && (
                <div className="absolute top-full left-0 mt-2 p-1.5 sm:p-2 bg-background border border-border shadow-xl rounded-2xl flex flex-wrap gap-1 z-50 w-max max-w-[200px] sm:max-w-none">
                  {POPULAR_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => handleReaction(comment.id, emoji)} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-base sm:text-lg transition-colors">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inline Reply Input uses the isolated component */}
          {isReplying && (
            <InlineReplyBox 
              onReply={(text) => handleReply(comment.id, text)} 
              isSubmitting={isSubmitting} 
              authorName={comment.author_name} 
            />
          )}
        </div>
      </div>

      {/* Render Children (Nested) */}
      {childComments.length > 0 && (
        <div className="ml-3 sm:ml-4 pl-3 sm:pl-4 border-l border-border mt-1">
          {childComments.map(child => (
            <CommentThread 
              key={child.id} 
              comment={child} 
              allComments={allComments}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              handleReply={handleReply}
              handleLike={handleLike}
              handleReaction={handleReaction}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function DiscussionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChannels() {
      const res = await getDiscussionChannels();
      if (res.error) {
        toast.error(res.error);
      } else if (res.channels) {
        setSubjects(res.channels);
        const firstSub = res.channels.find((s: Subject) => s.units.length > 0);
        if (firstSub) {
          setActiveSubject(firstSub);
          setActiveUnit(firstSub.units.sort((a: Unit, b: Unit) => a.unit_number - b.unit_number)[0]);
        }
      }
      setLoadingChannels(false);
    }
    loadChannels();
  }, []);

  useEffect(() => {
    async function loadComments() {
      if (!activeUnit) return;
      setLoadingComments(true);
      const res = await getUnitComments(activeUnit.id);
      if (res.error) toast.error(res.error);
      else if (res.data) setComments(res.data);
      setLoadingComments(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    loadComments();
  }, [activeUnit]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => {
      if (selectedSemester !== 'ALL' && sub.semester_id !== selectedSemester) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesSubject = sub.course_code.toLowerCase().includes(q) || sub.course_title.toLowerCase().includes(q);
        const matchesUnit = sub.units.some(u => u.unit_title.toLowerCase().includes(q) || `unit ${u.unit_number}`.includes(q));
        if (!matchesSubject && !matchesUnit) return false;
      }
      return true;
    });
  }, [subjects, searchQuery, selectedSemester]);

  const uniqueSemesters = useMemo(() => {
    const sems = new Map<number, number>();
    subjects.forEach(sub => {
      if (!sems.has(sub.semester_id)) sems.set(sub.semester_id, sub.semesters?.semester_number || sub.semester_id);
    });
    return Array.from(sems.entries()).map(([id, num]) => ({ id, num })).sort((a, b) => a.num - b.num);
  }, [subjects]);

  // Main Root Level Post - Receives text directly
  const handlePost = async (content: string) => {
    if (!content.trim() || !activeUnit) return;
    setIsSubmitting(true);
    const { data, error } = await addUnitComment(activeUnit.id, content.trim());
    if (error) toast.error(error);
    else if (data) {
      setComments(prev => [...prev, data]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setIsSubmitting(false);
  };

  // Inline Reply Post - Receives parentId and text directly
  const handleReply = async (parentId: string, content: string) => {
    if (!content.trim() || !activeUnit) return;
    setIsSubmitting(true);
    const { data, error } = await addUnitComment(activeUnit.id, content.trim(), parentId);
    if (error) toast.error(error);
    else if (data) {
      setComments(prev => [...prev, data]);
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string, currentlyLiked: boolean) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, hasLiked: !currentlyLiked, likesCount: currentlyLiked ? c.likesCount - 1 : c.likesCount + 1 } : c));
    const { error } = await toggleCommentLike(commentId, currentlyLiked);
    if (error) toast.error("Failed to upvote");
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const existingReaction = comment.reactions.find(r => r.emoji === emoji);
    const hasReacted = existingReaction?.hasReacted || false;

    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      let newReactions = [...c.reactions];
      if (existingReaction) {
        newReactions = newReactions.map(r => r.emoji === emoji ? { ...r, hasReacted: !hasReacted, count: hasReacted ? r.count - 1 : r.count + 1 } : r).filter(r => r.count > 0);
      } else {
        newReactions.push({ emoji, count: 1, hasReacted: true });
      }
      return { ...c, reactions: newReactions };
    }));
    setShowEmojiPicker(null);

    const { error } = await toggleCommentReaction(commentId, emoji, hasReacted);
    if (error) toast.error("Reaction failed");
  };

  if (loadingChannels) return (
    <div className="h-[calc(100dvh-130px)] lg:h-[calc(100vh-140px)] flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#00BC7D] mb-4" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">Establishing Network...</p></div>
  );

  return (
    <div className="h-[calc(100dvh-130px)] lg:h-[calc(100vh-140px)] bg-background sm:border border-border sm:rounded-[2rem] shadow-sm flex overflow-hidden relative mt-2 sm:mt-0">
      
      {/* Mobile Menu Overlay Toggle (Hamburger) */}
      <button 
        className="lg:hidden absolute top-4 right-4 z-[60] p-2 bg-background rounded-xl shadow-sm border border-border" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
      </button>

      {/* --- LEFT SIDEBAR (Channels) --- */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        absolute lg:relative inset-0 lg:inset-auto z-50 w-full lg:w-[320px] h-full bg-background lg:bg-zinc-50 lg:dark:bg-zinc-950/50 
        border-r border-border flex flex-col transition-transform duration-300 ease-in-out
      `}>
        <div className="p-4 sm:p-5 border-b border-border bg-background shrink-0">
          <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-foreground mb-4">
            <MessageSquare className="w-5 h-5 text-[#00BC7D]" />Vector Hub
          </h2>
          
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search vectors & units..." 
              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:border-[#00BC7D]/50 outline-none transition-colors" 
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button onClick={() => setSelectedSemester('ALL')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-colors ${selectedSemester === 'ALL' ? 'bg-[#00BC7D] text-white' : 'bg-zinc-200 dark:bg-zinc-900 text-muted-foreground hover:bg-zinc-300 dark:hover:bg-zinc-800'}`}>All</button>
            {uniqueSemesters.map(sem => (
              <button key={sem.id} onClick={() => setSelectedSemester(sem.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-colors ${selectedSemester === sem.id ? 'bg-[#00BC7D] text-white' : 'bg-zinc-200 dark:bg-zinc-900 text-muted-foreground hover:bg-zinc-300 dark:hover:bg-zinc-800'}`}>S-0{sem.num}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-6">
          {filteredSubjects.length === 0 ? (
            <div className="text-center opacity-50 pt-8"><Layers className="w-8 h-8 mx-auto mb-2" /><p className="text-xs font-bold uppercase tracking-widest">No Vectors Found</p></div>
          ) : (
            filteredSubjects.map(subject => (
              <div key={subject.id}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-2">{subject.course_code}</h3>
                <div className="space-y-1">
                  {subject.units.length === 0 ? <p className="text-[10px] sm:text-xs text-muted-foreground italic px-2">No units mapped</p> : [...subject.units].sort((a,b) => a.unit_number - b.unit_number).map(unit => {
                    const isActive = activeUnit?.id === unit.id;
                    return (
                      <button 
                        key={unit.id} 
                        onClick={() => { 
                          setActiveUnit(unit); 
                          setActiveSubject(subject); 
                          setMobileMenuOpen(false);
                        }} 
                        className={`w-full flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all ${isActive ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-foreground"}`}
                      >
                        <Hash className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-[#00BC7D]' : 'text-muted-foreground opacity-50 shrink-0'}`} />
                        <span className="truncate text-left">Unit {unit.unit_number}: {unit.unit_title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT MAIN AREA (CHAT) --- */}
      <div className="flex-1 flex flex-col bg-background relative min-w-0" onClick={() => { if(showEmojiPicker) setShowEmojiPicker(null); }}>
        {activeUnit && activeSubject ? (
          <>
            <div className="h-16 sm:h-20 border-b border-border px-4 sm:px-6 flex flex-col justify-center shrink-0 bg-background z-20 pr-16 sm:pr-6">
              <div className="flex items-center gap-1.5 sm:gap-2 text-foreground">
                <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">Unit {activeUnit.unit_number}: {activeUnit.unit_title}</h2>
              </div>
              <p className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{activeSubject.course_code} • {activeSubject.course_title}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-8 custom-scrollbar relative">
              {loadingComments ? <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00BC7D]" /></div>
              : comments.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4"><MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-muted-foreground" /><h3 className="text-lg sm:text-xl font-black uppercase tracking-widest">No Transmissions Yet</h3><p className="text-xs sm:text-sm font-medium mt-1">Initiate the first thread in this vector.</p></div>
              : <div className="space-y-2 pb-8">
                  {comments.filter(c => !c.parent_id).map((comment) => (
                    <CommentThread 
                      key={comment.id} 
                      comment={comment} 
                      allComments={comments}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      handleReply={handleReply}
                      handleLike={handleLike}
                      handleReaction={handleReaction}
                      showEmojiPicker={showEmojiPicker}
                      setShowEmojiPicker={setShowEmojiPicker}
                      isSubmitting={isSubmitting}
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              }
            </div>

            <div className="p-2 sm:p-6 bg-background border-t border-border shrink-0 z-20">
              <RootCommentBox 
                onPost={handlePost} 
                isSubmitting={isSubmitting} 
                unitTitle={activeUnit.unit_title} 
              />
            </div>
          </>
        ) : <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50"><Hash className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" /><h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-foreground">No Channel Selected</h3><p className="text-xs sm:text-sm mt-2">Open the menu to select a vector.</p></div>}
      </div>
    </div>
  );
}