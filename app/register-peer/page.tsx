"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Library, BookOpen, Clock, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { registerPeerSession } from "./actions";


export default function RegisterPeerPage() {
  const [subject, setSubject] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !hourlyRate) {
      toast.error("Required fields missing");
      return;
    }

    setLoading(true);
    try {
      const result = await registerPeerSession(subject, Number(hourlyRate), about);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Peer Node Registered to Network.");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Network communication failure");
    } finally {
      setLoading(false);
    }
  };

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
      
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-background border border-border rounded-[2rem] shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00BC7D]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="p-8 md:p-12 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 border border-[#00BC7D]/30 rounded-full flex items-center justify-center text-[#00BC7D] bg-[#00BC7D]/10">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">
                  Initialize <span className="text-[#00BC7D]">Peer Node.</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm">Contribute intelligence to the network.</p>
              </div>
            </div>

            <form className="mt-10 space-y-6" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D] mb-2 block ml-2">Vector Subject</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                    <input 
                      type="text" 
                      placeholder="e.g. Data Structures & Algorithms" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-border rounded-2xl h-14 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D] mb-2 block ml-2">Hourly Karma Rate</label>
                  <div className="relative">
                    <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-border rounded-2xl h-14 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D] mb-2 block ml-2">Node Parameters (About)</label>
                <textarea 
                  placeholder="Detail your operational parameters and specialized knowledge vectors..." 
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-border rounded-2xl p-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm min-h-[120px] resize-y"
                  disabled={loading}
                />
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:block">
                  Registry requires valid institutional credentials.
                </p>
                <Button 
                  type="submit"
                  className="w-full md:w-auto bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-full px-8 uppercase tracking-widest font-black text-xs h-12 shadow-[0_0_15px_rgba(0,188,125,0.3)] hover:scale-105 transition-all border-none"
                  disabled={loading}
                >
                  {loading ? "Transmitting..." : "Activate Node"}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
