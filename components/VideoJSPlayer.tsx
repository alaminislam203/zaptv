'use client';
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

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
      liveui: true,
      sources: [{ src, type: 'application/x-mpegURL' }],
      html5: {
        vhs: {
          overrideNative: true,
          enableLowLatency: true,
        },
      },
    };

    const player = (playerRef.current = videojs(videoElement, options, () => {
      setIsLoading(false);
    }));

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
      
      <div ref={videoRef} className="w-full h-full" />

      <style jsx global>{`
        .video-js .vjs-control-bar { background: rgba(2, 6, 23, 0.8); backdrop-filter: blur(10px); }
        .video-js .vjs-big-play-button { 
            background-color: rgba(16, 185, 129, 0.7); /* Emerald-500 */
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
        .video-js .vjs-play-progress { background-color: #10b981; } /* Emerald Progress */
        .video-js .vjs-load-progress div { background-color: rgba(255, 255, 255, 0.2); }
      `}</style>

      {(isLoading && !error) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm pointer-events-none">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Initializing Stream</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 text-center p-4">
            <div className="text-red-500 text-5xl mb-4">🚫</div>
            <h3 className="font-black text-white uppercase italic text-lg tracking-tighter">Stream Error</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest max-w-xs">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-6 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition"
            >
                Retry Stream
            </button>
        </div>
      )}
    </div>
  );
};

export default VideoJSPlayer;
