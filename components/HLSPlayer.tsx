"use client";
import React, { useEffect, useRef } from "react";
import Hls from "hls.js";
import "plyr/dist/plyr.css"; // CSS ইমপোর্ট ঠিক থাকবে

interface HLSPlayerProps {
  src: string;
}

const HLSPlayer = ({ src }: HLSPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let player: any = null; // Type 'any' দেওয়া হলো যাতে এরর না দেয়

    const initPlayer = () => {
      // ফিক্স: Plyr এখানে require করা হচ্ছে যাতে Type Error না আসে
      const Plyr = require("plyr");

      // ১. যদি ব্রাউজার Hls.js সাপোর্ট করে
      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          startLevel: -1,
        });
        
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          player = new Plyr(video, {
            controls: [
              'play-large', 'play', 'progress', 'current-time', 
              'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['quality', 'speed']
          });
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                break;
            }
          }
        });
      } 
      // ২. নেটিভ HLS (Safari/iOS)
      else if (video.canPlayType("application/x-mpegURL")) {
        video.src = src;
        player = new Plyr(video, {
            controls: [
              'play-large', 'play', 'progress', 'current-time', 
              'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'
            ]
        });
      }
    };

    initPlayer();

    return () => {
      if (hls) hls.destroy();
      if (player) player.destroy();
    };
  }, [src]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        className="plyr-react plyr"
        controls
        playsInline
        crossOrigin="anonymous"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default HLSPlayer;