"use client";

import { useState, useEffect, useRef } from "react";
import { User, Shield, Zap, Camera, Loader2, CheckCircle2, Award, Users, Hexagon, Flame } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, updateUserProfile } from "@/app/actions/profile";
import { useRouter } from "next/navigation";

export default function DashboardProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Read-only Stats State
  const [userEmail, setUserEmail] = useState("");
  const [stats, setStats] = useState({
    karma: 0,
    sessions: 0,
    badges: [] as string[]
  });

  // Editable Form State
  const [formData, setFormData] = useState({
    full_name: "",
    semester: "",
    college: "",
    branch: "",
    avatar_url: "",
  });

  // Fetch initial data on mount
  useEffect(() => {
    async function loadData() {
      const res = await getUserProfile();
      if (res.error) {
        toast.error(res.error);
        router.push("/login");
      } else if (res.authUser) {
        setUserEmail(res.authUser.email || "");
        
        // Populate Editable Data
        setFormData({
          full_name: res.dbUser?.full_name || res.authUser.user_metadata?.full_name || "",
          semester: res.dbUser?.semester?.toString() || "",
          college: res.dbUser?.college || "",
          branch: res.dbUser?.branch || "",
          avatar_url: res.dbUser?.avatar_url || res.authUser.user_metadata?.avatar_url || "",
        });

        // Populate Read-Only Stats (with mock fallbacks if empty for visual demo)
        setStats({
          karma: res.dbUser?.karma_points || 0,
          sessions: res.dbUser?.peer_sessions_taken || 0,
          badges: res.dbUser?.badges && res.dbUser.badges.length > 0 
            ? res.dbUser.badges 
            : ['Network Pioneer', 'Early Adopter', 'First Connection'] // Mock badges if empty
        });
      }
      setIsLoading(false);
    }
    loadData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cloudinary Unsigned Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error("Cloudinary environment variables are missing.");
      return;
    }

    setIsUploading(true);
    
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", uploadPreset);
      data.append("cloud_name", cloudName);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: data,
      });

      const uploadedImage = await res.json();
      
      if (uploadedImage.secure_url) {
        setFormData(prev => ({ ...prev, avatar_url: uploadedImage.secure_url }));
        toast.success("Image uploaded successfully");
      } else {
        throw new Error("Failed to get image URL");
      }
    } catch (error) {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (formData.semester && (Number(formData.semester) < 1 || Number(formData.semester) > 8)) {
      toast.error("Semester must be between 1 and 8");
      return;
    }

    setIsSaving(true);
    const res = await updateUserProfile({
      ...formData,
      semester: Number(formData.semester) || 1
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Profile metadata synced to network");
      router.refresh(); 
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)]">
        <Loader2 className="w-12 h-12 animate-spin text-[#00BC7D] mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Decrypting Identity...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* --- HERO PROFILE SECTION --- */}
      <div className="relative rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/40 border border-border p-6 md:p-10 overflow-hidden shadow-sm">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#00BC7D]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          {/* Avatar Area */}
          <div className="relative group shrink-0 w-fit mx-auto md:mx-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-background border-4 border-background shadow-[0_0_20px_theme(colors.border)] flex items-center justify-center overflow-hidden relative">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-muted-foreground opacity-50" />
              )}
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-[#00BC7D]" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-foreground mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Update</span>
                  </>
                )}
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            
            {/* Rank Badge */}
            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-[#00BC7D] text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-background transform rotate-12 group-hover:rotate-0 transition-transform">
              <Hexagon className="w-6 h-6 fill-white/20" />
            </div>
          </div>

          {/* User Title Area */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00BC7D]/10 border border-[#00BC7D]/20 text-[#00BC7D] text-[10px] font-black uppercase tracking-widest mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Peer
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground line-clamp-1">
              {formData.full_name || "Anonymous Node"}
            </h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-2">
              {userEmail} • S-0{formData.semester || "?"} {formData.branch && `• ${formData.branch}`}
            </p>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 relative z-10">
          <div className="bg-background border border-border rounded-3xl p-5 flex flex-col items-center justify-center text-center">
            <Zap className="w-5 h-5 text-[#00BC7D] mb-2" />
            <div className="text-3xl font-black tracking-tighter">{stats.karma}</div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Network Karma</p>
          </div>
          <div className="bg-background border border-border rounded-3xl p-5 flex flex-col items-center justify-center text-center">
            <Users className="w-5 h-5 text-blue-500 mb-2" />
            <div className="text-3xl font-black tracking-tighter">{stats.sessions}</div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Sessions Taken</p>
          </div>
          <div className="col-span-2 bg-background border border-border rounded-3xl p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-purple-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Badges</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.badges.length === 0 ? (
                <span className="text-xs font-medium text-muted-foreground italic">No badges earned yet.</span>
              ) : (
                stats.badges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground">
                    <Flame className="w-3 h-3 text-orange-500" /> {badge}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- METADATA EDITOR FORM --- */}
      <div className="grid gap-6 bg-zinc-50 dark:bg-zinc-900/40 border border-border p-6 md:p-10 rounded-[2.5rem]">
        <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2 border-b border-border pb-4">
          <Shield className="w-5 h-5 text-muted-foreground" /> Metadata Configuration
        </h3>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-foreground ml-1">Full Designation</label>
          <input 
            name="full_name"
            value={formData.full_name} 
            onChange={handleChange}
            placeholder="John Doe"
            className="w-full h-12 md:h-14 bg-background border border-border rounded-2xl px-5 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground ml-1">Institution / College</label>
            <input 
              name="college"
              value={formData.college} 
              onChange={handleChange}
              placeholder="Institute of Technology"
              className="w-full h-12 md:h-14 bg-background border border-border rounded-2xl px-5 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground ml-1">Engineering Branch</label>
            <input 
              name="branch"
              value={formData.branch} 
              onChange={handleChange}
              placeholder="Computer Science"
              className="w-full h-12 md:h-14 bg-background border border-border rounded-2xl px-5 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-foreground ml-1">Current Semester (1-8)</label>
          <input 
            name="semester"
            type="number"
            min="1"
            max="8"
            value={formData.semester} 
            onChange={handleChange}
            placeholder="5"
            className="w-full h-12 md:h-14 bg-background border border-border rounded-2xl px-5 text-sm font-bold focus:border-[#00BC7D]/50 outline-none transition-colors" 
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
          <button className="h-12 md:h-14 flex items-center justify-center gap-2 rounded-2xl border-2 border-border font-bold uppercase tracking-widest text-[10px] text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
            <Shield className="w-4 h-4" /> Account Settings
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="h-12 md:h-14 flex items-center justify-center gap-2 rounded-2xl bg-[#00BC7D] text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#00BC7D]/90 disabled:opacity-50 transition-all shadow-lg shadow-[#00BC7D]/20 active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isSaving ? "Syncing..." : "Update Metadata"}
          </button>
        </div>

      </div>
    </div>
  );
}