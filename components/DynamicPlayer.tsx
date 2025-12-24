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
      // সমাধান: `PlyrPlayer` এখন `source` অবজেক্ট গ্রহণ করছে, যার ভেতরে `src` এবং `drm` আছে
      return <PlyrPlayer source={{ src: src, drm: drm }} />;
    
    case 'videojs':
      // সমাধান: `VideoJSPlayer` সরাসরি `src` স্ট্রিং গ্রহণ করে
      return <VideoJSPlayer src={src} />;
    
    case 'native':
      // সমাধান: `NativePlayer` সরাসরি `src` স্ট্রিং গ্রহণ করে
      return <NativePlayer src={src} />;

    case 'shaka':
      // সমাধান: `ShakaPlayer` সরাসরি `src` এবং `drm` প্রপস গ্রহণ করে
      return <ShakaPlayer src={src} drm={drm} />;

    default:
      // যদি কোনো অজানা প্লেয়ার টাইপ আসে, তবে ডিফল্ট হিসেবে Native প্লেয়ার দেখানো
      console.warn(`Unknown player type: "${player}". Falling back to native player.`);
      return <NativePlayer src={src} />;
  }
};

export default DynamicPlayer;
