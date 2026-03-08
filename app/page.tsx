"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  FileText, 
  BookOpen, 
  Search, 
  Shield, 
  ChevronRight,
  Library,
  Mail,
  GraduationCap,
  Network,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Play,
  Mic,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle"; // Properly imported

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border py-4" : "bg-transparent py-6"}`}>
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#00BC7D]/20 rounded-full flex items-center justify-center text-[#00BC7D] bg-background/50 shadow-[0_0_15px_rgba(0,188,125,0.2)]">
            <Library className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase text-foreground drop-shadow-sm">peergraph</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-12 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <a href="#protocol" className="hover:text-[#00BC7D] transition-colors">Architecture</a>
          <a href="#sessions" className="hover:text-[#00BC7D] transition-colors">Live Canvas</a>
          <a href="#scholars" className="hover:text-[#00BC7D] transition-colors">Registry</a>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle /> {/* Theme Toggle placed right before actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="ghost" asChild className="rounded-full px-6 font-bold text-xs uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-foreground/5">
              <a href="/login">Login</a>
            </Button>
            <Button asChild className="bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-full px-8 h-12 text-xs uppercase font-extrabold tracking-widest shadow-[0_0_20px_rgba(0,188,125,0.3)] transition-all hover:scale-105 border-none">
              <a href="/signup">Initialize</a>
            </Button>
          </div>
          <button 
            className="lg:hidden p-2 text-foreground/80 hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-20 left-4 right-4 bg-background/95 backdrop-blur-xl rounded-[2rem] p-8 border border-border shadow-2xl flex flex-col gap-6 text-center z-40"
          >
            <a href="#protocol" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Architecture</a>
            <a href="#sessions" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Live Canvas</a>
            <a href="#scholars" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Registry</a>
            <div className="h-px bg-border my-2" />
            <Button variant="outline" asChild className="rounded-full uppercase font-bold tracking-widest text-xs h-12 border-border text-foreground hover:bg-accent">
              <a href="/login">Login</a>
            </Button>
            <Button asChild className="bg-[#00BC7D] text-white hover:bg-[#00BC7D]/90 rounded-full uppercase font-bold tracking-widest text-xs h-12 border-none">
              <a href="/signup">Initialize</a>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FullWidthHero = () => {
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000",
      tag: "KNOWLEDGE INFRASTRUCTURE",
      title: <>The Brain of <br /> Your Campus.</>,
      subtitle: "A high-fidelity academic network. Chat with your specific curriculum, join live peer huddles, and master your major.",
      features: ["RAG Synthesis", "Live Canvas", "Peer Registry"]
    },
    {
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000",
      tag: "REAL-TIME COLLABORATION",
      title: <>Connect Your <br /> Universe.</>,
      subtitle: "Synchronize with top scholars from your institution in low-latency, real-time collaboration sessions.",
      features: ["Voice Huddles", "Shared Whiteboards", "Instant Bounties"]
    },
    {
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2000",
      tag: "VERIFIED REPUTATION",
      title: <>Scale Your <br /> Impact.</>,
      subtitle: "Earn cryptographic Karma points for teaching peers and uploading highly-rated study materials.",
      features: ["Reputation Badges", "Global Leaderboards", "Verified Experts"]
    }
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen min-h-[800px] flex items-center justify-center overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Theme adaptive overlay for images so text is always readable */}
          <img
            src={slides[currentIndex].image}
            className="w-full h-full object-cover grayscale opacity-20 dark:opacity-30"
            alt="Campus Architecture"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          {/* Replaced the side gradient with a center radial gradient to highlight centered text */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80" />
        </motion.div>
      </AnimatePresence>

      {/* Added pb-24 here to create a safe zone so it NEVER overlaps the bottom slider buttons */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 w-full max-w-5xl mx-auto pt-20 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full flex flex-col items-center"
          >
            <div className="inline-flex items-center justify-center gap-3 px-6 py-2 border border-border text-[10px] font-bold uppercase tracking-[0.3em] mb-10 rounded-full bg-background/50 backdrop-blur-md text-foreground">
              <div className="w-2 h-2 rounded-full bg-[#00BC7D] animate-pulse shadow-[0_0_10px_rgba(0,188,125,0.8)]" />
              {slides[currentIndex].tag}
            </div>

            {/* Title is naturally centered now */}
            <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter leading-[0.9] mb-8 text-foreground">
              {slides[currentIndex].title}
            </h1>

            {/* Added mx-auto to center the max-width block of text */}
            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
              {slides[currentIndex].subtitle}
            </p>

            {/* Forced justify-center instead of md:justify-start */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {slides[currentIndex].features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#00BC7D]/10 border border-[#00BC7D]/30 text-[10px] font-extrabold uppercase tracking-widest text-[#00BC7D] backdrop-blur-sm">
                  <ChevronRight className="w-3 h-3" />
                  {f}
                </div>
              ))}
            </div>

            {/* Forced justify-center on the buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full">
              <Button size="lg" className="bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-full h-16 px-14 text-sm uppercase font-extrabold tracking-[0.2em] shadow-[0_0_30px_rgba(0,188,125,0.4)] hover:scale-105 transition-all border-none">
                Enter Network
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-16 px-14 text-sm uppercase font-extrabold tracking-[0.2em] border-2 border-border bg-background/40 text-foreground hover:bg-foreground hover:text-background transition-all backdrop-blur-md">
                View Protocol
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators - Forced to always be center-aligned at the bottom */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-30">
        {slides.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setCurrentIndex(idx)}
            className="group relative h-4 w-12 flex items-center justify-center cursor-pointer"
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div className={`h-1.5 rounded-full transition-all duration-700 ease-out ${idx === currentIndex ? 'w-12 bg-[#00BC7D] shadow-[0_0_10px_rgba(0,188,125,0.5)]' : 'w-4 bg-foreground/20 group-hover:bg-foreground/40'}`} />
          </button>
        ))}
      </div>
    </div>
  );
};


