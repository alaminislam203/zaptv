'use client';
import dynamic from 'next/dynamic';
import React from 'react';

// --- প্লেয়ার লোডিং-এর জন্য লোডার ---
const PlayerLoading = () => (
  <div className="w-full h-full bg-black flex items-center justify-center text-gray-500 flex-col gap-2">
    <div className="w-10 h-10 border-4 border-gray-600 border-t-cyan-500 rounded-full animate-spin"></div>
    <p className="text-xs animate-pulse">Initializing Player...</p>
  </div>
);

// --- প্রতিটি প্লেয়ার কম্পোনেন্ট ডায়নামিকভাবে ইমপোর্ট করা ---
// লক্ষ্য রাখুন: পাথগুলো যেন সঠিক থাকে (যেমন './PlyrPlayer' যদি একই ফোল্ডারে থাকে)
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

// --- প্রপস ইন্টারফেস ---
interface DynamicPlayerProps {
  player: 'plyr' | 'videojs' | 'native' | 'shaka'; // প্লেয়ার টাইপ স্ট্রিং হতে হবে
  src: string;
  drm?: any; // DRM কনফিগারেশন অপশনাল
}

// --- মূল কম্পোনেন্ট ---
const DynamicPlayer: React.FC<DynamicPlayerProps> = ({ player, src, drm }) => {

  // প্লেয়ারের ধরন অনুযায়ী সঠিক কম্পোনেন্ট রেন্ডার করা
  switch (player) {
    case 'plyr':
      // PlyrPlayer কে আমরা source অবজেক্ট পাঠাচ্ছি
      return <PlyrPlayer source={{ src, drm }} />;
    
    case 'videojs':
      // VideoJS সরাসরি src নেয়
      return <VideoJSPlayer src={src} />;
    
    case 'shaka':
      // Shaka Player সরাসরি src এবং drm নেয়
      return <ShakaPlayer src={src} drm={drm} />;
      
    case 'native':
      // Native Player সরাসরি src নেয়
      return <NativePlayer src={src} />;

    default:
      // ফলব্যাক হিসেবে Native Player
      console.warn(`Unknown player type: "${player}". Falling back to native.`);
      return <NativePlayer src={src} />;
  }
};

export default DynamicPlayer;