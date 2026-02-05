'use client';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';

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
  const [showPreRoll, setShowPreRoll] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (showPreRoll) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showPreRoll]);

  const renderContent = () => {
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
        return <PlayerJSPlayer src={src} />;
      default:
        return <NativePlayer src={src} />;
    }
  };

  return (
    <div className="w-full h-full relative group">
      {renderContent()}

      {showPreRoll && (
        <div className="absolute inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6">
          <div className="text-center max-w-md w-full">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-white/5 mb-8 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop" className="w-full h-full object-cover opacity-50" alt="Ad" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-16 h-16 text-emerald-500 fill-current animate-pulse" />
                </div>
                <div className="absolute bottom-4 right-4 bg-black/80 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white">
                    Advertisement
                </div>
            </div>

            <div className="flex flex-col items-center gap-6">
                <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Premium Content Loading</h4>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
                    ></div>
                </div>

                {timeLeft > 0 ? (
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Skip in {timeLeft}s</p>
                ) : (
                    <button
                        onClick={() => setShowPreRoll(false)}
                        className="flex items-center gap-2 bg-white text-slate-950 px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-xl"
                    >
                        Skip Ad <X className="w-4 h-4" />
                    </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPlayer;