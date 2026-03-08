"use client";

import { useEffect, useState } from 'react';
import { Call, VideoPreview, useCallStateHooks, DeviceSettings } from '@stream-io/video-react-sdk';
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, Crown, User } from 'lucide-react';
import { toast } from 'sonner';

interface LobbyViewProps {
  call: Call;
  onJoin: () => void;
  sessionInfo: any;
}

export const LobbyView = ({ call, onJoin, sessionInfo }: LobbyViewProps) => {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { camera, isEnabled: isCamOn } = useCameraState();
  const { microphone, isEnabled: isMicOn } = useMicrophoneState();
  
  const [isJoining, setIsJoining] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Initialize AV Devices safely
  useEffect(() => {
    let mounted = true;
    
    const initializeDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionError("Your browser doesn't support video/audio");
          setIsInitialized(true);
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some(d => d.kind === 'audioinput');
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        
        if (!hasAudio && !hasVideo) {
          setPermissionError("No camera or microphone detected");
        }

        if (camera && typeof camera.disable === 'function') await camera.disable();
        if (microphone && typeof microphone.disable === 'function') await microphone.disable();
        
        if (mounted) setIsInitialized(true);
      } catch (err) {
        console.warn("Device initialization failed:", err);
        setPermissionError("Could not access camera/microphone");
        if (mounted) setIsInitialized(true); 
      }
    };

    const timer = setTimeout(initializeDevices, 100);
    return () => { mounted = false; clearTimeout(timer); };
  }, [camera, microphone]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      // FIX: Removed the buggy 'members' array. 
      // Stream automatically registers the current user based on the Token!
      await call.join({ create: true });
      onJoin(); 
    } catch (e: any) {
      console.error("Join error:", e);
      toast.error(e.message || "Failed to connect to the active hub.");
      setIsJoining(false);
    }
  };

  // Fallback Host Info (from Stream if DB fetch is slow/fails)
  const streamHost = call.state.createdBy;
  const displayAvatar = sessionInfo?.host?.avatar_url || streamHost?.image;
  const displayName = sessionInfo?.host?.full_name || streamHost?.name || "Anonymous Peer";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-black overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        
        {/* Left: Video Preview & AV Controls */}
        <div className="space-y-4">
          <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-zinc-900 border-4 border-zinc-800 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] relative">
            {isInitialized && !permissionError ? (
              <VideoPreview key="video-preview" autoplay={false} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {permissionError ? (
                  <>
                    <VideoOff className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-xs text-red-500 font-medium text-center px-4">{permissionError}</p>
                  </>
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-[#00BC7D]" />
                )}
              </div>
            )}
            
            {/* Overlay AV Controls */}
            {isInitialized && !permissionError && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <button onClick={() => camera?.toggle()} className={`p-3 rounded-full transition-all ${isCamOn ? 'bg-[#00BC7D] text-white shadow-[0_0_15px_rgba(0,188,125,0.4)]' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                  {isCamOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <button onClick={() => microphone?.toggle()} className={`p-3 rounded-full transition-all ${isMicOn ? 'bg-[#00BC7D] text-white shadow-[0_0_15px_rgba(0,188,125,0.4)]' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <div className="text-white hover:text-[#00BC7D] transition-colors"><DeviceSettings /></div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Session Info & Join Form */}
        <div className="space-y-8 text-center lg:text-left">
          
          {/* Database Header Info */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00BC7D]/10 border border-[#00BC7D]/20 text-[#00BC7D] text-[10px] font-black uppercase tracking-widest mb-4">
              Session Gateway
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-3 leading-tight line-clamp-2">
              {sessionInfo?.title || "Live Peer Session"}
            </h1>
            <p className="text-sm text-zinc-400 font-medium leading-relaxed line-clamp-3">
              {sessionInfo?.description || "Configure your AV nodes and check your surroundings before entering the live peer environment."}
            </p>
          </div>

          {/* Dynamic Host Identity Card */}
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center gap-4 text-left relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-[#00BC7D]/5 group-hover:text-[#00BC7D]/10 transition-colors">
              <Crown className="w-24 h-24 rotate-12" />
            </div>

            <div className="w-14 h-14 rounded-full bg-black border-2 border-[#00BC7D]/50 flex items-center justify-center overflow-hidden shrink-0 z-10 shadow-[0_0_15px_rgba(0,188,125,0.2)]">
              {displayAvatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={displayAvatar} alt="Host Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-zinc-500" />
              )}
            </div>
            
            <div className="z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00BC7D] bg-[#00BC7D]/10 px-2 py-0.5 rounded-full">
                  Host
                </span>
              </div>
              <p className="text-base font-bold text-white tracking-tight">
                {displayName}
              </p>
            </div>
          </div>

          {/* Join Button */}
          <button 
            onClick={handleJoin} 
            disabled={isJoining || !isInitialized} 
            className="w-full h-14 sm:h-16 flex items-center justify-center gap-3 rounded-2xl sm:rounded-[1.5rem] bg-[#00BC7D] text-white font-black uppercase tracking-widest text-xs hover:bg-[#00BC7D]/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,188,125,0.2)] active:scale-[0.98]"
          >
            {isJoining ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</> : "Enter Hub"}
          </button>
          
        </div>
      </div>
    </div>
  );
};