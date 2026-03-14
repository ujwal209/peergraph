"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Library, 
  Mail, 
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

import { login } from "@/app/actions/auth";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  useEffect(() => {
    if (message) {
      toast.info(message);
    }
  }, [message]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await login(formData);

      if (result?.error) {
        toast.error(result.error);
        setLoading(false); // Stop loading only on actual error
      } else {
        toast.success("Identity Verified. Accessing Hub...");
        // Do NOT set loading to false here. Keep the button spinning while Next.js transitions the page!
      }
    } catch (error: any) {
      // FIX: Next.js throws a special 'NEXT_REDIRECT' error to trigger page changes. 
      // We must catch it and re-throw it so the redirect actually happens!
      if (error?.message?.includes("NEXT_REDIRECT") || error?.digest?.includes("NEXT_REDIRECT")) {
        throw error; 
      }
      
      console.error(error);
      toast.error("Failed to verify identity");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Branding & Experience */}
      <div className="relative hidden md:flex md:w-[60%] bg-zinc-950 items-center justify-center p-12 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1523050335102-c6744729ea2a?q=80&w=2000" 
            alt="Campus Library" 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00BC7D]/10 via-background/80 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80" />
        </div>

        <div className="relative z-10 max-w-xl text-center md:text-left" >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center md:justify-start gap-4 mb-16"
          >
            <div className="w-12 h-12 border-2 border-[#00BC7D]/30 rounded-full flex items-center justify-center text-[#00BC7D] bg-background/50 shadow-[0_0_20px_rgba(0,188,125,0.3)]" >
              <Library className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase text-foreground" >peergraph</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] text-foreground mb-10 uppercase" >
              Resume <br /> <span className="text-[#00BC7D]" >Sequence.</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed mb-12 max-w-lg mx-auto md:mx-0" >
              Re-enter the intelligence network, access your fragmented data, and continue your collaborative academic journey.
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start opacity-40" >
              {["Active Nodes", "Live Canvas", "Verified Registry"].map((text, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-1.5 border border-border rounded-full text-[10px] font-black uppercase tracking-widest" >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00BC7D]" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative bg-background" >
        <div className="absolute top-8 right-8 flex items-center gap-4" >
          <ThemeToggle />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="mb-12 text-center md:text-left" >
            <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 text-foreground" >Sign In</h2>
            <p className="text-muted-foreground font-medium italic" >New to the network? <Link href="/signup" className="text-[#00BC7D] font-bold hover:underline" >Register Hub</Link></p>
          </div>

          <form className="space-y-8" onSubmit={handleLogin} >
            <div className="space-y-4" >
              <div className="relative group" >
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="email" 
                  placeholder="Network Identity (Email)" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                  disabled={loading}
                />
              </div>

              <div className="relative group" >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="password" 
                  placeholder="Sequence Key (Password)" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2" >
              <label className="flex items-center gap-2 cursor-pointer group" >
                <input type="checkbox" className="w-4 h-4 rounded border-border text-[#00BC7D] focus:ring-[#00BC7D] bg-background" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors" >Keep Session Active</span>
              </label>
              <Link href="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D] hover:underline">Forgot Key?</Link>
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-2xl h-16 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,188,125,0.3)] hover:scale-105 transition-all border-none"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Initialize Session"}
            </Button>
          </form>

          {/* Institutional Note */}
          <div className="mt-12 p-6 rounded-2xl bg-[#00BC7D]/5 border border-[#00BC7D]/20" >
            <p className="text-[10px] font-black uppercase tracking-widest text-[#00BC7D] text-center leading-relaxed" >
              Ensure you are connecting via a secure institutional node for full repository access.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}