import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { 
  Library, BookOpen, MessageSquare, User, LogOut, 
  Search, Bot, Users, Radio 
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

  const navLinks = [
    { label: "Curriculum", icon: BookOpen, href: "/dashboard/curriculum" },
    { label: "Discussions", icon: MessageSquare, href: "/dashboard/discussions" },
    { label: "AI Ask", icon: Bot, href: "/dashboard/ai-ask" },
    { label: "Sessions", icon: Users, href: "/dashboard/sessions" },
    { label: "Profile", icon: User, href: "/dashboard/profile" },
  ];

  return (
    // Added "group" here to detect what page is inside the layout
    <div className="flex flex-col min-h-screen bg-background group">
      
      {/* Top Navbar Navigation - Hides automatically if room page is open */}
      <nav className="group-has-[#is-room-page]:hidden sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl h-16 flex items-center justify-between px-4 md:px-8 shadow-sm">
        
        {/* Left Side: Branding & Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group/logo shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#00BC7D] flex items-center justify-center text-white rotate-3 group-hover/logo:rotate-0 transition-transform shadow-[0_0_10px_rgba(0,188,125,0.4)]">
              <Library className="w-4 h-4" />
            </div>
            <span className="font-black italic uppercase tracking-tighter text-lg hidden sm:block">PeerGraph</span>
          </Link>

          {/* Horizontal Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-[10px] transition-all"
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side: Actions, Theme, Profile, SignOut */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          <Link 
            href="/dashboard/sessions/create" 
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] group/btn"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse group-hover/btn:animate-none" />
            <span className="hidden sm:inline">Go Live</span>
          </Link>

          <div className="hidden lg:flex relative group/search items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground group-focus-within/search:text-[#00BC7D] transition-colors" />
            <input 
              placeholder="Search index..." 
              className="w-40 xl:w-48 bg-zinc-100 dark:bg-zinc-900 border border-transparent rounded-full py-1.5 pl-9 pr-4 text-xs font-bold outline-none focus:border-[#00BC7D]/50 focus:ring-1 focus:ring-[#00BC7D]/50 transition-all placeholder:font-medium"
            />
          </div>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={avatarUrl} 
              alt="User Avatar" 
              className="w-8 h-8 rounded-full border border-border object-cover shrink-0" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full border border-border bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          <form action={signOut}>
            <button 
              title="Sign Out"
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </nav>

      {/* Main Content Area - Removes padding if room page is open */}
      <main className="group-has-[#is-room-page]:p-0 group-has-[#is-room-page]:overflow-hidden flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0">
        <div className="mx-auto h-full w-full">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - Hides automatically if room page is open */}
      <div className="group-has-[#is-room-page]:hidden md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-md px-2 py-3 flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom)]">
         {navLinks.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-[#00BC7D] transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}