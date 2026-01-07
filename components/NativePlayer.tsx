'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Hls, { type Level } from 'hls.js';

// --- ICONS ---
const Icons = {
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M8 5v14l11-7z" /></svg>,
  Pause: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>,
  VolumeHigh: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>,
  VolumeMuted: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" /></svg>,
  Fullscreen: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>,
  Forward10: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 opacity-75"><path d="M12.5 13v-1l5 4-5 4v-3h-3v-4h3zm-9 7v-4h3v-3h-3v-1l5-4v12l-5-4zM10 6.35V4.26c3.21.91 5.67 3.77 5.94 7.24h-2.03c-.26-2.35-1.93-4.28-4-4.91.03-.08.06-.16.09-.24z"/></svg>, // Simplified representation
};

const NativePlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quality
  const [qualityLevels, setQualityLevels] = useState<Level[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Double Tap State
  const [lastTap, setLastTap] = useState(0);
  const [showDoubleTapOverlay, setShowDoubleTapOverlay] = useState<'forward' | 'backward' | null>(null);

  // --- ACTIONS ---
  const togglePlay = useCallback(() => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration));
      setProgress(videoRef.current.currentTime);
    }
  }, []);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for Space/Arrows
      if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();

      switch(e.code) {
        case 'Space': togglePlay(); break;
        case 'KeyF': toggleFullScreen(); break;
        case 'KeyM': toggleMute(); break;
        case 'ArrowRight': seek(videoRef.current ? videoRef.current.currentTime + 10 : 0); break;
        case 'ArrowLeft': seek(videoRef.current ? videoRef.current.currentTime - 10 : 0); break;
        case 'ArrowUp': 
          if(videoRef.current) {
             const newVol = Math.min(1, videoRef.current.volume + 0.1);
             videoRef.current.volume = newVol;
             setVolume(newVol);
          }
          break;
        case 'ArrowDown':
          if(videoRef.current) {
             const newVol = Math.max(0, videoRef.current.volume - 0.1);
             videoRef.current.volume = newVol;
             setVolume(newVol);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullScreen, toggleMute, seek]);

  // --- INIT PLAYER ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    setIsLoading(true); setError(null); setQualityLevels([]); setCurrentQuality(-1); setIsPlaying(true);

    if (Hls.isSupported() && (src.endsWith('.m3u8') || src.includes('m3u8'))) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        if (data.levels.length > 0) setQualityLevels(data.levels);
        video.play().catch(() => { setIsPlaying(false); setIsMuted(true); video.muted = true; video.play(); });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
            case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
            default: setError("Stream unavailable."); hls.destroy(); break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => { setIsLoading(false); video.play(); });
    } else {
        setError("Format not supported"); setIsLoading(false);
    }

    const onTimeUpdate = () => setProgress(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onCanPlay);

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onCanPlay);
    };
  }, [src]);

  // --- CONTROLS VISIBILITY ---
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  // --- DOUBLE TAP HANDLER ---
  const handleScreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
        // Double Tap Detected
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const clickX = e.clientX - rect.left;
            if (clickX > rect.width / 2) {
                seek(videoRef.current ? videoRef.current.currentTime + 10 : 0);
                setShowDoubleTapOverlay('forward');
            } else {
                seek(videoRef.current ? videoRef.current.currentTime - 10 : 0);
                setShowDoubleTapOverlay('backward');
            }
            setTimeout(() => setShowDoubleTapOverlay(null), 500);
        }
    } else {
        togglePlay(); // Single Tap
    }
    setLastTap(now);
    setShowQualityMenu(false);
  };

  const handleQualityChange = (index: number) => {
      if (hlsRef.current) hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
      setShowQualityMenu(false);
  };

  const isLive = duration === Infinity || duration === 0 || isNaN(duration);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full bg-black flex items-center justify-center relative rounded-xl overflow-hidden group select-none" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={() => setShowControls(false)}
        onClick={handleScreenClick}
    >
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />

      {/* Loading / Error Layer */}
      {(isLoading || error) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            {error ? (
                <div className="text-center"><div className="text-red-500 text-5xl mb-2">⚠️</div><p className="text-red-400 font-bold">{error}</p></div>
            ) : (
                <div className="flex flex-col items-center gap-3"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div><p className="text-cyan-400 text-xs font-mono animate-pulse">BUFFERING...</p></div>
            )}
        </div>
      )}

      {/* Double Tap Animation Overlay */}
      {showDoubleTapOverlay && (
          <div className={`absolute top-0 bottom-0 z-40 w-1/2 flex items-center justify-center bg-white/10 transition-opacity duration-300 ${showDoubleTapOverlay === 'forward' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'}`}>
              <div className="text-white font-bold flex flex-col items-center animate-ping">
                  <span className="text-2xl">{showDoubleTapOverlay === 'forward' ? '10s »' : '« 10s'}</span>
              </div>
          </div>
      )}

      {/* Controls Layer */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar (VOD Only) */}
        {!isLive && (
            <div className="relative group/slider w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer hover:h-1.5 transition-all">
                <div className="absolute top-0 left-0 h-full bg-cyan-500 rounded-full" style={{ width: `${(progress / duration) * 100}%` }}></div>
                <input type="range" min="0" max={duration} value={progress} onChange={(e) => seek(Number(e.target.value))} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-50" />
            </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition hover:scale-110">{isPlaying ? <Icons.Pause /> : <Icons.Play />}</button>
            
            <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="text-white hover:text-cyan-400 transition">{isMuted || volume === 0 ? <Icons.VolumeMuted /> : <Icons.VolumeHigh />}</button>
                <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e) => { if(videoRef.current) { videoRef.current.volume = Number(e.target.value); setVolume(Number(e.target.value)); } }} className="w-0 group-hover/vol:w-20 transition-all duration-300 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-cyan-500" />
            </div>

            <div className="text-xs font-mono text-gray-300">
              {isLive ? (
                  <div className="flex items-center gap-2 px-2 py-1 bg-red-600/20 border border-red-600/50 rounded"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span><span className="text-red-500 font-bold tracking-widest">LIVE</span></div>
              ) : (
                  <span>{new Date(progress * 1000).toISOString().substr(11, 8).replace(/^00:/, '')} / {new Date(duration * 1000).toISOString().substr(11, 8).replace(/^00:/, '')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {qualityLevels.length > 0 && (
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }} className={`transition hover:text-cyan-400 ${showQualityMenu ? 'text-cyan-400 rotate-45' : 'text-white'}`}><Icons.Settings /></button>
                    {showQualityMenu && (
                        <div className="absolute bottom-full right-0 mb-4 bg-[#18181b] border border-gray-800 rounded-lg p-1 min-w-[120px] shadow-xl overflow-hidden animate-fadeIn z-50">
                            <ul className="text-xs text-gray-300">
                                <li onClick={() => handleQualityChange(-1)} className={`px-3 py-2 cursor-pointer hover:bg-white/10 rounded flex justify-between ${currentQuality === -1 ? 'text-cyan-400 font-bold bg-white/5' : ''}`}><span>Auto</span>{currentQuality === -1 && <span>✓</span>}</li>
                                {[...qualityLevels].reverse().map((level) => {
                                    const originalIndex = qualityLevels.indexOf(level);
                                    return (<li key={originalIndex} onClick={() => handleQualityChange(originalIndex)} className={`px-3 py-2 cursor-pointer hover:bg-white/10 rounded flex justify-between ${currentQuality === originalIndex ? 'text-cyan-400 font-bold bg-white/5' : ''}`}><span>{level.height}p</span>{currentQuality === originalIndex && <span>✓</span>}</li>);
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            <button onClick={toggleFullScreen} className="text-white hover:text-cyan-400 transition hover:scale-110"><Icons.Fullscreen /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NativePlayer;
