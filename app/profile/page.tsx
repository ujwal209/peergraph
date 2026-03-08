import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

import { ProfileNav } from "@/components/profile-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Check if onboarded
  if (!user.user_metadata?.onboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl h-16 flex items-center px-4 md:px-8 justify-between">
        <div className="font-black uppercase tracking-tighter text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#00BC7D]/10 flex items-center justify-center text-[#00BC7D]">
             <span className="text-sm">P</span>
          </div>
          peergraph
        </div>
        <Button asChild variant="ghost" size="sm" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          <a href="/dashboard">Return to Nexus</a>
        </Button>
      </header>
      
      <main className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8 items-start">
        {/* Left Nav */}
        <ProfileNav user={user} />

        {/* Right Content */}
        <div className="flex-1 space-y-8 w-full">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 text-foreground">
              Identity <span className="text-[#00BC7D]">Node.</span>
            </h1>
            <p className="text-muted-foreground font-medium">Manage your cryptographic profile and institutional data fragments.</p>
          </div>

          <div className="bg-background border border-border rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00BC7D]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground mb-6">Registry Data</h3>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Verified Identity</label>
                  <Input 
                    disabled 
                    value={user.email} 
                    className="rounded-2xl h-14 bg-zinc-100 dark:bg-zinc-900 border-none font-bold text-muted-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D] ml-2">Full Name</label>
                  <Input 
                    defaultValue={user.user_metadata?.full_name || ""} 
                    className="rounded-2xl h-14 border-border focus-visible:ring-[#00BC7D] font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D] ml-2">Institution Code</label>
                  <Input 
                    defaultValue={user.user_metadata?.university || ""} 
                    className="rounded-2xl h-14 border-border focus-visible:ring-[#00BC7D] font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D] ml-2">Vector Specialization</label>
                  <Input 
                    defaultValue={user.user_metadata?.major || ""} 
                    className="rounded-2xl h-14 border-border focus-visible:ring-[#00BC7D] font-bold"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button className="bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-full px-8 uppercase tracking-widest font-black text-xs h-12 shadow-[0_0_15px_rgba(0,188,125,0.3)] hover:scale-105 transition-all">
                  Sync Modifications
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
