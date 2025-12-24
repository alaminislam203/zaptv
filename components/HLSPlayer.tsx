"use client";
import React, { useEffect, useRef } from "react";
import Hls from "hls.js"; // HLS.js ইঞ্জিন
import Plyr from "plyr";  // Plyr প্লেয়ার (সুন্দর UI)
import "plyr/dist/plyr.css"; // Plyr CSS

interface HLSPlayerProps {
  src: string;
}

const HLSPlayer = ({ src }: HLSPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let player: Plyr | null = null;

    const initPlayer = () => {
      // ১. যদি ব্রাউজার Hls.js সাপোর্ট করে (Chrome, Firefox, Edge, Android)
      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30, // বাফারিং অপটিমাইজেশন
          startLevel: -1,      // অটো কোয়ালিটি
        });
        
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // HLS রেডি হলে Plyr লোড হবে
          player = new Plyr(video, {
            controls: [
              'play-large', 'play', 'progress', 'current-time', 
              'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['quality', 'speed']
          });
        });

        // এরর হ্যান্ডলিং (খুবই জরুরি)
        hls.on(Hls.Events.ERROR, function (event, data) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error, trying to recover...");
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error, trying to recover...");
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                break;
            }
          }
        });
      } 
      // ২. যদি নেটিভ HLS সাপোর্ট থাকে (Safari, iOS, Mac)
      else if (video.canPlayType("application/x-mpegURL")) {
        video.src = src;
        // নেটিভ সাপোর্টেও Plyr লোড করা হচ্ছে সুন্দর UI এর জন্য
        player = new Plyr(video, {
            controls: [
              'play-large', 'play', 'progress', 'current-time', 
              'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'
            ]
        });
      }
    };

    initPlayer();

    // ক্লিনআপ ফাংশন (মেমোরি লিক বন্ধ করতে)
    return () => {
      if (hls) {
        hls.destroy();
      }
      if (player) {
        player.destroy();
      }
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