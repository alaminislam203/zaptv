'use client';
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// থিম ইন্সটল করা থাকলে আন-কমেন্ট করুন
// import '@videojs/themes/dist/fantasy/index.css';

interface VideoJSPlayerProps {
  src: string;
}

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ১. প্লেয়ার আপডেট লজিক
    if (playerRef.current) {
      const player = playerRef.current;
      setIsLoading(true);
      setError(null);
      player.src({ src, type: 'application/x-mpegURL' });
      player.load();
      return;
    }

    // ২. নতুন প্লেয়ার তৈরি লজিক
    if (!videoRef.current) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fluid'); 
    videoRef.current.appendChild(videoElement);

    const options = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      liveui: true, // লাইভ ব্যাজ দেখানোর জন্য
      sources: [{ src, type: 'application/x-mpegURL' }],
      html5: {
        vhs: {
          overrideNative: true,
          enableLowLatency: true,
        },
      },
    };

    const player = (playerRef.current = videojs(videoElement, options, () => {
      // Player Ready
      setIsLoading(false);
    }));

    // ৩. ইভেন্ট হ্যান্ডলিং
    player.on('waiting', () => {
       if (!player.paused()) setIsLoading(true);
    });

    player.on('playing', () => setIsLoading(false));
    player.on('canplay', () => setIsLoading(false));
    
    player.on('error', () => {
      const err = player.error();
      console.error('VideoJS Error:', err);
      setError(`Stream Unavailable (Error ${err?.code || 'Unknown'})`);
      setIsLoading(false);
    });

  }, [src]);

  // ৪. ক্লিনআপ
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative bg-black rounded-xl overflow-hidden group">
      
      {/* VideoJS Mount Point */}
      <div ref={videoRef} className="w-full h-full" />

      {/* কাস্টম স্টাইল ওভাররাইড (কালার থিম মিলানোর জন্য) */}
      <style jsx global>{`
        .video-js .vjs-control-bar { background: rgba(0, 0, 0, 0.7); }
        .video-js .vjs-big-play-button { 
            background-color: rgba(6, 182, 212, 0.7); /* Cyan-500 */
            border-color: #fff;
            border-radius: 50%;
            width: 2em;
            height: 2em;
            line-height: 2em;
            margin-left: -1em;
            top: 50%;
            left: 50%;
            transform: translateY(-50%);
        }
        .video-js .vjs-play-progress { background-color: #06b6d4; } /* Cyan Progress */
        .video-js .vjs-load-progress div { background-color: rgba(255, 255, 255, 0.3); }
      `}</style>

      {/* --- লোডিং স্ক্রিন (NativePlayer এর সাথে মিল রেখে) --- */}
      {(isLoading && !error) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-cyan-400 text-xs font-mono animate-pulse mt-3">BUFFERING...</p>
        </div>
      )}

      {/* --- এরর স্ক্রিন --- */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 text-center p-4">
            <div className="text-red-500 text-5xl mb-2">⚠️</div>
            <h3 className="font-bold text-red-400 text-lg">Stream Error</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600 hover:text-white transition"
            >
                Reload Player
            </button>
        </div>
      )}
    </div>
  );
};

export default VideoJSPlayer;
