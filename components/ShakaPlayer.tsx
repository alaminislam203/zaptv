'use client';
import React, { useEffect, useRef, useState } from 'react';
import 'shaka-player/dist/controls.css'; 
import shaka from 'shaka-player/dist/shaka-player.ui';

// --- ইন্টারফেস সংজ্ঞা ---
interface DrmConfig {
  type: "clearkey" | "widevine";
  keyId?: string;
  key?: string;
  licenseUrl?: string;
}

interface ShakaPlayerProps {
  src: string;
  drm?: DrmConfig;
}

const ShakaPlayer: React.FC<ShakaPlayerProps> = ({ src, drm }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;

    if (!video || !container) return;

    setIsLoading(true);
    setError(null);

    const player = new shaka.Player(video);
    const ui = new shaka.ui.Overlay(player, container, video);

    ui.configure({
      'controlPanelElements': ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'fullscreen', 'overflow_menu']
    });

    player.addEventListener('error', (event: any) => {
      const shakaError = event.detail;
      console.error('Shaka Player Error:', shakaError);
      setError(`Error ${shakaError.code}: Could not load the protected content.`);
      setIsLoading(false);
    });
    player.addEventListener('loading', () => setIsLoading(true));
    player.addEventListener('loaded', () => setIsLoading(false));
    player.addEventListener('buffering', (e: any) => setIsLoading(e.buffering));

    // সমাধান: কঠোর টাইপটি তুলে দেওয়া হয়েছে
    const playerConfig: any = {
        streaming: { bufferingGoal: 30, bufferBehind: 45 },
        abr: { enabled: true },
        drm: { servers: {}, clearKeys: {} } // DRM অবজেক্ট আগে থেকেই তৈরি করা
    };

    if (drm) {
        if (drm.type === "widevine" && drm.licenseUrl) {
            playerConfig.drm.servers = { "com.widevine.alpha": drm.licenseUrl };
        } else if (drm.type === "clearkey" && drm.keyId && drm.key) {
            playerConfig.drm.clearKeys = { [drm.keyId]: drm.key };
        } 
    }
    
    player.configure(playerConfig);

    player.load(src).catch((e: any) => {
        console.error("Player load error:", e);
        setError(`Error ${e.code}: Failed to load the video source.`);
    });

    return () => {
      ui.destroy();
      player.destroy();
    };

  }, [src, drm]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black overflow-hidden shadow-lg rounded-lg">
      
      {(isLoading && !error) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 pointer-events-none">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm mt-2">Loading Protected Stream...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 pointer-events-none text-center p-4">
            <div className="text-red-500 text-4xl mb-3">⚠</div>
            <h3 className="font-bold text-red-400 text-lg">Playback Error</h3>
            <p className="text-sm text-gray-300 max-w-sm">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        autoPlay
        playsInline
        style={{ visibility: error ? 'hidden' : 'visible' }}
      />
    </div>
  );
};

export default ShakaPlayer;
