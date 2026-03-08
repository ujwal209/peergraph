"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Library, GraduationCap, Building, Upload, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { saveOnboardingData } from "./actions";

export default function OnboardingPage() {
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle local image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "peergraph_preset"); // Replace with your preset
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName) {
      throw new Error("Cloudinary Cloud Name is missing in .env");
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to upload image to Cloudinary");
    
    const data = await response.json();
    return data.secure_url;
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!college || !branch) {
      toast.error("Please provide institutional details");
      return;
    }

    setLoading(true);
    try {
      let uploadedAvatarUrl = null;
      
      // If user selected an image, upload it first
      if (avatarFile) {
        toast.loading("Uploading identity matrix...", { id: "upload-toast" });
        uploadedAvatarUrl = await uploadToCloudinary(avatarFile);
        toast.dismiss("upload-toast");
      }

      const result = await saveOnboardingData(college, branch, uploadedAvatarUrl);
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Identity profile synced.");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.dismiss("upload-toast");
      toast.error(error.message || "Network error during sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Decoration Panel */}
      <div className="relative hidden md:flex md:w-[40%] bg-zinc-950 items-center justify-center p-12 overflow-hidden border-r border-border/50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00BC7D]/10 via-background/90 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_0%,var(--background)_100%)] opacity-80" />
        </div>

        <div className="relative z-10 max-w-xl text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <div className="w-16 h-16 border-2 border-[#00BC7D]/30 rounded-full flex items-center justify-center text-[#00BC7D] bg-background/50 shadow-[0_0_30px_rgba(0,188,125,0.4)]">
              <Library className="w-8 h-8" />
            </div>
          </motion.div>

          <h1 className="text-4xl font-black tracking-tighter uppercase text-foreground mb-6">
            Identity <br /> <span className="text-[#00BC7D]">Configuration.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-xs mx-auto">
            Initialize your peer network by defining your institutional boundaries.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative bg-background">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-2xl font-black uppercase tracking-widest text-foreground text-center md:text-left mb-2">Step 2: Sync Profile</h2>
            <div className="h-1 w-full bg-border rounded-full overflow-hidden">
              <div className="h-full bg-[#00BC7D] w-1/2" />
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleComplete}>
            
            {/* AVATAR UPLOAD */}
            <div className="flex flex-col items-center justify-center mb-8">
              <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-border group-hover:border-[#00BC7D] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 overflow-hidden transition-colors">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-muted-foreground group-hover:text-[#00BC7D] transition-colors" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </label>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-3">Upload Avatar</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Institution / College Name" 
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-wider outline-none focus:border-[#00BC7D] focus:ring-1 focus:ring-[#00BC7D] transition-all shadow-sm"
                  disabled={loading}
                />
              </div>

              <div className="relative group">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#00BC7D] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Branch / Field of Study" 
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
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
              {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Syncing...</> : "Finalize Protocol"}
            </Button>
            
            <p className="text-center text-[10px] uppercase font-bold text-muted-foreground pt-4">
              This data fragments into your specific branch's vector registry.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}