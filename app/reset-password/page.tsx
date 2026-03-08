"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Library, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { updatePassword } from "@/app/actions/auth";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: "Please fill in all fields" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password, email);
      
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        setLoading(false);
      } else {
        setMessage({ type: 'success', text: "Identity Key Re-layered Successfully." });
        // Redirect to login after a short delay so the user sees the success message
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Failed to update password" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      <div className="relative hidden md:flex md:w-[60%] bg-zinc-950 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1510511459019-5dee997dd3db?q=80&w=2000" 
            alt="Circuit" 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00BC7D]/10 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-12 h-12 border-2 border-[#00BC7D]/30 rounded-full flex items-center justify-center text-[#00BC7D] bg-background/50 shadow-[0_0_20px_rgba(0,188,125,0.3)]">
              <Library className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase text-foreground">peergraph</span>
          </motion.div>

          <h1 className="text-6xl font-black tracking-tighter leading-[0.9] text-foreground mb-10 uppercase">
            Define <br /> <span className="text-[#00BC7D]">Sequence.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium mb-12">
            Establish a new cryptographic key for your identity. Ensure it meets the network complexity requirements.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative bg-background">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 text-foreground">New Key</h2>
            <p className="text-muted-foreground font-medium italic">Secure your access protocol.</p>
          </div>

          <form className="space-y-6" onSubmit={handleUpdate}>
            
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${
                  message.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                    : 'bg-[#00BC7D]/10 border-[#00BC7D]/20 text-[#00BC7D]'
                }`}
              >
                {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {message.text}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="password" 
                  placeholder="New Network Key" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                  disabled={loading}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="password" 
                  placeholder="Confirm New Key" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-2xl h-16 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,188,125,0.3)] hover:scale-105 transition-all border-none"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Network Key"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Initializing Reset sequence...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}