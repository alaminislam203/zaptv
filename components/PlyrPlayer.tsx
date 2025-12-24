'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

// সমাধান: ES Module-এর সাথে সামঞ্জস্যপূর্ণভাবে 'plyr' ইমপোর্ট করা
import * as plyr from 'plyr';
// মডিউল ইন্টারঅপ হ্যান্ডেল করার জন্য: CJS/ESM ইস্যু সমাধান
const Plyr = (plyr as any).default ?? plyr;

// --- ইন্টারফেস সংজ্ঞা ---
interface DrmConfig {
  type: 'clearkey' | 'widevine' | 'none';
  keyId?: string;
  key?: string;
  licenseUrl?: string;
}

interface Source {
  src: string;
  drm?: DrmConfig;
}

interface PlyrPlayerProps {
  source: Source;
  options?: Plyr.Options;
}

const PlyrPlayer: React.FC<PlyrPlayerProps> = ({ source, options }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memoizedSource = useMemo(() => source, [source.src, source.drm]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    setError(null);
    setIsBuffering(true);

    const defaultOptions: Plyr.Options = {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
      autoplay: true,
      keyboard: { focused: true, global: false },
      quality	:{ default: 576, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] }

    };
    const combinedOptions = { ...defaultOptions, ...options };

    const setupListeners = (plyrInstance: Plyr) => {
      plyrInstance.on('waiting', () => setIsBuffering(true));
      plyrInstance.on('playing', () => setIsBuffering(false));
      plyrInstance.on('canplay', () => setIsBuffering(false));
      plyrInstance.on('ready', () => setIsBuffering(false));
      plyrInstance.on('error', (e: Plyr.PlyrEvent) => {
        console.error('Plyr Error:', e.detail.plyr.source);
        setError('The stream could not be loaded. It might be offline.');
        setIsBuffering(false);
      });
    };

    if (memoizedSource.src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ startLevel: -1 });
        hlsRef.current = hls;
        hls.loadSource(memoizedSource.src);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const player = new Plyr(videoElement, combinedOptions);
          playerRef.current = player;
          setupListeners(player);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS Fatal Error:', data);
            setError(`Stream Error: ${data.details}. Please try another server.`);
            setIsBuffering(false);
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = memoizedSource.src;
        const player = new Plyr(videoElement, combinedOptions);
        playerRef.current = player;
        setupListeners(player);
      }
    } else {
      videoElement.src = memoizedSource.src;
      const player = new Plyr(videoElement, combinedOptions);
      playerRef.current = player;
      setupListeners(player);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [memoizedSource, options]);

  return (
    <div className="w-full h-full bg-black relative group rounded-xl overflow-hidden">
      {error && !isBuffering && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 pointer-events-none text-center p-4">
          <div className='text-red-500 text-3xl mb-2'>⚠</div>
          <h3 className="font-bold text-red-500">Stream Unavailable</h3>
          <p className='text-sm text-gray-300'>{error}</p>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <video
        ref={videoRef}
        className="plyr-react plyr"
        playsInline
        crossOrigin="anonymous"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default PlyrPlayer;
