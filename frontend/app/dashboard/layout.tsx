import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { 
  Library, BookOpen, MessageSquare, User, LogOut, 
  Bot, Users, Radio, FileText 
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");
  if (!user.user_metadata?.onboarded) return redirect("/onboarding");

  const avatarUrl = user.user_metadata?.avatar_url;

  // Dashboard Navigation List - Consolidated AI
  const navLinks = [
    { label: "AI Assistant", icon: Bot, href: "/dashboard/pdf-intel" },
    { label: "Curriculum", icon: BookOpen, href: "/dashboard/curriculum" },
    { label: "Notes & PYQs", icon: FileText, href: "/dashboard/resources" },
    { label: "Discussions", icon: MessageSquare, href: "/dashboard/discussions" },
    { label: "Sessions", icon: Users, href: "/dashboard/sessions" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background group">
      
      {/* Top Navbar Navigation */}
      <nav className="group-has-[#is-room-page]:hidden sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl h-16 flex items-center px-4 md:px-8 shadow-sm">
        
        {/* Left Side: Branding (Takes 1 fraction of space to balance right side) */}
        <div className="flex-1 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2.5 group/logo shrink-0 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-full bg-[#00BC7D] flex items-center justify-center text-white rotate-3 group-hover/logo:rotate-0 transition-transform shadow-[0_0_12px_rgba(0,188,125,0.4)]">
              <Library className="w-4 h-4" />
            </div>
            <span className="font-black italic uppercase tracking-tighter text-lg hidden sm:block">PeerGraph</span>
          </Link>
        </div>

        {/* Center: Navigation Links (Perfectly Centered) */}
        <div className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2">
          {navLinks.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-[10px] transition-all group/link"
            >
              <item.icon className="w-4 h-4 text-muted-foreground group-hover/link:text-[#00BC7D] transition-colors" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Side: Actions, Theme, Profile, SignOut (Takes 1 fraction of space) */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
          
          <Link 
            href="/dashboard/sessions/create" 
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] group/btn"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse group-hover/btn:animate-none" />
            <span className="hidden sm:inline">Go Live</span>
          </Link>

          {/* Theme Toggle */}
          <div className="shrink-0 hidden sm:block">
            <ThemeToggle />
          </div>
          
          {/* Clickable Profile Avatar */}
          <Link href="/dashboard/profile" className="shrink-0 group/avatar">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="User Avatar" 
                className="w-9 h-9 rounded-full border border-border object-cover group-hover/avatar:border-[#00BC7D] transition-colors shadow-sm" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full border border-border bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover/avatar:border-[#00BC7D] transition-colors shadow-sm">
                <User className="w-4 h-4 text-muted-foreground group-hover/avatar:text-[#00BC7D]" />
              </div>
            )}
          </Link>

          <form action={signOut}>
            <button 
              title="Sign Out"
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="group-has-[#is-room-page]:p-0 group-has-[#is-room-page]:overflow-hidden flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0">
        <div className="mx-auto h-full w-full">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="group-has-[#is-room-page]:hidden md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-xl px-2 py-3 flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
         {navLinks.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center gap-1.5 p-1 text-muted-foreground hover:text-[#00BC7D] transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-center leading-none">
                {item.label}
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}