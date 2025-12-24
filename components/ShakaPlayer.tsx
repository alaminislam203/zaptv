'use client';
import React, { useEffect, useRef } from 'react';
import 'shaka-player/dist/controls.css';

// শুধুমাত্র টাইপ ইম্পোর্ট করা হচ্ছে
import type { Player, ui } from 'shaka-player';

interface DrmConfig {
  type?: 'clearkey' | 'widevine';
  keyId?: string;
  key?: string;
  licenseUrl?: string;
}

interface ShakaPlayerProps {
  src: string;
  drm?: DrmConfig;
}

const ShakaPlayer = ({ src, drm }: ShakaPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  //インスタンスを保存するためのRef
  const playerRef = useRef<Player | null>(null);
  const uiRef = useRef<ui.Overlay | null>(null);

  useEffect(() => {
    const initPlayer = async () => {
      if (!videoRef.current || !containerRef.current) return;

      const shaka = await import('shaka-player/dist/shaka-player.ui.js');
      shaka.polyfill.installAll();

      if (shaka.Player.isBrowserSupported()) {
        const player = new shaka.Player(videoRef.current);
        playerRef.current = player;

        const ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
        uiRef.current = ui;
        
        if (drm) {
          const drmConfig: any = {};
          if (drm.type === 'clearkey' && drm.keyId && drm.key) {
            drmConfig.clearKeys = { [drm.keyId]: drm.key };
          }
          if (drm.type === 'widevine' && drm.licenseUrl) {
            drmConfig.servers = { 'com.widevine.alpha': drm.licenseUrl };
          }
          player.configure({ drm: drmConfig });
        }

        try {
          await player.load(src);
        } catch (error) {
          console.error('Error loading video', error);
        }
      }
    };

    initPlayer();

    return () => {
      uiRef.current?.destroy();
      playerRef.current?.destroy();
    };
  }, [src, drm]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        poster=""
        autoPlay
        playsInline
        style={{ objectFit: 'contain' }}
      ></video>
    </div>
  );
};

export default ShakaPlayer;
