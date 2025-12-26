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

// নতুন: PlayerJSPlayer ইমপোর্ট করা হলো
const PlayerJSPlayer = dynamic(() => import('./PlayerJSPlayer'), { 
  loading: () => <PlayerLoading />,
  ssr: false 
});

// --- প্রপস ইন্টারফেস ---
interface DynamicPlayerProps {
  // 'playerjs' অপশনটি টাইপে যুক্ত করা হলো
  player: 'plyr' | 'videojs' | 'native' | 'shaka' | 'playerjsplayer'; 
  src: string;
  drm?: any; 
}

// --- মূল কম্পোনেন্ট ---
const DynamicPlayer: React.FC<DynamicPlayerProps> = ({ player, src, drm }) => {

  switch (player) {
    case 'plyr':
      return <PlyrPlayer src={src} />;
    
    case 'videojs':
      return <VideoJSPlayer src={src} />;
    
    case 'shaka':
      return <ShakaPlayer src={src} drm={drm} />;
      
    case 'native':
      return <NativePlayer src={src} />;

    case 'playerjsplayer':
      // PlayerJSPlayer রেন্ডার করা হলো
      return <PlayerJSPlayer src={src} />;

    default:
      console.warn(`Unknown player type: "${player}". Falling back to native.`);
      return <NativePlayer src={src} />;
  }
};

export default DynamicPlayer;