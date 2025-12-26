'use client';
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// থিমটি ইন্সটল করা না থাকলে এটি কমেন্ট করে দিন অথবা 'npm install @videojs/themes' কমান্ড দিন
import '@videojs/themes/dist/fantasy/index.css';

interface VideoJSPlayerProps {
  src: string;
}

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ১. প্লেয়ার যদি আগে থেকেই থাকে, তবে শুধু সোর্স আপডেট করো (Re-create করো না)
    if (playerRef.current) {
      const player = playerRef.current;
      
      // নতুন সোর্স লোড করার আগে স্টেট আপডেট
      setIsLoading(true);
      setError(null);

      player.src({ src, type: 'application/x-mpegURL' });
      player.load();
      return;
    }

    // ২. যদি প্লেয়ার না থাকে, তবে নতুন করে তৈরি করো
    if (!videoRef.current) return;

    // ভিডিও এলিমেন্ট তৈরি
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-theme-fantasy');
    videoRef.current.appendChild(videoElement);

    const options = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{ src, type: 'application/x-mpegURL' }],
      html5: {
        vhs: {
          overrideNative: true, // ভালো HLS সাপোর্টের জন্য
        },
      },
    };

    const player = (playerRef.current = videojs(videoElement, options, () => {
      console.log('Player Created & Ready');
      setIsLoading(false);
    }));

    // ৩. ইভেন্ট লিসেনার (Error & Loading Handling)
    player.on('error', () => {
      const err = player.error();
      console.error('VideoJS Error:', err);
      setError(`Error ${err?.code}: Stream could not be played.`);
      setIsLoading(false);
    });

    player.on('waiting', () => {
       if (!player.paused()) setIsLoading(true);
    });

    player.on('playing', () => setIsLoading(false));
    player.on('canplay', () => setIsLoading(false));

  }, [src]); // src পাল্টালে useEffect রান হবে, কিন্তু উপরের লজিক অনুযায়ী প্লেয়ার ভাঙবে না

  // ৪. ক্লিনআপ (শুধুমাত্র কম্পোনেন্ট আনমাউন্ট হলে প্লেয়ার ধ্বংস হবে)
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
    <div data-vjs-player className="w-full h-full relative bg-black rounded-lg overflow-hidden">
      <div ref={videoRef} className="w-full h-full" />

      {/* লোডিং স্পিনার */}
      {(isLoading && !error) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 pointer-events-none">
           <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-white text-xs mt-2">Loading Stream...</p>
        </div>
      )}

      {/* এরর মেসেজ */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-center p-4">
           <div className="text-red-500 text-3xl mb-2">⚠</div>
           <h3 className="font-bold text-red-400">Stream Error</h3>
           <p className="text-xs text-gray-300 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default VideoJSPlayer;