const LiveSessions = () => {
  const sessions = [
    { 
      host: "Sarah J.", 
      topic: "Advanced Data Structures & Algorithms", 
      type: "Whiteboard Canvas",
      viewers: 24, 
      avatars: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop"
      ],
      tags: ["CS401", "Trees"],
      color: "from-blue-500/20 to-transparent"
    },
    { 
      host: "Kevin M.", 
      topic: "System Design: Microservices Architecture", 
      type: "Audio Huddle",
      viewers: 56, 
      avatars: [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop"
      ],
      tags: ["Senior", "Docker"],
      color: "from-[#00BC7D]/20 to-transparent"
    },
    { 
      host: "Elena V.", 
      topic: "Calculus III: Vector Fields & Integrals", 
      type: "PDF Annotation",
      viewers: 18, 
      avatars: [
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop"
      ],
      tags: ["MATH301", "Prep"],
      color: "from-purple-500/20 to-transparent"
    }
  ];

  return (
    <div className="py-32 bg-zinc-50 dark:bg-zinc-950/50" id="sessions">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[#00BC7D] font-bold uppercase tracking-[0.4em] mb-6 text-[10px] border border-[#00BC7D]/30 bg-[#00BC7D]/10 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#00BC7D] animate-pulse" />
              Live Canvas Network
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tighter leading-[0.9] text-foreground">
              Don't Study <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">In Silo.</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
              Drop into real-time audio huddles, shared whiteboards, and synchronized PDF annotation sessions hosted by top peers in your major.
            </p>
          </div>
          <Button variant="outline" className="rounded-full border-2 border-border h-16 px-12 uppercase font-black text-xs tracking-[0.2em] hover:bg-foreground hover:text-background transition-all bg-transparent backdrop-blur-md">
            View All Sessions
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -8 }}
              className="group relative bg-card backdrop-blur-xl rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-[#00BC7D]/50 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
            >
              <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${session.color} opacity-20`} />

              <div className="p-8 relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-2">
                    {session.tags.map((tag, idx) => (
                      <span key={idx} className="text-[9px] font-bold px-3 py-1 bg-foreground/5 border border-border rounded-full text-muted-foreground uppercase tracking-widest backdrop-blur-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-full border border-[#00BC7D]/30 text-[#00BC7D] uppercase tracking-widest bg-[#00BC7D]/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00BC7D] animate-pulse" />
                    Live
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-4 leading-tight tracking-tight text-card-foreground group-hover:text-[#00BC7D] transition-colors line-clamp-2">
                  {session.topic}
                </h3>

                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-auto">
                  {session.type === "Audio Huddle" ? <Mic className="w-4 h-4" /> : session.type === "Whiteboard Canvas" ? <Video className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  {session.type}
                </div>
              </div>

              <div className="p-8 pt-0 relative z-10 flex items-end justify-between mt-8">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Host & Audience</div>
                  <div className="flex items-center">
                    <div className="relative">
                      <img src={session.avatars[0]} alt="Host" className="w-12 h-12 rounded-full border-2 border-background relative z-30 object-cover" />
                      <div className="absolute -bottom-1 -right-1 bg-[#00BC7D] w-4 h-4 rounded-full border-2 border-background z-40" />
                    </div>
                    <div className="flex -space-x-4 ml-4">
                      {session.avatars.slice(1).map((avatar, idx) => (
                        <img key={idx} src={avatar} alt="Viewer" className="w-10 h-10 rounded-full border-2 border-background opacity-80 object-cover" style={{ zIndex: 20 - idx }} />
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground relative z-0">
                        +{session.viewers}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-[#00BC7D] flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,188,125,0.4)]">
                    <Play className="w-5 h-5 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProtocolSection = () => (
  <div className="py-32 bg-background relative overflow-hidden" id="protocol">
    <div className="absolute top-0 right-0 w-1/2 h-full bg-[#00BC7D]/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
    
    <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center relative z-10">
      <div>
        <div className="inline-flex items-center gap-2 text-muted-foreground font-bold uppercase tracking-[0.4em] mb-8 text-[10px] border border-border px-4 py-1.5 rounded-full bg-background/50">
          <Shield className="w-3 h-3" />
          RAG Architecture
        </div>
        <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[1] uppercase tracking-tighter text-foreground">
          Notes that <br /> <span className="text-[#00BC7D]">Talk Back.</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-12 font-medium leading-relaxed max-w-xl">
          Upload any standard PDF or slide deck. Our vector ingestion engine transforms static documents into a queryable semantic database, allowing you to ask specific questions and receive verified, cited answers.
        </p>
        <div className="space-y-8">
          {[
            { title: "Semantic Cross-Search", desc: "Query concepts across your entire major's uploaded history, not just file names." },
            { title: "Auto-Flashcard Generation", desc: "Instantly convert 100-page slide decks into spaced-repetition study decks." },
            { title: "Margin Community", desc: "Leave persistent, public annotations on shared documents to help future students." }
          ].map((item, i) => (
            <div key={i} className="flex gap-6 items-start group">
              <div className="mt-2 w-3 h-3 rounded-sm bg-[#00BC7D]/20 border border-[#00BC7D] group-hover:bg-[#00BC7D] transition-colors shrink-0" />
              <div>
                <h5 className="font-bold uppercase tracking-widest text-sm mb-2 text-foreground">{item.title}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative UI Mockup */}
      <div className="relative aspect-square md:aspect-[4/3] bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000')] bg-cover opacity-10 dark:opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-10 left-10 right-10 bg-background/80 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-xl transform group-hover:-translate-y-4 transition-transform duration-500">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="w-8 h-8 rounded-full bg-[#00BC7D]/20 flex items-center justify-center">
              <Search className="w-4 h-4 text-[#00BC7D]" />
            </div>
            <div className="text-xs font-mono text-muted-foreground">Querying: "Explain Fourier Transforms based on Lec 4"</div>
          </div>
          <div className="text-sm font-medium text-foreground leading-relaxed">
            <span className="text-[#00BC7D] mr-2">✦</span>
            Based on Professor Smith's Week 4 slides (Page 12), a Fourier Transform decomposes a waveform into a sum of sine and cosine waves. <span className="underline decoration-muted-foreground/50 underline-offset-4 opacity-70 cursor-pointer hover:opacity-100">[View Source Page]</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ExpertRegistry = () => (
  <div className="py-32 bg-zinc-50 dark:bg-zinc-950/50 border-t border-border" id="scholars">
    <div className="text-center mb-24">
      <div className="inline-flex items-center gap-2 mb-6 text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Proof of Work</span>
      </div>
      <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">The Registry</h2>
      <p className="text-xl text-muted-foreground mt-6 max-w-2xl mx-auto font-medium">Top-tier knowledge contributors verified by the campus network. Earn Karma by uploading pristine notes and hosting highly-rated live sessions.</p>
    </div>

    <div className="max-w-5xl mx-auto space-y-6 px-6">
      {[
        { name: "Jordan Smith", points: "2,480", badges: 12, rank: 1, major: "Computer Science", img: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop" },
        { name: "Miyu Sato", points: "2,120", badges: 9, rank: 2, major: "Electrical Engineering", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop" },
        { name: "Carlos Ruiz", points: "1,950", badges: 11, rank: 3, major: "Mechanical Physics", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop" }
      ].map((expert, i) => (
        <div key={i} className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-background rounded-[2rem] border border-border hover:border-[#00BC7D]/30 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-xl hover:scale-[1.02]">
          <div className="text-5xl font-black text-muted-foreground/20 tabular-nums ml-4 group-hover:text-[#00BC7D]/20 transition-colors">0{expert.rank}</div>
          <div className="w-24 h-24 rounded-full border-2 border-border shadow-sm overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 relative z-10 -ml-8 bg-background">
            <img src={expert.img} alt={expert.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
            <h4 className="font-black text-3xl tracking-tighter mb-1 text-foreground">{expert.name}</h4>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{expert.major}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00BC7D]">{expert.badges} Guru Badges</span>
            </div>
          </div>
          <div className="text-center sm:text-right bg-foreground/5 rounded-2xl px-8 py-4 w-full sm:w-auto mt-6 sm:mt-0">
            <div className="text-4xl font-black tabular-nums text-foreground group-hover:text-[#00BC7D] transition-colors">{expert.points}</div>
            <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-[0.3em] mt-1">Karma Points</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#00BC7D] selection:text-white font-sans overflow-x-hidden">
      <Navbar />

      <main>
        <FullWidthHero />
        <ProtocolSection />
        <LiveSessions />
        <ExpertRegistry />

        {/* BOTTOM CTA */}
        <section className="py-40 bg-background relative border-t border-border text-center px-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00BC7D]/5 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 uppercase leading-[0.9] text-foreground">
              Sync Your <br /> System.
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium">
              Join the ecosystem. Input your university email to access your specific major's intelligence network.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
              <div className="flex-1 bg-background px-6 py-4 flex items-center gap-4 border border-border rounded-full focus-within:border-[#00BC7D] transition-colors shadow-sm">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="student@university.edu" 
                  className="bg-transparent border-none outline-none flex-1 text-sm font-bold tracking-wider placeholder:text-muted-foreground text-foreground"
                />
              </div>
              <Button className="bg-[#00BC7D] hover:bg-[#00BC7D]/90 text-white rounded-full h-auto py-5 px-12 font-extrabold text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,188,125,0.3)] hover:scale-105 transition-all w-full sm:w-auto border-none">
                Initialize
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-8 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              <GraduationCap className="w-4 h-4" /> 
              Valid .edu credential required for registry entry.
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-100 dark:bg-zinc-950 pt-20 pb-12 px-8 border-t border-border">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20">
            <div className="flex items-center gap-4 text-[#00BC7D]">
              <Library className="w-8 h-8" />
              <span className="text-3xl font-black tracking-tighter uppercase">peergraph</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center hover:bg-foreground hover:text-background transition-all text-muted-foreground">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center hover:bg-foreground hover:text-background transition-all text-muted-foreground">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center hover:bg-foreground hover:text-background transition-all text-muted-foreground">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20 border-t border-border pt-20">
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[10px] mb-6 text-muted-foreground">Platform</h5>
              <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-foreground/80">
                <a href="#" className="hover:text-[#00BC7D] transition-colors">RAG Engine</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Live Canvas</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Karma System</a>
              </div>
            </div>
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[10px] mb-6 text-muted-foreground">Developers</h5>
              <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-foreground/80">
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Documentation</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">API Reference</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">GitHub Repo</a>
              </div>
            </div>
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[10px] mb-6 text-muted-foreground">Company</h5>
              <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-foreground/80">
                <a href="#" className="hover:text-[#00BC7D] transition-colors">About Us</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Careers</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[10px] mb-6 text-muted-foreground">Legal</h5>
              <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-foreground/80">
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-[#00BC7D] transition-colors">Security</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
            <p>© 2026 PEERGRAPH INFRASTRUCTURE.</p>
            <p>ALL SYSTEMS OPERATIONAL.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}