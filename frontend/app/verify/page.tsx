"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Library, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { verifyEmailOTP, verifyResetOTP } from "@/app/actions/auth";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const type = (searchParams.get("type") as "signup" | "recovery") || "signup";
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Email missing for verification");
      router.push("/signup");
    }
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (type === "signup") {
        result = await verifyEmailOTP(email, otp);
      } else {
        result = await verifyResetOTP(email, otp);
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Identity Verified.");
      }
    } catch (error) {
      toast.error("Verification failed");
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
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000" 
            alt="Security" 
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
            Verify <br /> <span className="text-[#00BC7D]">Sequence.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium mb-12">
            A 6-digit cryptographic token has been dispatched to your institutional node. Input the sequence to verify your identity.
          </p>
        </div>
      </div>

      {/* Right Side: OTP Form */}
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
            <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 text-foreground">Code Verification</h2>
            <p className="text-muted-foreground font-medium italic">Sent to: <span className="text-[#00BC7D] font-bold">{email}</span></p>
          </div>

          <form className="space-y-8" onSubmit={handleVerify}>
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
              <input 
                type="text" 
                maxLength={6}
                placeholder="0 0 0 0 0 0" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-background border border-border rounded-2xl py-6 pl-12 pr-4 text-2xl font-black tracking-[0.5em] text-center outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm placeholder:tracking-normal placeholder:text-sm placeholder:font-bold"
                disabled={loading}
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-2xl h-16 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,188,125,0.3)] hover:scale-105 transition-all border-none"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Validate Sequence"}
            </Button>
            
            <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Didn't receive the code? <button type="button" className="text-[#00BC7D] hover:underline ml-1">Retransmit</button>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Initializing Verification...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
