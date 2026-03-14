"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  StreamVideo, 
  StreamVideoClient, 
  StreamCall, 
  StreamTheme, 
  SpeakerLayout, 
  Call,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  ScreenShareButton
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { 
  Loader2, ArrowLeft, Presentation, SquareSquare, PhoneOff
} from 'lucide-react';
import { generateStreamToken, endPeerSession } from '@/app/actions/stream';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Import our separated components
import { LobbyView } from './components/LobbyView';
import { CollaborativeBoard } from './components/CollaborativeBoard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// AGGRESSIVE STREAM UI OVERRIDES (STRICTLY GREEN CYBERPUNK THEME)
// ============================================================================
const streamCustomTheme = `
  .str-video {
    /* Core variables force Stream to use our neon green natively */
    --str-video-primary-color: #00BC7D;
    --str-video-color-primary: #00BC7D;
    --str-video-surface-color: #0a0a0a;
    --str-video-background-color: #000000;
    --str-video-text-color: #ffffff;
    --str-video-border-radius-md: 1rem;
  }

  /* 1. Video Cards & Layout */
  .str-video__participant-view {
    background-color: #0a0a0a !important;
    border-radius: 1rem !important;
    overflow: hidden !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
    transition: all 0.2s ease-in-out;
  }

  /* 2. Active Speaker Glowing Ring */
  .str-video__participant-view--speaking,
  .str-video__participant-view:focus-within {
    border: 2px solid #00BC7D !important;
    box-shadow: 0 0 20px rgba(0, 188, 125, 0.4), inset 0 0 10px rgba(0, 188, 125, 0.2) !important;
  }

  /* 3. The Name Tag (Bottom Left) */
  .str-video__participant-details {
    background: rgba(0, 0, 0, 0.8) !important;
    border: 1px solid rgba(0, 188, 125, 0.3) !important;
    border-radius: 0.5rem !important;
    color: #ffffff !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    font-size: 0.7rem !important;
    padding: 0.35rem 0.6rem !important;
    backdrop-filter: blur(4px);
    margin: 0.5rem !important;
  }

  .str-video__participant-details svg {
    color: #00BC7D !important;
  }

  /* 4. Host Context Menus */
  .str-video__menu {
    background-color: #0a0a0a !important;
    border: 1px solid #00BC7D !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 188, 125, 0.1) !important;
  }
  .str-video__menu-item:hover {
    background-color: rgba(0, 188, 125, 0.15) !important;
    color: #00BC7D !important;
  }
  .str-video__menu-item--destructive:hover {
    background-color: rgba(239, 68, 68, 0.15) !important;
    color: #ef4444 !important;
  }

  /* 5. Custom Control Bar Buttons */
  .custom-stream-controls .str-video__button {
    background-color: #1a1a1a !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    transition: all 0.2s ease !important;
    border-radius: 9999px !important; 
  }
  .custom-stream-controls .str-video__button:hover {
    background-color: #2a2a2a !important;
  }
  
  /* Primary state (e.g. Screen Share Active) */
  .custom-stream-controls .str-video__button--primary,
  .custom-stream-controls .str-video__button[data-is-active="true"] {
    background-color: #00BC7D !important;
    color: #000 !important;
    border-color: #00BC7D !important;
    box-shadow: 0 0 15px rgba(0, 188, 125, 0.4) !important;
  }
  .custom-stream-controls .str-video__button--primary svg {
    fill: currentColor;
  }

  /* 6. Layout Fixes - Forces Stream to respect our flexbox boundaries */
  .str-video__speaker-layout__wrapper {
    background-color: transparent !important;
    height: 100% !important;
    width: 100% !important;
  }
  .str-video__call-controls { display: none !important; }
`;

// ============================================================================
// CALL TIMER COMPONENT
// ============================================================================
const CallTimer = () => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs tracking-widest shadow-inner">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {formatTime(elapsed)}
    </div>
  );
};

