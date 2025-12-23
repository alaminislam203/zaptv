"use client";
import React, { useEffect, useRef } from "react";
import shaka from "shaka-player/dist/shaka-player.ui";
import "shaka-player/dist/controls.css";


// DRM এর জন্য টাইপ ডিফাইন করা হলো
interface DrmConfig {
  type?: "clearkey" | "widevine";
  keyId?: string;
  key?: string;
  licenseUrl?: string;
}

interface ShakaPlayerProps {
  src: string;
  drm?: DrmConfig; // DRM অপশনাল
}

const ShakaPlayer = ({ src, drm }: ShakaPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let player: any;
    let ui: any;

    const initPlayer = async () => {
      shaka.polyfill.installAll();

      if (shaka.Player.isBrowserSupported() && videoRef.current && containerRef.current) {
        player = new shaka.Player(videoRef.current);
        ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);

        // --- DRM কনফিগারেশন শুরু ---
        if (drm) {
          const drmConfig: any = {};

          // ১. যদি ClearKey হয় (Key ID + Key)
          if (drm.type === "clearkey" && drm.keyId && drm.key) {
            drmConfig.clearKeys = {
              [drm.keyId]: drm.key,
            };
          }

          // ২. যদি Widevine License URL হয়
          if (drm.type === "widevine" && drm.licenseUrl) {
            drmConfig.servers = {
              "com.widevine.alpha": drm.licenseUrl,
            };
          }

          // প্লেয়ারে কনফিগারেশন সেট করা
          player.configure({ drm: drmConfig });
        }
        // --- DRM কনফিগারেশন শেষ ---

        try {
          await player.load(src);
          console.log("Video loaded successfully!");
        } catch (error) {
          console.error("Error loading video", error);
        }
      }
    };

    initPlayer();

    return () => {
      if (player) player.destroy();
      if (ui) ui.destroy();
    };
  }, [src, drm]); // drm চেঞ্জ হলেও আপডেট হবে

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        poster=""
        controls={false}
        autoPlay={true}
      ></video>
    </div>
  );
};

export default ShakaPlayer;
