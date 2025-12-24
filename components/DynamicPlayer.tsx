'use client';
import dynamic from 'next/dynamic';
import React from 'react';

// --- প্লেয়ার লোডিং-এর জন্য একটি সুন্দর লোডার ---
const PlayerLoading = () => (
  <div className="w-full h-full bg-black flex items-center justify-center text-white">
    <div className="w-10 h-10 border-4 border-gray-600 border-t-cyan-500 rounded-full animate-spin"></div>
    <p className="ml-4 text-lg">Initializing Player...</p>
  </div>
);

// --- প্রতিটি প্লেয়ার কম্পোনেন্ট ডায়নামিকভাবে ইমপোর্ট করা ---
const PlyrPlayer = dynamic(() => import('./PlyrPlayer'), { 
  loading: () => <PlayerLoading />,
  ssr: false 
});

const VideoJSPlayer = dynamic(() => import('./VideoJSPlayer'), { 
  loading: () => <PlayerLoading />,
  ssr: false 
});

const NativePlayer = dynamic(() => import('./NativePlayer'), { 
  loading: () => <PlayerLoading />,
  ssr: false 
});

const ShakaPlayer = dynamic(() => import('./ShakaPlayer'), { 
  loading: () => <PlayerLoading />,
  ssr: false 
});

// --- ডায়নামিক প্লেয়ারের প্রপস (Props) সংজ্ঞা ---
interface DynamicPlayerProps {
  player: 'plyr' | 'videojs' | 'native' | 'shaka';
  src: string;
  drm?: any; // DRM কনফিগারেশনকে ফ্লেক্সিবল রাখা হয়েছে
}

// --- মূল ডায়নামিক প্লেয়ার কম্পোনেন্ট ---
const DynamicPlayer: React.FC<DynamicPlayerProps> = ({ player, src, drm }) => {

  // প্লেয়ারের ধরন অনুযায়ী সঠিক কম্পোনেন্ট রেন্ডার করা
  switch (player) {
    case 'plyr':
      // সমাধান: PlyrPlayer `source` প্রপ গ্রহণ করে
      return <PlyrPlayer source={{ type: 'video', sources: [{ src: src, type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }] }} />;
    case 'videojs':
      // সমাধান: VideoJSPlayer `options` প্রপ গ্রহণ করে
      return <VideoJSPlayer options={{ autoplay: true, controls: true, responsive: true, fluid: true, sources: [{ src: src, type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }] }} />;
    case 'native':
       // সমাধান: NativePlayer `source` প্রপ গ্রহণ করে
      return <NativePlayer source={src} />;
    case 'shaka':
      // ShakaPlayer-কে সঠিকভাবে DRM প্রপস পাস করা
      return <ShakaPlayer src={src} drm={drm} />;
    default:
      // যদি কোনো অজানা প্লেয়ার টাইপ আসে, তবে ডিফল্ট হিসেবে Native প্লেয়ার দেখানো
      console.warn(`Unknown player type: "${player}". Falling back to native player.`);
      return <NativePlayer source={src} />;
  }
};

export default DynamicPlayer;