// ============================================================================
// MAIN ROOM PAGE
// ============================================================================
export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isHost, setIsHost] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false); 
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'board' | 'call'>('board');
  
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [boardWidth, setBoardWidth] = useState(65);
  const isDragging = useRef(false);
  
  // Safe desktop check to prevent hydration errors
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let _client: StreamVideoClient;
    let _call: Call;
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

    if (!apiKey) { setError("Stream API Key is missing."); return; }

    async function initStreamAndFetch() {
      try {
        const { data: dbData } = await supabase
          .from('peer_sessions')
          .select('title, description, host:users!host_id(full_name, avatar_url)')
          .ilike('meeting_link', `%${roomId}%`)
          .single();
        if (isMounted && dbData) setSessionInfo(dbData);

        const { token, user, isHost: checkIsHost } = await generateStreamToken(roomId);
        if (!isMounted) return;

        setIsHost(checkIsHost);
        _client = new StreamVideoClient({
          apiKey: apiKey as string,
          user: { id: user.id, name: user.name, image: user.image },
          token,
        });

        _call = _client.call('default', roomId);
        
        // Listen for the host ending the call
        _call.on('call.ended', () => {
          if (!checkIsHost && isMounted) {
            toast.info("The host has ended the session.");
            router.push('/dashboard/sessions');
          }
        });

        try { await _call.get(); } 
        catch (metaErr) { console.warn("Room metadata fetch failed, will create on join."); }

        if (!isMounted) { _client.disconnectUser(); return; }

        setClient(_client);
        setCall(_call);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Connection failed");
      }
    }

    initStreamAndFetch();

    return () => {
      isMounted = false;
      setTimeout(() => {
        if (_call) _call.leave().catch(console.error);
        if (_client) _client.disconnectUser().catch(console.error);
      }, 500);
    };
  }, [roomId, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setBoardWidth(newWidth);
    };
    const handleMouseUp = () => { isDragging.current = false; };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDisconnect = async () => {
    if (!call) return;
    setIsDisconnecting(true);
    try {
      if (isHost) {
        await call.endCall();
        const res = await endPeerSession(roomId);
        if (res.error) throw new Error(res.error);
        toast.success("Session officially ended");
      } else {
        await call.leave();
      }
      router.push('/dashboard/sessions');
    } catch (err) {
      console.error("Disconnect Error:", err);
      toast.error("Failed to disconnect properly.");
      setIsDisconnecting(false);
    }
  };

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black px-4">
        <div className="text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20 max-w-md w-full text-center mb-4">
          <p className="font-bold text-sm">Connection Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
        <button onClick={() => router.push('/dashboard/sessions')} className="text-xs font-black uppercase tracking-widest text-[#00BC7D] hover:underline">Return to Hubs</button>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black" id="is-room-page">
        <Loader2 className="w-12 h-12 animate-spin text-[#00BC7D] mb-4" />
        <p className="text-xs font-black uppercase tracking-widest animate-pulse text-white">Establishing Protocol...</p>
      </div>
    );
  }

  return (
    <div id="is-room-page" className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden h-[100dvh]">
      <style>{streamCustomTheme}</style>
      
      {/* Top Navbar */}
      <div className="flex-none h-16 w-full border-b border-zinc-800 bg-[#0a0a0a] flex items-center justify-between px-3 sm:px-6 z-[60] shadow-lg">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => router.push('/dashboard/sessions')} className="p-2 shrink-0 hover:bg-zinc-900 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="hidden sm:block truncate pr-2">
            <h1 className="text-sm font-black uppercase tracking-widest text-white truncate">{sessionInfo?.title || "Live Hub"}</h1>
            <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{roomId}</p>
          </div>
        </div>
        
        {hasJoinedCall && (
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button 
              onClick={() => {
                setShowCanvas(!showCanvas);
                if (!showCanvas) setMobileTab('board'); // Reset to board tab when opened
              }}
              className={`flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 shrink-0 ${
                showCanvas ? "bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 shadow-inner" : "bg-[#00BC7D] text-white border-none hover:bg-[#00BC7D]/90 shadow-[0_0_15px_rgba(0,188,125,0.4)]"
              }`}
            >
              {showCanvas ? <SquareSquare className="w-4 h-4 shrink-0" /> : <Presentation className="w-4 h-4 shrink-0" />}
              <span className="hidden sm:inline">{showCanvas ? "Close" : "Board"}</span>
            </button>
          </div>
        )}
      </div>

      <StreamVideo client={client}>
        <StreamTheme className="flex-1 w-full min-h-0 overflow-hidden bg-[#050505] flex flex-col">
          <StreamCall call={call}>
            
            {!hasJoinedCall ? (
              <LobbyView call={call} onJoin={() => setHasJoinedCall(true)} sessionInfo={sessionInfo} />
            ) : (
              <>
                {/* DYNAMIC CONTENT AREA (Takes all remaining height above controls) */}
                <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0 overflow-hidden bg-black relative">
                  
                  {/* MOBILE TABS (Only visible on mobile when Canvas is open) */}
                  {showCanvas && !isDesktop && (
                    <div className="flex-none flex bg-[#0a0a0a] p-2 gap-2 border-b border-white/5 w-full z-20">
                      <button 
                        onClick={() => setMobileTab('board')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${mobileTab === 'board' ? 'bg-[#00BC7D] text-black shadow-[0_0_15px_rgba(0,188,125,0.3)]' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                      >
                        Canvas
                      </button>
                      <button 
                        onClick={() => setMobileTab('call')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${mobileTab === 'call' ? 'bg-zinc-800 text-white border border-zinc-700 shadow-inner' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                      >
                        Video Call
                      </button>
                    </div>
                  )}

                  {/* COLLABORATIVE BOARD PANE */}
                  {showCanvas && (
                    <>
                      <div 
                        className={`relative bg-[#050505] min-h-0 z-10 w-full lg:h-full ${!isDesktop && mobileTab !== 'board' ? 'hidden' : 'flex-1 lg:flex-none'}`}
                        style={{ width: isDesktop ? `${boardWidth}%` : '100%' }}
                      >
                        <CollaborativeBoard roomId={roomId} isHost={isHost} />
                      </div>

                      {/* DRAG HANDLE (Desktop Only) */}
                      <div 
                        onMouseDown={() => { isDragging.current = true; }}
                        className="hidden lg:flex w-2 h-full bg-zinc-900 hover:bg-[#00BC7D]/50 cursor-col-resize items-center justify-center transition-colors z-20 group shrink-0 border-x border-white/5"
                      >
                        <div className="w-0.5 h-8 bg-zinc-600 group-hover:bg-white rounded-full" />
                      </div>
                    </>
                  )}

                  {/* VIDEO GRID PANE */}
                  <div 
                    className={`flex flex-col bg-[#050505] relative min-h-0 w-full lg:h-full ${!isDesktop && showCanvas && mobileTab !== 'call' ? 'hidden' : 'flex-1 lg:flex-none'}`}
                    style={{ width: isDesktop && showCanvas ? `${100 - boardWidth}%` : '100%' }}
                  >
                    <div className="flex-1 w-full overflow-hidden relative min-h-0 p-2 sm:p-4">
                      <SpeakerLayout participantsBarPosition="bottom" />
                    </div>
                  </div>

                </div>

                {/* STRICT GLOBAL BOTTOM CONTROL BAR (Never overlaps) */}
                <div className="flex-none h-[72px] sm:h-20 bg-[#0a0a0a] border-t border-zinc-800 flex items-center justify-center sm:justify-between px-2 sm:px-6 w-full z-30 shrink-0">
                  
                  {/* Left: Timer */}
                  <div className="hidden sm:flex w-1/4 justify-start">
                    <CallTimer />
                  </div>

                  {/* Center: Stream's Native Icons */}
                  <div className="flex items-center justify-center gap-2 sm:gap-4 custom-stream-controls">
                    <ToggleAudioPublishingButton />
                    <ToggleVideoPublishingButton />
                    {isHost && <ScreenShareButton />}
                    
                    {/* Custom End Session Button */}
                    <button
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 ml-1 sm:ml-2"
                      title={isHost ? "End Session for Everyone" : "Leave Session"}
                    >
                      {isDisconnecting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>

                  {/* Right: Spacer for centering */}
                  <div className="hidden sm:block w-1/4"></div>
                </div>

              </>
            )}

          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    </div>
  );
}