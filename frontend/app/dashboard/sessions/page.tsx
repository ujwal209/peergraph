"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Calendar, Users, Search, Plus, Loader2, Clock, Video, CheckCircle2 } from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import { getAllSessions, startSessionNow } from "@/app/actions/sessions";

// --- Types ---
type Session = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  tags: string[];
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  meeting_link: string;
  subject?: { course_code: string; course_title: string; };
  unit?: { unit_number: number; unit_title: string; };
  host?: { id: string; full_name: string; avatar_url: string; };
};

export default function SessionsPage() {
  const router = useRouter();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState<string | null>(null);

  // Filters
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "live" | "scheduled" | "ended">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      const res = await getAllSessions();
      if (res.error) {
        toast.error(res.error);
      } else {
        setSessions(res.sessions || []);
        setCurrentUserId(res.currentUserId || null);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleStartNow = async (sessionId: string) => {
    setIsStartingSession(sessionId);
    const res = await startSessionNow(sessionId);
    
    if (res.error) {
      toast.error(res.error);
      setIsStartingSession(null);
    } else {
      toast.success("Protocol Override: Hub is now LIVE.");
      router.push(res.meeting_link);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // 1. Tab Filter
      if (tab === "mine" && session.host_id !== currentUserId) return false;
      
      // 2. Status Filter
      if (statusFilter !== "ALL" && session.status !== statusFilter) return false;
      
      // 3. Search Filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesTitle = session.title.toLowerCase().includes(q);
        const matchesHost = session.host?.full_name?.toLowerCase().includes(q);
        const matchesSubject = session.subject?.course_code?.toLowerCase().includes(q);
        const matchesTags = session.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesHost && !matchesSubject && !matchesTags) return false;
      }
      
      return true;
    });
  }, [sessions, tab, statusFilter, searchQuery, currentUserId]);

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-130px)] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#00BC7D] mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Scanning Network Hubs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground mb-2 flex items-center gap-3">
            Network Hubs
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl leading-relaxed">
            Discover, schedule, and join live peer-to-peer learning environments. 
          </p>
        </div>
        <Link 
          href="/dashboard/sessions/create"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00BC7D] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#00BC7D]/90 transition-all shadow-[0_0_20px_rgba(0,188,125,0.2)] hover:shadow-[0_0_30px_rgba(0,188,125,0.4)] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Initialize Protocol
        </Link>
      </div>

      {/* --- FILTERS BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/40 p-2 sm:p-3 border border-border rounded-3xl">
        
        {/* Main Tabs */}
        <div className="flex bg-background border border-border rounded-2xl p-1 overflow-x-auto custom-scrollbar shrink-0">
          <button onClick={() => setTab("all")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${tab === "all" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Radio className="w-3.5 h-3.5" /> All Hubs
          </button>
          <button onClick={() => setTab("mine")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${tab === "mine" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Users className="w-3.5 h-3.5" /> My Broadcasts
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search subjects, tags, hosts..." 
              className="w-full bg-background border border-border rounded-2xl py-2.5 pl-9 pr-4 text-xs font-medium focus:border-[#00BC7D]/50 outline-none transition-colors" 
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-background border border-border rounded-2xl py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground focus:border-[#00BC7D]/50 outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="ALL">Status: Any</option>
            <option value="live">🟢 Live Now</option>
            <option value="scheduled">⏳ Scheduled</option>
            <option value="ended">⚪ Ended</option>
          </select>
        </div>
      </div>

      {/* --- SESSIONS GRID --- */}
      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 text-center px-4">
          <Radio className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Silence on the Network</h3>
          <p className="text-sm mt-2 font-medium">No transmissions match your current parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const isHost = session.host_id === currentUserId;
            const isLive = session.status === "live";
            const isEnded = session.status === "ended";
            const isScheduled = session.status === "scheduled";
            const sessionPast = isScheduled && isPast(new Date(session.start_time));

            return (
              <div key={session.id} className="group relative flex flex-col bg-zinc-50 dark:bg-zinc-900/20 border border-border hover:border-[#00BC7D]/30 rounded-[2rem] p-6 transition-all hover:shadow-[0_10px_40px_-10px_rgba(0,188,125,0.1)]">
                
                {/* Top Row: Avatar & Status */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-background overflow-hidden shrink-0 shadow-sm bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                      {session.host?.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={session.host.avatar_url} alt="host" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground truncate max-w-[120px]">{session.host?.full_name || "Unknown Peer"}</span>
                      {isHost && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#00BC7D] flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Host</span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isLive && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Now
                    </div>
                  )}
                  {isScheduled && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> Scheduled
                    </div>
                  )}
                  {isEnded && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-muted-foreground text-[9px] font-black uppercase tracking-widest">
                      Offline
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 line-clamp-1">
                    {session.subject ? `${session.subject.course_code} • U${session.unit?.unit_number || 'General'}` : 'General / Interdisciplinary'}
                  </p>
                  <h3 className="text-lg font-black tracking-tight text-foreground leading-tight mb-2 line-clamp-2">
                    {session.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium line-clamp-2 mb-4 leading-relaxed">
                    {session.description}
                  </p>
                </div>

                {/* Meta Data */}
                <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-2xl bg-background border border-border">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Time</span>
                    <span className="text-xs font-bold text-foreground">{format(new Date(session.start_time), "MMM d, h:mm a")}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Capacity</span>
                    <span className="text-xs font-bold text-foreground">{session.duration_minutes}m • Max {session.max_participants}</span>
                  </div>
                </div>

                {/* Tags */}
                {session.tags && session.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {session.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-background border border-border rounded-md text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {session.tags.length > 3 && <span className="px-2 py-0.5 bg-background border border-border rounded-md text-[9px] font-bold uppercase tracking-widest text-muted-foreground">+{session.tags.length - 3}</span>}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto">
                  {isLive ? (
                    <Link href={session.meeting_link} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                      <Video className="w-4 h-4" /> Enter Room
                    </Link>
                  ) : isEnded ? (
                    <button disabled className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-muted-foreground font-black uppercase tracking-widest text-[10px] cursor-not-allowed">
                      Transmission Concluded
                    </button>
                  ) : isHost ? (
                    <button 
                      onClick={() => handleStartNow(session.id)}
                      disabled={isStartingSession === session.id}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#00BC7D] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#00BC7D]/90 transition-all shadow-[0_0_15px_rgba(0,188,125,0.2)]"
                    >
                      {isStartingSession === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                      Override: Start Now
                    </button>
                  ) : sessionPast ? (
                     <button disabled className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-muted-foreground font-black uppercase tracking-widest text-[10px] cursor-not-allowed">
                      Host Offline
                    </button>
                  ) : (
                    <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-[#00BC7D]/30 text-[#00BC7D] hover:bg-[#00BC7D]/10 font-black uppercase tracking-widest text-[10px] transition-colors">
                      <Clock className="w-4 h-4" /> RSVP Notified
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}