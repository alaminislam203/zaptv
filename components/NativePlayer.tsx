'use client';
import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';

// --- আইকন কম্পোনেন্ট (SVG) ---
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const VolumeHighIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>;
const VolumeMutedIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" /></svg>;
const FullscreenIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>;

const NativePlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // প্লেয়ার স্টেট
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // লোডিং ও কোয়ালিটি স্টেট
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<Hls.Level[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // পূর্ববর্তী ইনস্ট্যান্স ধ্বংস করা
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    // নতুন সোর্সের জন্য স্টেট রিসেট
    setIsLoading(true);
    setError(null);
    setQualityLevels([]);
    setCurrentQuality(-1);
    setIsPlaying(true); // Autoplay

    if (Hls.isSupported() && src.endsWith('.m3u8')) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        if (data.levels.length > 1) {
          setQualityLevels(data.levels.reverse()); // Best quality on top
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream Error: Could not load the video.');
        }
      });
    } else {
      video.src = src;
      setIsLoading(false);
    }

    video.play().catch(() => setIsPlaying(false)); // Autoplay চেষ্টা

    // --- ভিডিও ইভেন্ট লিসেনার ---
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setProgress(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onCanPlay = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    const onVolumeChange = () => { 
      setIsMuted(video.muted); 
      setVolume(video.volume); 
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      // ...সব লিসেনার রিমুভ করা
    };
  }, [src]);

  // কন্ট্রোল হাইড করার জন্য
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  // --- কন্ট্রোল ফাংশন ---
  const togglePlay = () => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(videoRef.current) videoRef.current.currentTime = Number(e.target.value);
  };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(videoRef.current) videoRef.current.volume = Number(e.target.value);
  };
  const toggleMute = () => { if(videoRef.current) videoRef.current.muted = !videoRef.current.muted; };
  const toggleFullScreen = () => containerRef.current?.requestFullscreen();
  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = levelIndex;
    setCurrentQuality(levelIndex);
    setShowQualityMenu(false);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-black flex items-center justify-center relative rounded-xl overflow-hidden text-white"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full" playsInline onClick={togglePlay} />

      {/* ওভারলে UI (লোডিং ও এরর) */}
      {(isLoading || error) && (
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 pointer-events-none text-center p-4">
            {error ? (
                <><div className="text-red-500 text-4xl mb-3">⚠</div>
                <h3 className="font-bold text-red-400 text-lg">Playback Error</h3>
                <p className="text-sm text-gray-300 max-w-sm">{error}</p></>
            ) : (
                <><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-sm mt-2">Loading Stream...</p></>
            )}
         </div>
      )}

      {/* কাস্টম কন্ট্রোল */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 p-2 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onMouseEnter={() => {if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);}} // মেনুতে হোভার করলে হাইড হবে না
      >
        {/* SeekBar */}
        <input type="range" min="0" max={duration} value={progress} onChange={handleSeek} className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer range-thumb" />

        <div className="flex items-center justify-between mt-1">
          {/* বাম দিকের কন্ট্রোল */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
            <div className="flex items-center gap-2 group">
                <button onClick={toggleMute}>{isMuted || volume === 0 ? <VolumeMutedIcon /> : <VolumeHighIcon />}</button>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={handleVolume} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer range-thumb transition-all duration-300 opacity-0 group-hover:opacity-100" />
            </div>
            <div className="text-xs font-mono">
              {new Date(progress * 1000).toISOString().substr(14, 5)} / {new Date(duration * 1000).toISOString().substr(14, 5)}
            </div>
          </div>

          {/* ডান দিকের কন্ট্রোল */}
          <div className="flex items-center gap-3 relative">
            {/* কোয়ালিটি মেনু */}
            {qualityLevels.length > 0 && (
              <div>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded p-2 text-sm shadow-lg">
                    <ul>
                      <li onClick={() => handleQualityChange(-1)} className={`cursor-pointer px-3 py-1 rounded hover:bg-cyan-600/50 ${currentQuality === -1 ? 'font-bold text-cyan-400' : ''}`}>Auto</li>
                      {qualityLevels.map((level, i) => (
                        <li key={i} onClick={() => handleQualityChange(qualityLevels.length - 1 - i)} className={`cursor-pointer px-3 py-1 rounded hover:bg-cyan-600/50 ${currentQuality === (qualityLevels.length - 1 - i) ? 'font-bold text-cyan-400' : ''}`}>
                          {level.height}p
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={() => setShowQualityMenu(!showQualityMenu)}><SettingsIcon /></button>
              </div>
            )}
            <button onClick={toggleFullScreen}><FullscreenIcon /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NativePlayer;
