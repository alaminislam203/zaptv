"use client";
import React, { useEffect, useRef, useState } from "react";
import "shaka-player/dist/controls.css";

interface ShakaPlayerProps {
  src: string;
  drm?: any; // যেকোনো ফরম্যাটের DRM অবজেক্ট রিসিভ করবে
}

const ShakaPlayer: React.FC<ShakaPlayerProps> = ({ src, drm }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let player: any;
    let ui: any;

    const initPlayer = async () => {
      try {
        // ১. ডাইনামিক ইমপোর্ট (SSR ক্র্যাশ ফিক্স)
        const shakaModule = await import("shaka-player/dist/shaka-player.ui");
        const shaka = shakaModule.default;

        // ব্রাউজার সাপোর্ট চেক
        if (!shaka.Player.isBrowserSupported()) {
          setErrorMessage("Browser not supported for Shaka Player");
          return;
        }

        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        // ২. প্লেয়ার তৈরি
        player = new shaka.Player(video);

        // ৩. UI ওভারলে তৈরি
        ui = new shaka.ui.Overlay(player, container, video);
        ui.configure({
          'controlPanelElements': [
             'play_pause', 'time_and_duration', 'spacer', 
             'mute', 'volume', 'fullscreen', 'overflow_menu'
          ],
          'seekBarColors': {
             base: 'rgba(255, 255, 255, 0.3)',
             buffered: 'rgba(255, 255, 255, 0.54)',
             played: 'rgb(6, 182, 212)',
          }
        });

        // ৪. এরর হ্যান্ডলিং (খুবই গুরুত্বপূর্ণ)
        player.addEventListener("error", (event: any) => {
          const { code, category, data } = event.detail;
          console.error("Shaka Error Code:", code, "Details:", event.detail);
          
          if (code === 1001) {
            setErrorMessage("Network Error: Link broken or CORS issue.");
          } else if (code === 6007 || code === 6008) {
             setErrorMessage("DRM Error: Invalid Key or License.");
          } else {
             setErrorMessage(`Error ${code}: Stream failed to load.`);
          }
        });

        // ৫. কনফিগারেশন এবং DRM সেটআপ
        const config: any = {
          streaming: {
            bufferingGoal: 30,
            rebufferingGoal: 5,
            retryParameters: { maxAttempts: 2 } // অটো রিট্রাই করবে
          }
        };

        if (drm) {
          console.log("Applying DRM Config:", drm);
          
          // ক) যদি ClearKey হয় (type উল্লেখ করা আছে)
          if (drm.type === "clearkey" && drm.keyId && drm.key) {
             config.drm = {
               clearKeys: { [drm.keyId.trim()]: drm.key.trim() }
             };
          }
          // খ) যদি Widevine হয়
          else if (drm.type === "widevine" && drm.licenseUrl) {
             config.drm = {
               servers: { "com.widevine.alpha": drm.licenseUrl.trim() }
             };
          }
          // গ) যদি সরাসরি অবজেক্ট হয় (Type নেই, কিন্তু Key আছে) - ফায়ারবেস ডাইরেক্ট ফরম্যাট
          else if (!drm.type && Object.keys(drm).length > 0) {
             // ধরে নিচ্ছি এটি সরাসরি ClearKeys অবজেক্ট
             config.drm = { clearKeys: drm };
          }
        }

        player.configure(config);

        // ৬. লোড করা
        await player.load(src);
        console.log("Stream Loaded Successfully:", src);

      } catch (e: any) {
        console.error("Player Init Error:", e);
        setErrorMessage("Failed to initialize player.");
      }
    };

    initPlayer();

    return () => {
      if (ui) ui.destroy();
      if (player) player.destroy();
    };
  }, [src, drm]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black rounded-lg overflow-hidden shadow-lg shaka-video-container">
      {errorMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-center p-4">
          <div>
             <div className="text-red-500 text-3xl mb-2">⚠</div>
             <p className="text-white text-sm font-bold">{errorMessage}</p>
             <p className="text-gray-400 text-xs mt-2">Check console (F12) for details.</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full shaka-video"
        autoPlay
        playsInline
        poster=""
      />
    </div>
  );
};

export default ShakaPlayer;