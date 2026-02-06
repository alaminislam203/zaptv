"use client";
import React, { useEffect, useRef, useState } from "react";
import "shaka-player/dist/controls.css"; // স্টাইল ইমপোর্ট জরুরি

interface ShakaPlayerProps {
  src: string;
  drm?: any;
}

const ShakaPlayer: React.FC<ShakaPlayerProps> = ({ src, drm }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let player: any;
    let ui: any;

    const initPlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // ১. ডাইনামিক ইমপোর্ট (SSR ফিক্স)
        const shakaModule = await import("shaka-player/dist/shaka-player.ui");
        const shaka = shakaModule.default;

        if (!shaka.Player.isBrowserSupported()) {
          setError("Browser not supported.");
          setIsLoading(false);
          return;
        }

        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        // ২. প্লেয়ার ইনিশিয়ালইজেশন
        player = new shaka.Player(video);
        
        // ৩. UI ওভারলে এবং কনফিগারেশন (Cyan Theme)
        ui = new shaka.ui.Overlay(player, container, video);
        ui.configure({
          'controlPanelElements': [
             'play_pause', 'time_and_duration', 'spacer', 
             'mute', 'volume', 'quality', 'fullscreen', 'overflow_menu'
          ],
          'seekBarColors': {
             base: 'rgba(255, 255, 255, 0.2)',
             buffered: 'rgba(255, 255, 255, 0.4)',
             played: 'rgb(6, 182, 212)', // Cyan-500
             adBreaks: 'rgb(255, 204, 0)',
          },
          'volumeBarColors': {
             base: 'rgba(255, 255, 255, 0.2)',
             level: 'rgb(6, 182, 212)',
          }
        });

        // ৪. এরর লিসেনার
        player.addEventListener("error", (event: any) => {
          const { code } = event.detail;
          console.error("Shaka Error:", code);
          if (code === 1001) setError("Network Error: Stream unavailable.");
          else if (code >= 6000 && code <= 6999) setError("DRM Error: License check failed.");
          else setError(`Playback Error (${code})`);
          setIsLoading(false);
        });

        // বাফারিং হ্যান্ডলিং
        player.addEventListener("buffering", (event: any) => {
            setIsLoading(event.buffering);
        });

        // ৫. DRM কনফিগারেশন
        const config: any = {
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 5,
            retryParameters: { maxAttempts: 2 }
          }
        };

        if (drm) {
          if (drm.type === "clearkey" && drm.keyId && drm.key) {
             config.drm = { clearKeys: { [drm.keyId]: drm.key } };
          } 
          else if (drm.type === "widevine" && drm.licenseUrl) {
             config.drm = { servers: { "com.widevine.alpha": drm.licenseUrl } };
          }
          // Legacy format support
          else if (!drm.type && Object.keys(drm).length > 0) {
             config.drm = { clearKeys: drm };
          }
        }

        player.configure(config);

        // ৬. ভিডিও লোড করা
        await player.load(src);
        setIsLoading(false);

      } catch (e: any) {
        console.error("Init Error:", e);
        setError("Failed to load player.");
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (ui) ui.destroy();
      if (player) player.destroy();
    };
  }, [src, drm]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black rounded-xl overflow-hidden group shadow-2xl shaka-custom-theme">
      
      {/* CSS Override for Custom Theme */}
      <style jsx global>{`
        /* Cyan Accent Color Override */
        .shaka-overflow-menu-button { color: white; }
        .shaka-settings-menu { 
            background-color: rgba(24, 24, 27, 0.95) !important; /* Zinc-900 */
            border: 1px solid rgba(63, 63, 70, 0.5); 
            border-radius: 8px;
        }
        .shaka-settings-menu button { 
            color: #e4e4e7 !important; 
            font-size: 12px;
        }
        .shaka-settings-menu button:hover { 
            background-color: rgba(6, 182, 212, 0.2) !important; 
            color: #22d3ee !important; /* Cyan-400 */
        }
        .shaka-video-container .material-icons-round { color: white; }
        .shaka-spinner-svg { display: none !important; } /* Hide Default Spinner */
      `}</style>

      {/* --- Custom Loading Screen --- */}
      {(isLoading && !error) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-cyan-400 text-xs font-mono animate-pulse mt-3">BUFFERING...</p>
        </div>
      )}

      {/* --- Error Screen --- */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 text-center p-4">
            <div className="text-red-500 text-5xl mb-2">⚠️</div>
            <h3 className="font-bold text-red-400 text-lg">Playback Error</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600 hover:text-white transition">Retry</button>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster=""
        autoPlay
        playsInline
      />
    </div>
  );
};

export default ShakaPlayer;
