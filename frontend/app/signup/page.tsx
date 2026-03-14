"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Library, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

import { signup } from "@/app/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      const result = await signup(formData);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.success);
        router.push(`/verify?email=${encodeURIComponent(email)}&type=signup`);
      }
    } catch (error: any) {
      toast.error("Failed to initialize account");
    } finally {
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
            src="https://images.unsplash.com/photo-1541339907198-e08756ebafe1?q=80&w=2000" 
            alt="Campus" 
            className="w-full h-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#00BC7D]/20 via-background/80 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80" />
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="w-12 h-12 border-2 border-[#00BC7D]/30 rounded-full flex items-center justify-center text-[#00BC7D] bg-background/50 shadow-[0_0_20px_rgba(0,188,125,0.3)]">
              <Library className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase text-foreground">peergraph</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-6xl font-black tracking-tighter leading-[0.9] text-foreground mb-8 uppercase">
              Join the <br /> <span className="text-[#00BC7D]">Intelligence.</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed mb-12">
              Access your major's specific vector database, join live peer Canvas sessions, and earn Karma by contributing to the network.
            </p>

            <div className="space-y-6">
              {[
                { icon: Shield, title: "Verified Identity", desc: "Proof of enrollment via institutional email." },
                { icon: GraduationCap, title: "Curriculum Sync", desc: "Notes and AIs automatically tuned to your syllabus." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="mt-1 w-5 h-5 text-[#00BC7D]">
                    <item.icon className="w-full h-full" />
                  </div>
                  <div>
                    <h5 className="font-extrabold uppercase tracking-widest text-xs mb-1 text-foreground">{item.title}</h5>
                    <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative bg-background">
        <div className="absolute top-8 right-8 flex items-center gap-4">
          <ThemeToggle />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tighter uppercase mb-4 text-foreground">Registration</h2>
            <p className="text-muted-foreground font-medium">Already part of the network? <Link href="/login" className="text-[#00BC7D] font-bold hover:underline">Sign In</Link></p>
          </div>

          <form className="space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                  disabled={loading}
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="email" 
                  placeholder="University Email (.edu)" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                  disabled={loading}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="password" 
                  placeholder="Network Key (Password)" 
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
                  placeholder="Confirm Network Key" 
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
              {loading ? "Initializing..." : "Initialize Account"}
            </Button>

            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Institutional Verify</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <p className="text-[10px] text-muted-foreground text-center font-bold leading-relaxed uppercase tracking-widest px-8">
              By initializing, you agree to the cryptographic governance and data fragmentation protocols.
            </p>
          </form>

          {/* Mobile Only Footer */}
          <div className="md:hidden mt-16 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <Library className="w-6 h-6 text-[#00BC7D]" />
              <span className="text-xl font-black uppercase tracking-tighter">peergraph</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
