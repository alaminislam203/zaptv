'use client';
import React, { useEffect, useRef, useState } from 'react';
import 'shaka-player/dist/controls.css'; // সমাধান ৩: UI কন্ট্রোলের জন্য CSS ইমপোর্ট
import shaka from 'shaka-player/dist/shaka-player.ui';

// --- ইন্টারফেস সংজ্ঞা ---
interface DrmConfig {
  type: "clearkey" | "widevine";
  keyId?: string;
  key?: string;
  licenseUrl?: string;
  // [key: string]: string; // পুরনো DRM অবজেক্ট সাপোর্টের জন্য
}

interface ShakaPlayerProps {
  src: string;
  drm?: DrmConfig;
}

const ShakaPlayer: React.FC<ShakaPlayerProps> = ({ src, drm }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // সমাধান ১: লোডিং এবং এরর স্টেট যুক্ত করা
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;

    if (!video || !container) return;

    // প্লেয়ার শুরু করার আগে স্টেট রিসেট
    setIsLoading(true);
    setError(null);

    const player = new shaka.Player(video);
    const ui = new shaka.ui.Overlay(player, container, video);

    ui.configure({
      'controlPanelElements': ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'fullscreen', 'overflow_menu']
    });

    // সমাধান ২: ব্যবহারকারী-বান্ধব এরর দেখানোর জন্য ইভেন্ট লিসেনার
    player.addEventListener('error', (event: any) => {
      const shakaError = event.detail;
      console.error('Shaka Player Error:', shakaError);
      setError(`Error ${shakaError.code}: Could not load the protected content.`);
      setIsLoading(false);
    });
    player.addEventListener('loading', () => setIsLoading(true));
    player.addEventListener('loaded', () => setIsLoading(false));
    player.addEventListener('buffering', (e: any) => setIsLoading(e.buffering));

    // সমাধান ৪: শক্তিশালী এবং পরিষ্কার DRM কনফিগারেশন
    const playerConfig: shaka.extern.PlayerConfiguration = {
        streaming: { bufferingGoal: 30, bufferBehind: 45 },
        abr: { enabled: true },
    };

    if (drm) {
        playerConfig.drm = {};
        if (drm.type === "widevine" && drm.licenseUrl) {
            playerConfig.drm.servers = { "com.widevine.alpha": drm.licenseUrl };
        } else if (drm.type === "clearkey" && drm.keyId && drm.key) {
            playerConfig.drm.clearKeys = { [drm.keyId]: drm.key };
        } 
        // পুরনো ফরম্যাট (সরাসরি key:value) হ্যান্ডেল করার জন্য
        else if (!drm.type && Object.keys(drm).length > 0) {
            playerConfig.drm.clearKeys = drm as { [key: string]: string };
        }
    }
    
    player.configure(playerConfig);

    // সোর্স লোড করা
    player.load(src).catch((e: any) => {
        console.error("Player load error:", e);
        setError(`Error ${e.code}: Failed to load the video source.`);
    });

    // কম্পোনেন্ট আনমাউন্ট হলে প্লেয়ার ধ্বংস করা
    return () => {
      ui.destroy();
      player.destroy();
    };

  }, [src, drm]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black overflow-hidden shadow-lg rounded-lg">
      
      {/* লোডিং ওভারলে */}
      {(isLoading && !error) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 pointer-events-none">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm mt-2">Loading Protected Stream...</p>
        </div>
      )}

      {/* এরর ওভারলে */}
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
        style={{ visibility: error ? 'hidden' : 'visible' }} // এরর থাকলে ভিডিও ট্যাগ হাইড করা
      />
    </div>
  );
};

export default ShakaPlayer;
