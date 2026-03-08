import { getDashboardData } from "@/app/actions/dashboard";
import { 
  Activity, BookOpen, Zap, Users, ArrowRight, 
  Radio, ShieldCheck, User 
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  // Fetch all dynamic data from our dedicated server action
  const { user, stats, activeSessions } = await getDashboardData();

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 p-8 md:p-14 border border-border shadow-2xl">
        {/* Glowing Background Effect */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00BC7D]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#00BC7D]/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00BC7D]/10 border border-[#00BC7D]/20 text-[#00BC7D] text-[10px] font-black uppercase tracking-widest mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Neural Link Established
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
              Welcome back,<br/>
              <span className="text-[#00BC7D]">{user?.firstName || 'Peer'}.</span>
            </h1>
            <p className="text-zinc-400 font-medium text-sm md:text-base max-w-md leading-relaxed">
              System nominal. Your institutional vectors are fully synchronized. The network awaits your input.
            </p>
          </div>

          <Link href="/dashboard/curriculum" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#00BC7D] text-white rounded-full font-black uppercase tracking-widest text-xs overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,188,125,0.4)] shrink-0">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10 flex items-center gap-2">
              Initialize Matrix <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>

      {/* --- DYNAMIC STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border border-border rounded-[2rem] relative overflow-hidden group hover:border-[#00BC7D]/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syllabus Completion</h3>
            <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-foreground"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="text-5xl font-black tracking-tighter text-foreground mb-2">{stats.completion}%</div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-4 overflow-hidden">
            <div className="bg-[#00BC7D] h-1.5 rounded-full transition-all duration-1000" style={{ width: `${stats.completion}%` }} />
          </div>
        </div>

        <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border border-border rounded-[2rem] relative overflow-hidden group hover:border-[#00BC7D]/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network Karma</h3>
            <div className="p-2 bg-[#00BC7D]/10 text-[#00BC7D] rounded-xl"><Zap className="w-4 h-4" /></div>
          </div>
          <div className="text-5xl font-black tracking-tighter text-foreground mb-1">{stats.karma.toLocaleString()}</div>
          <p className="text-xs font-bold text-[#00BC7D] uppercase tracking-widest mt-2">Total Contributed</p>
        </div>

        <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border border-border rounded-[2rem] relative overflow-hidden group hover:border-[#00BC7D]/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Vectors</h3>
            <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-foreground"><BookOpen className="w-4 h-4" /></div>
          </div>
          <div className="text-5xl font-black tracking-tighter text-foreground mb-1">{stats.sessionsTaken}</div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Sessions Attended</p>
        </div>
      </div>

      {/* --- PEER LEARNING CARDS --- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-500 animate-pulse absolute" />
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Active Peer Links</h2>
          </div>
          <Link href="/dashboard/sessions" className="text-[10px] font-black uppercase tracking-widest text-[#00BC7D] hover:underline">
            View Global Network
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSessions && activeSessions.length > 0 ? (
            activeSessions.map((session: any) => {
              const hostName = session.host?.full_name || "Anonymous Peer";
              const hostAvatar = session.host?.avatar_url;
              const route = session.meeting_link?.includes('/dashboard/sessions/room/') 
                ? session.meeting_link 
                : `/dashboard/sessions/room/${session.meeting_link || session.id}`;

              return (
                <div key={session.id} className="group bg-background border border-border rounded-[2rem] p-6 hover:border-[#00BC7D]/40 hover:shadow-[0_10px_40px_-15px_rgba(0,188,125,0.2)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                  
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00BC7D]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                      {hostAvatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={hostAvatar} 
                          alt={hostName} 
                          className="w-14 h-14 rounded-2xl object-cover border border-border group-hover:border-[#00BC7D] transition-colors"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border group-hover:border-[#00BC7D] transition-colors flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-background rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-border" title="Max Participants">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-black tracking-widest text-foreground">{session.max_participants || 10}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 mb-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#00BC7D]">
                      Hosting Live Vector
                    </div>
                    <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-[#00BC7D] transition-colors line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground truncate">Host: {hostName}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-2 overflow-hidden flex-wrap h-6">
                      {(session.tags || []).slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 text-muted-foreground px-2 py-1 rounded-md truncate max-w-[80px]">
                          #{tag}
                        </span>
                      ))}
                      {(session.tags || []).length > 2 && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1 py-1">
                          +{session.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <Link href={route} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-foreground group-hover:bg-[#00BC7D] group-hover:text-white transition-colors shrink-0">
                      <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-border rounded-[2rem]">
              <Radio className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-1">No Active Vectors</h3>
              <p className="text-sm font-medium text-muted-foreground max-w-sm text-center">There are no live peer sessions right now. Be the first to initialize a network node.</p>
              <Link href="/dashboard/sessions/create" className="mt-6 px-6 py-2.5 bg-foreground text-background rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">
                Host a Session
              </Link>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}