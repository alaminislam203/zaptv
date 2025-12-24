"use client";
import React, { useRef, useEffect } from "react";
// CSS অবশ্যই ইমপোর্ট করতে হবে
import "shaka-player/dist/controls.css"; 

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
  const uiContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null); // প্লেয়ার ইন্সট্যান্স রাখার জন্য

  useEffect(() => {
    let player: any;
    let ui: any;

    const initPlayer = async () => {
      // Dynamic Import (যাতে সার্ভারে লোড না হয় এবং document error না দেয়)
      const shaka = (await import("shaka-player/dist/shaka-player.ui")).default;

      if (!shaka.Player.isBrowserSupported()) {
        console.error("Browser not supported!");
        return;
      }

      const video = videoRef.current;
      const uiContainer = uiContainerRef.current;

      if (video && uiContainer) {
        player = new shaka.Player(video);
        playerRef.current = player;

        // Error Listener (ভিডিও কেন চলছে না তা দেখার জন্য)
        player.addEventListener("error", (event: any) => {
          console.error("Shaka Player Error Code:", event.detail.code, "Details:", event.detail);
        });

        // UI সেটআপ
        ui = new shaka.ui.Overlay(player, uiContainer, video);
        ui.configure({
          'controlPanelElements': [
             'play_pause', 'time_and_duration', 'spacer', 
             'mute', 'volume', 'fullscreen', 'overflow_menu'
          ]
        });

        // DRM কনফিগারেশন
        const playerConfig: any = {
           streaming: {
              bufferingGoal: 60, // বাফারিং কমানোর চেষ্টা
              rebufferingGoal: 2,
           }
        };

        if (drm) {
          if (drm.type === "clearkey" && drm.keyId && drm.key) {
            playerConfig.drm = {
              clearKeys: {
                [drm.keyId]: drm.key,
              },
            };
          } else if (drm.type === "widevine" && drm.licenseUrl) {
            playerConfig.drm = {
              servers: {
                "com.widevine.alpha": drm.licenseUrl,
              },
            };
          }
        }

        player.configure(playerConfig);

        try {
          await player.load(src);
          console.log("Video loaded successfully!");
        } catch (e: any) {
          console.error("Error loading video:", e);
        }
      }
    };

    initPlayer();

    // ক্লিনআপ
    return () => {
      if (ui) ui.destroy();
      if (player) player.destroy();
    };
  }, [src, drm]);

  return (
    <div 
      ref={uiContainerRef} 
      className="w-full h-full relative bg-black overflow-hidden shadow-lg rounded-lg"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster="https://via.placeholder.com/640x360/000000/FFFFFF/?text=Loading+Stream" 
        autoPlay
        playsInline
      />
    </div>
  );
};

export default ShakaPlayer;
