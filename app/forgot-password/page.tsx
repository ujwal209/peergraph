"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Library, Mail, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { sendPasswordResetOTP } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email");
      return;
    }

    setLoading(true);
    try {
      const result = await sendPasswordResetOTP(email);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Recovery sequence initiated.");
        // If the user wants to use the OTP verification page for recovery:
        router.push(`/verify?email=${encodeURIComponent(email)}&type=recovery`);
      }
    } catch (error) {
      toast.error("Failed to initiate recovery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Branding */}
      <div className="relative hidden md:flex md:w-[60%] bg-zinc-950 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000" 
            alt="Space" 
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
            Account <br /> <span className="text-[#00BC7D]">Recovery.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium mb-12">
            Initiate a secure recovery sequence to regain access to your fragmented academic data. 
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
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
            <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 text-foreground">Forgot Key?</h2>
            <p className="text-muted-foreground font-medium italic">Enter your identity email to re-verify.</p>
          </div>

          <form className="space-y-8" onSubmit={handleReset}>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
              <input 
                type="email" 
                placeholder="Institutional Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                disabled={loading}
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-2xl h-16 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,188,125,0.3)] hover:scale-105 transition-all border-none"
              disabled={loading}
            >
              {loading ? "Initiating..." : "Start Recovery"}
            </Button>
            
            <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Remembered? <Link href="/login" className="text-[#00BC7D] hover:underline ml-1">Sign In</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
