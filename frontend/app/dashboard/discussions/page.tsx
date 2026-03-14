"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  MessageSquare, Send, User, Hash, Loader2, Search, Menu, X, 
  Layers, ArrowUp, ArrowDown, MessageCircle, SmilePlus, Globe,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

// --- Types ---
type Unit = { id: number; unit_number: number; unit_title: string; };
type Subject = { 
  id: number; course_code: string; course_title: string; semester_id: number; branch_id?: number;
  semesters?: { semester_number: number }; units: Unit[]; 
};
type Reaction = { emoji: string; count: number; hasReacted: boolean; };
type Comment = { 
  id: string; parent_id: string | null; user_id: string; author_name: string; 
  author_avatar: string | null; content: string; created_at: string; 
  likesCount: number; hasLiked: boolean; reactions: Reaction[]; 
};

const POPULAR_EMOJIS = ['🔥', '🚀', '👀', '💯', '💡', '😂', '👏'];

// --- ISOLATED INPUT COMPONENT FOR REPLIES ---
const InlineReplyBox = ({ onReply, isSubmitting, authorName, onCancel }: { onReply: (text: string) => void, isSubmitting: boolean, authorName: string, onCancel: () => void }) => {
  const [text, setText] = useState("");
  return (
    <div className="mt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="border border-zinc-300 dark:border-[#343536] rounded-md focus-within:border-[#00BC7D]/50 dark:focus-within:border-[#00BC7D]/50 bg-white dark:bg-[#1A1A1B] overflow-hidden transition-colors">
        <textarea 
          autoFocus 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder={`What are your thoughts?`} 
          className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none custom-scrollbar min-h-[80px] dark:text-zinc-100 text-zinc-900" 
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2 bg-zinc-50 dark:bg-[#272729]/50 p-2 border-t border-zinc-200 dark:border-[#343536]">
          <button 
            onClick={(e) => { e.preventDefault(); onCancel(); }}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-sm font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-[#343536] rounded-full transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!text.trim() || isSubmitting} 
            onClick={(e) => { e.preventDefault(); onReply(text); setText(""); }} 
            className="px-4 py-1.5 bg-[#00BC7D] text-white rounded-full font-bold text-sm hover:bg-[#009e69] disabled:opacity-50 transition-colors"
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ISOLATED MAIN INPUT COMPONENT (CREATE POST) ---
const RootCommentBox = ({ onPost, isSubmitting, unitTitle }: { onPost: (text: string) => void, isSubmitting: boolean, unitTitle: string }) => {
  const [text, setText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if(!text.trim() || isSubmitting) return;
    onPost(text);
    setText("");
    setIsExpanded(false);
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1B] border border-zinc-300 dark:border-[#343536] rounded-md mb-6 transition-colors">
      <div className="p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-300 dark:border-[#343536]">
          <User className="w-5 h-5 text-zinc-500" />
        </div>
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            onFocus={() => setIsExpanded(true)}
            placeholder={`Create Post in c/${unitTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} 
            className={cn(
                "w-full bg-zinc-50 dark:bg-[#272729] border border-zinc-200 dark:border-[#343536] rounded-md py-2 px-3 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-[#1A1A1B] hover:border-zinc-400 dark:hover:border-zinc-500 focus:bg-white dark:focus:bg-[#1A1A1B] focus:border-[#00BC7D]/50 dark:focus:border-[#00BC7D]/50 outline-none transition-all resize-none custom-scrollbar",
                isExpanded ? "min-h-[100px]" : "h-10"
            )}
            disabled={isSubmitting} 
          />
          {isExpanded && (
            <div className="flex justify-end gap-2 mt-2">
              <button 
                type="button"
                onClick={() => { setIsExpanded(false); setText(""); }}
                className="px-4 py-1.5 text-sm font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-[#343536] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!text.trim() || isSubmitting} 
                className="px-4 py-1.5 bg-[#00BC7D] text-white rounded-full font-bold text-sm hover:bg-[#009e69] disabled:opacity-50 transition-colors"
              >
                Post
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// --- REDDIT STYLE COMMENT THREAD ---
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
  unitTitle: string;
}

const CommentThread = ({ 
  comment, allComments, replyingTo, setReplyingTo, 
  handleReply, handleLike, handleReaction, 
  showEmojiPicker, setShowEmojiPicker, isSubmitting, unitTitle 
}: CommentThreadProps) => {
  const childComments = allComments
    .filter(c => c.parent_id === comment.id)
    .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const isReplying = replyingTo === comment.id;
  const isRoot = !comment.parent_id;

  // Root Level Post Card
  if (isRoot) {
    return (
      <div className="bg-white dark:bg-[#1A1A1B] border border-zinc-300 dark:border-[#343536] rounded-md hover:border-zinc-400 dark:hover:border-zinc-500 mb-4 transition-colors flex overflow-hidden">
        {/* Left Desktop Vote Sidebar */}
        <div className="hidden sm:flex flex-col items-center p-2 w-12 bg-zinc-50 dark:bg-[#1A1A1B] border-r border-transparent">
            <button onClick={(e) => { e.stopPropagation(); handleLike(comment.id, comment.hasLiked); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-[#272729] rounded group">
                <ArrowUp className={`w-5 h-5 ${comment.hasLiked ? 'text-[#00BC7D]' : 'text-zinc-400 group-hover:text-[#00BC7D]'}`} />
            </button>
            <span className={`text-xs font-bold my-1 ${comment.hasLiked ? 'text-[#00BC7D]' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {comment.likesCount}
            </span>
            <button className="p-1 hover:bg-zinc-200 dark:hover:bg-[#272729] rounded group">
                <ArrowDown className="w-5 h-5 text-zinc-400 group-hover:text-red-500" />
            </button>
        </div>

        {/* Post Content Area */}
        <div className="p-2 sm:p-3 sm:pl-2 flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-[#272729] overflow-hidden border border-zinc-300 dark:border-[#343536]">
                    {comment.author_avatar ? <img src={comment.author_avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-3 h-3 m-1" />}
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer truncate">
                    c/{unitTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                </span>
                <span className="text-[10px] sm:text-xs">
                    • Posted by u/{comment.author_name} {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
            </div>
            
            {/* Body */}
            <div className="text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mb-3 whitespace-pre-wrap break-words px-1">
                {comment.content}
            </div>

            {/* Reactions Display */}
            {comment.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 px-1">
                {comment.reactions.map(r => (
                    <button key={r.emoji} onClick={(e) => { e.stopPropagation(); handleReaction(comment.id, r.emoji); }} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border transition-colors ${r.hasReacted ? 'bg-[#00BC7D]/10 border-[#00BC7D]/50 text-[#00BC7D]' : 'bg-zinc-100 dark:bg-[#272729] border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#343536]'}`}>
                        <span>{r.emoji}</span><span>{r.count}</span>
                    </button>
                ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-1 sm:gap-2 text-xs font-bold text-zinc-500 dark:text-[#818384]">
                {/* Mobile Votes */}
                <div className="flex sm:hidden items-center bg-zinc-100 dark:bg-[#272729] rounded-full">
                    <button onClick={(e) => { e.stopPropagation(); handleLike(comment.id, comment.hasLiked); }} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-[#343536] rounded-l-full">
                        <ArrowUp className={`w-4 h-4 ${comment.hasLiked ? 'text-[#00BC7D]' : ''}`} />
                    </button>
                    <span className={`px-1 ${comment.hasLiked ? 'text-[#00BC7D]' : ''}`}>{comment.likesCount}</span>
                    <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-[#343536] rounded-r-full">
                        <ArrowDown className="w-4 h-4" />
                    </button>
                </div>

                <button onClick={(e) => { e.stopPropagation(); setReplyingTo(isReplying ? null : comment.id); setShowEmojiPicker(null); }} className="flex items-center gap-1.5 p-1.5 px-3 bg-transparent hover:bg-zinc-100 dark:hover:bg-[#272729] rounded-md transition-colors">
                    <MessageSquare className="w-4 h-4" /> {childComments.length} Comments
                </button>
                
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id); setReplyingTo(null); }} className="flex items-center gap-1.5 p-1.5 px-3 bg-transparent hover:bg-zinc-100 dark:hover:bg-[#272729] rounded-md transition-colors">
                        <SmilePlus className="w-4 h-4" /> React
                    </button>
                    {showEmojiPicker === comment.id && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-[#1A1A1B] border border-zinc-300 dark:border-[#343536] shadow-xl rounded-xl flex flex-wrap gap-1 z-50 w-max" onClick={(e) => e.stopPropagation()}>
                            {POPULAR_EMOJIS.map(emoji => (
                            <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(comment.id, emoji); }} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-[#272729] rounded-lg text-lg transition-colors">{emoji}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Inline Reply Input */}
            {isReplying && (
                <div className="mt-3">
                    <InlineReplyBox onReply={(text) => handleReply(comment.id, text)} isSubmitting={isSubmitting} authorName={comment.author_name} onCancel={() => setReplyingTo(null)} />
                </div>
            )}

            {/* Render Replies underneath root post */}
            {childComments.length > 0 && (
                <div className="mt-4 px-1 sm:px-2 pt-2 border-t border-zinc-200 dark:border-[#343536]">
                    {childComments.map(child => (
                        <CommentThread 
                            key={child.id} comment={child} allComments={allComments}
                            replyingTo={replyingTo} setReplyingTo={setReplyingTo} handleReply={handleReply}
                            handleLike={handleLike} handleReaction={handleReaction} showEmojiPicker={showEmojiPicker}
                            setShowEmojiPicker={setShowEmojiPicker} isSubmitting={isSubmitting} unitTitle={unitTitle}
                        />
                    ))}
                </div>
            )}
        </div>
      </div>
    );
  }

  // Nested Comment Render
  return (
    <div className="mt-3 text-sm flex gap-2 w-full group">
      {/* Thread Line & Avatar */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-zinc-300 dark:border-[#343536]">
          {comment.author_avatar ? <img src={comment.author_avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-1.5 text-zinc-500" />}
        </div>
        <div className="w-[2px] flex-1 bg-zinc-200 dark:bg-[#343536] group-hover:bg-[#00BC7D]/50 mt-1 rounded-full transition-colors" />
      </div>

      <div className="flex-1 pb-2 min-w-0">
        {/* Author Header */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#818384] mb-1">
            <span className="font-bold text-zinc-900 dark:text-zinc-200 hover:underline cursor-pointer">
                u/{comment.author_name}
            </span> 
            <span>• {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
        </div>
        
        {/* Comment Body */}
        <div className="text-zinc-900 dark:text-zinc-100 mb-1.5 whitespace-pre-wrap break-words">
            {comment.content}
        </div>

        {/* Reactions Display */}
        {comment.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
            {comment.reactions.map(r => (
                <button key={r.emoji} onClick={(e) => { e.stopPropagation(); handleReaction(comment.id, r.emoji); }} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border transition-colors ${r.hasReacted ? 'bg-[#00BC7D]/10 border-[#00BC7D]/50 text-[#00BC7D]' : 'bg-zinc-100 dark:bg-[#272729] border-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-[#343536]'}`}>
                    <span>{r.emoji}</span><span>{r.count}</span>
                </button>
            ))}
            </div>
        )}

        {/* Action bar for child */}
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-[#818384]">
            <button onClick={(e) => { e.stopPropagation(); handleLike(comment.id, comment.hasLiked); }} className="flex items-center gap-1 group p-1 hover:bg-zinc-200 dark:hover:bg-[#272729] rounded">
                <ArrowUp className={`w-4 h-4 ${comment.hasLiked ? 'text-[#00BC7D]' : 'group-hover:text-[#00BC7D]'}`} />
                <span className={comment.hasLiked ? 'text-[#00BC7D]' : ''}>{comment.likesCount}</span>
            </button>
            <button className="p-1 hover:bg-zinc-200 dark:hover:bg-[#272729] rounded group">
                <ArrowDown className="w-4 h-4 group-hover:text-red-500" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setReplyingTo(isReplying ? null : comment.id); setShowEmojiPicker(null); }} className="flex items-center gap-1.5 px-2 hover:bg-zinc-200 dark:hover:bg-[#272729] rounded py-1 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Reply
            </button>
            
            <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id); setReplyingTo(null); }} className="flex items-center px-2 hover:bg-zinc-200 dark:hover:bg-[#272729] rounded py-1 transition-colors">
                    React
                </button>
                {showEmojiPicker === comment.id && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-[#1A1A1B] border border-zinc-300 dark:border-[#343536] shadow-xl rounded-xl flex flex-wrap gap-1 z-50 w-max" onClick={(e) => e.stopPropagation()}>
                        {POPULAR_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(comment.id, emoji); }} className="w-7 h-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-[#272729] rounded-lg text-base transition-colors">{emoji}</button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Inline Reply */}
        {isReplying && <InlineReplyBox onReply={(text) => handleReply(comment.id, text)} isSubmitting={isSubmitting} authorName={comment.author_name} onCancel={() => setReplyingTo(null)} />}
        
        {/* Nested Children */}
        {childComments.length > 0 && (
            <div className="mt-1">
                {childComments.map(child => (
                    <CommentThread 
                        key={child.id} comment={child} allComments={allComments}
                        replyingTo={replyingTo} setReplyingTo={setReplyingTo} handleReply={handleReply}
                        handleLike={handleLike} handleReaction={handleReaction} showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker} isSubmitting={isSubmitting} unitTitle={unitTitle}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function DiscussionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<number | 'ALL'>('ALL');
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChannels() {
      const res = await apiClient.get("/discussions/channels");
      if (res.error || res.detail) {
        toast.error(res.error || res.detail);
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
      const res = await apiClient.get(`/discussions/comments/${activeUnit.id}`);
      if (res.error || res.detail) toast.error(res.error || res.detail);
      else if (res.data) setComments(res.data);
      setLoadingComments(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    loadComments();
  }, [activeUnit]);

  // Derive unique semesters and branches for filters
  const uniqueSemesters = useMemo(() => {
    const sems = new Set(subjects.map(s => s.semester_id));
    return Array.from(sems).sort((a,b) => a-b);
  }, [subjects]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set(subjects.filter(s => s.branch_id).map(s => s.branch_id!));
    return Array.from(branches).sort((a,b) => a-b);
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(sub => {
      if (selectedSemester !== 'ALL' && sub.semester_id !== selectedSemester) return false;
      if (selectedBranch !== 'ALL' && sub.branch_id && sub.branch_id !== selectedBranch) return false;
      
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesSubject = sub.course_code.toLowerCase().includes(q) || sub.course_title.toLowerCase().includes(q);
        const matchesUnit = sub.units.some(u => u.unit_title.toLowerCase().includes(q) || `unit ${u.unit_number}`.includes(q));
        if (!matchesSubject && !matchesUnit) return false;
      }
      return true;
    });
  }, [subjects, searchQuery, selectedSemester, selectedBranch]);

  const handlePost = async (content: string) => {
    if (!content.trim() || !activeUnit) return;
    setIsSubmitting(true);
    const res = await apiClient.post("/discussions/comments", {
        unitId: activeUnit.id,
        content: content.trim(),
        parentId: null
    });
    if (res.error || res.detail) toast.error(res.error || res.detail);
    else if (res.data) {
      setComments(prev => [...prev, res.data]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setIsSubmitting(false);
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!content.trim() || !activeUnit) return;
    setIsSubmitting(true);
    const res = await apiClient.post("/discussions/comments", {
        unitId: activeUnit.id,
        content: content.trim(),
        parentId: parentId
    });
    if (res.error || res.detail) toast.error(res.error || res.detail);
    else if (res.data) {
      setComments(prev => [...prev, res.data]);
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  const handleLike = async (commentId: string, currentlyLiked: boolean) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, hasLiked: !currentlyLiked, likesCount: currentlyLiked ? c.likesCount - 1 : c.likesCount + 1 } : c));
    const res = await apiClient.post("/discussions/toggle-like", { commentId, hasLiked: currentlyLiked });
    if (res.error || res.detail) toast.error("Failed to upvote");
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

    const res = await apiClient.post("/discussions/toggle-reaction", { commentId, emoji, hasReacted });
    if (res.error || res.detail) toast.error("Reaction failed");
  };

  if (loadingChannels) return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center bg-[#DAE0E6] dark:bg-[#0B1416]">
        <Loader2 className="w-10 h-10 animate-spin text-[#00BC7D] mb-4" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-[#DAE0E6] dark:bg-[#0B1416] flex overflow-hidden relative">
      
      {/* Mobile Menu Toggle */}
      <button 
        className="lg:hidden absolute top-3 left-4 z-[60] p-1.5 bg-white dark:bg-[#1A1A1B] rounded-md shadow-sm border border-zinc-200 dark:border-[#343536]" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5 text-zinc-900 dark:text-zinc-100" /> : <Menu className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />}
      </button>

      {/* --- LEFT SIDEBAR (Communities & Filters) --- */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        absolute lg:relative inset-0 lg:inset-auto z-50 w-full lg:w-[320px] h-full bg-white dark:bg-[#1A1A1B] 
        border-r border-zinc-300 dark:border-[#343536] flex flex-col transition-transform duration-300 ease-in-out shrink-0 overflow-hidden
      `}>
        <div className="p-4 border-b border-zinc-200 dark:border-[#343536] shrink-0 pt-14 lg:pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-[#818384] uppercase tracking-wider">
              Feeds & Filters
            </h2>
            <Filter className="w-4 h-4 text-zinc-400" />
          </div>
          
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
            <input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search communities..." 
              className="w-full bg-zinc-100 dark:bg-[#272729] border border-transparent rounded-full py-1.5 pl-9 pr-4 text-sm text-zinc-900 dark:text-zinc-100 focus:border-[#00BC7D]/50 focus:bg-white dark:focus:bg-[#1A1A1B] outline-none transition-colors" 
            />
          </div>

          {/* Filters Area */}
          <div className="flex flex-col gap-2">
            {/* Semester Pills */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              <button 
                onClick={() => setSelectedSemester('ALL')} 
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedSemester === 'ALL' ? 'bg-[#00BC7D] text-white' : 'bg-zinc-100 dark:bg-[#272729] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#343536]'}`}
              >
                All Sems
              </button>
              {uniqueSemesters.map(sem => (
                <button 
                  key={sem} 
                  onClick={() => setSelectedSemester(sem)} 
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedSemester === sem ? 'bg-[#00BC7D] text-white' : 'bg-zinc-100 dark:bg-[#272729] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#343536]'}`}
                >
                  Sem {sem}
                </button>
              ))}
            </div>
            
            {/* Branch Pills (Only show if branches exist in data) */}
            {uniqueBranches.length > 0 && (
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 mt-1">
                <button 
                  onClick={() => setSelectedBranch('ALL')} 
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedBranch === 'ALL' ? 'bg-[#00BC7D] text-white' : 'bg-zinc-100 dark:bg-[#272729] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#343536]'}`}
                >
                  All Branches
                </button>
                {uniqueBranches.map(branch => (
                  <button 
                    key={branch} 
                    onClick={() => setSelectedBranch(branch)} 
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedBranch === branch ? 'bg-[#00BC7D] text-white' : 'bg-zinc-100 dark:bg-[#272729] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#343536]'}`}
                  >
                    Branch {branch}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4 min-h-0">
          {filteredSubjects.length === 0 ? (
            <div className="text-center opacity-50 pt-8"><Globe className="w-8 h-8 mx-auto mb-2 text-zinc-400" /><p className="text-xs font-bold">No communities found</p></div>
          ) : (
            filteredSubjects.map(subject => (
              <div key={subject.id}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#818384] mb-1 px-3 mt-2">
                  {subject.course_code}
                </h3>
                <div className="space-y-0.5">
                  {subject.units.length === 0 ? <p className="text-xs text-zinc-500 italic px-3">Empty</p> : [...subject.units].sort((a,b) => a.unit_number - b.unit_number).map(unit => {
                    const isActive = activeUnit?.id === unit.id;
                    return (
                      <button 
                        key={unit.id} 
                        onClick={() => { 
                          setActiveUnit(unit); 
                          setActiveSubject(subject); 
                          setMobileMenuOpen(false);
                        }} 
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive ? "bg-zinc-100 dark:bg-[#272729] text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-[#272729]/50"}`}
                      >
                        <Globe className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#00BC7D]' : 'text-zinc-400'}`} />
                        <span className="truncate text-left">c/{unit.unit_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT MAIN AREA (Feed / Chat) --- */}
      <div className="flex-1 flex flex-col relative min-w-0 h-full overflow-hidden" onClick={() => { if(showEmojiPicker) setShowEmojiPicker(null); }}>
        
        {/* Banner Header */}
        <div className="bg-white dark:bg-[#1A1A1B] h-12 sm:h-14 flex items-center px-12 lg:px-6 border-b border-zinc-300 dark:border-[#343536] shrink-0 w-full z-10 sticky top-0 shadow-sm">
           {activeUnit && activeSubject ? (
             <div className="flex items-center gap-2 w-full">
                <div className="w-8 h-8 rounded-full bg-[#00BC7D] flex items-center justify-center text-white shrink-0">
                    <Globe className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">c/{activeUnit.unit_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</h2>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{activeSubject.course_title}</p>
                </div>
             </div>
           ) : (
             <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">Select a community</h2>
           )}
        </div>

        {/* Scrollable Feed Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar w-full relative min-h-0">
            <div className="max-w-3xl mx-auto w-full p-4 sm:p-6 flex flex-col">
                
                {activeUnit ? (
                    <>
                        {/* Create Post Box */}
                        <RootCommentBox 
                            onPost={handlePost} 
                            isSubmitting={isSubmitting} 
                            unitTitle={activeUnit.unit_title} 
                        />
                        
                        {/* Posts / Comments List */}
                        <div className="flex-1">
                            {loadingComments ? (
                                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00BC7D]" /></div>
                            ) : comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-60">
                                    <MessageSquare className="w-12 h-12 mb-4 text-zinc-400" />
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No posts yet</h3>
                                    <p className="text-sm text-zinc-500">Be the first to share your thoughts in c/{activeUnit.unit_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {comments.filter(c => !c.parent_id).map((comment) => (
                                        <CommentThread 
                                            key={comment.id} comment={comment} allComments={comments}
                                            replyingTo={replyingTo} setReplyingTo={setReplyingTo} handleReply={handleReply}
                                            handleLike={handleLike} handleReaction={handleReaction} showEmojiPicker={showEmojiPicker}
                                            setShowEmojiPicker={setShowEmojiPicker} isSubmitting={isSubmitting} unitTitle={activeUnit.unit_title}
                                        />
                                    ))}
                                    <div ref={messagesEndRef} className="h-4" />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 opacity-50 py-32">
                        <Globe className="w-16 h-16 text-zinc-400 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Explore Communities</h3>
                        <p className="text-sm text-zinc-500">Select a course vector from the sidebar to dive in.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}