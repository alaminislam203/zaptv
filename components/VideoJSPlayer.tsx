'use client';
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
// সমাধান ৩: একটি সুন্দর থিম ইমপোর্ট করা
import '@videojs/themes/dist/fantasy/index.css';

interface VideoJSPlayerProps {
  src: string;
}

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

  // সমাধান ১: লোডিং এবং এরর স্টেট যুক্ত করা
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    // সমাধান ৪: HLS স্ট্রিমের জন্য সঠিক টাইপ উল্লেখ করা
    sources: [{
      src: src,
      type: 'application/x-mpegURL'
    }],
    // একটি সুন্দর UI থিম ব্যবহার করা
    className: 'vjs-theme-fantasy'
  };

  useEffect(() => {
    // ভিডিও কন্টেইনার না থাকলে কিছুই হবে না
    if (!videoRef.current) return;

    // প্লেয়ার শুরু করার আগে স্টেট রিসেট
    setIsLoading(true);
    setError(null);

    // একটি ভিডিও ট্যাগ তৈরি করা যা Video.js ব্যবহার করবে
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, videoJsOptions, () => {
        setIsLoading(false);
        console.log('Player is ready');
    });
    
    // সমাধান ২: ব্যবহারকারী-বান্ধব এরর হ্যান্ডলিং
    player.on('error', () => {
      const playerError = player.error();
      if(playerError) {
        console.error('Video.js Error:', playerError);
        setError(`Error ${playerError.code}: ${playerError.message || 'Could not load the video.'}`);
      }
      setIsLoading(false);
    });

    player.on('waiting', () => {
        // শুধুমাত্র ভিডিও চলাকালীন বাফারিং দেখানো
        if(!player.paused()) setIsLoading(true);
    });

    player.on('playing', () => {
        setIsLoading(false);
    });

    // কম্পোনেন্ট আনমাউন্ট হলে প্লেয়ার ধ্বংস করা
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [src]); // `options`-কে ডিপেন্ডেন্সি থেকে সরানো হয়েছে কারণ এটি বারবার রি-রেন্ডার ঘটাচ্ছিল

  return (
    <div data-vjs-player className="w-full h-full relative bg-black rounded-lg overflow-hidden">
      <div ref={videoRef} className="w-full h-full" />

        {/* লোডিং ওভারলে */}
        {(isLoading && !error) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 pointer-events-none">
                <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-sm mt-2">Loading Stream...</p>
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
    </div>
  );
};

export default VideoJSPlayer;
