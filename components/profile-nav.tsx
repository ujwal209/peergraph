"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { CldUploadWidget } from "next-cloudinary";
import { updateAvatarAction } from "@/app/profile/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProfileNavProps {
  user: any;
}

export function ProfileNav({ user }: ProfileNavProps) {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUploadSuccess = async (result: any) => {
    setIsUploading(true);
    try {
      const url = result.info.secure_url;
      const res = await updateAvatarAction(url);
      
      if (res.error) {
         toast.error(res.error);
      } else {
         toast.success("Identity Visual Updated.");
         setAvatarUrl(url);
         router.refresh();
      }
    } catch (error) {
      toast.error("Failed to sync identity visual");
    } finally {
      setIsUploading(false);
    }
  };

  const navLinks = [
    { name: "Identity Node", href: "/profile", icon: User },
    // Add more profile settings here if needed
  ];

  return (
    <div className="w-full md:w-64 flex-shrink-0 space-y-6">
      {/* Profile Card */}
      <div className="bg-background border border-border rounded-[2rem] p-6 text-center shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BC7D] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative w-24 h-24 mx-auto mb-4 group/avatar rounded-full overflow-hidden border-2 border-border hover:border-[#00BC7D] transition-colors">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-muted-foreground">
               <User className="w-8 h-8" />
            </div>
          )}
          
          <CldUploadWidget 
            uploadPreset="peergraph_uploads" 
            onSuccess={handleUploadSuccess}
            options={{ maxFiles: 1, multiple: false }}
          >
            {({ open }) => (
              <button 
                onClick={(e) => { e.preventDefault(); open(); }}
                disabled={isUploading}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity backdrop-blur-sm cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-5 h-5 mb-1 text-[#00BC7D]" />
                <span className="text-[10px] font-black uppercase tracking-widest">{isUploading ? "Syncing..." : "Update"}</span>
              </button>
            )}
          </CldUploadWidget>
        </div>

        <h3 className="font-black text-lg truncate px-2">{user?.user_metadata?.full_name || "Unknown Identity"}</h3>
        <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mb-1">{user?.user_metadata?.university || "No Institution"}</p>
        <p className="text-[10px] text-[#00BC7D] font-bold uppercase tracking-widest">{user?.user_metadata?.major || "No Major"}</p>
      </div>

      {/* Navigation */}
      <div className="bg-background border border-border rounded-[2rem] p-4 shadow-sm">
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold tracking-widest uppercase transition-all ${
                  isActive 
                    ? "bg-[#00BC7D]/10 text-[#00BC7D]" 
                    : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#00BC7D]" : ""}`} />
                {link.name}
              </Link>
            )
          })}
          
           <div className="pt-2 mt-2 border-t border-border">
             <form action={signOut}>
                <Button variant="ghost" type="submit" className="w-full justify-start gap-3 h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold tracking-widest uppercase text-sm">
                   <LogOut className="w-4 h-4" />
                   Sever Connection
                </Button>
             </form>
           </div>
        </nav>
      </div>
    </div>
  );
}
