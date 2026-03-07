// ============================================================
// FALCON SPORTS — Universal Video Player
// Supports: HLS (m3u8), DASH (mpd), YouTube, iframe, MP4/WebM
// ============================================================

import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";

// ─── TYPE DEFINITIONS ─────────────────────────────────────────
type StreamType = "auto" | "hls" | "dash" | "youtube" | "youtube-embed" | "iframe" | "mp4" | "unknown";

interface Stream {
  label: string;
  url: string;
  type?: StreamType;
}

// ─── STREAM TYPE DETECTOR ────────────────────────────────────
function detectStreamType(url: string): StreamType {
  if (!url) return "unknown";
  const u = url.toLowerCase();

  if (u.includes("youtube.com/watch") || u.includes("youtu.be/")) return "youtube";
  if (u.includes("youtube.com/embed")) return "youtube-embed";
  if (u.endsWith(".m3u8") || u.includes(".m3u8?") || u.includes("m3u8")) return "hls";
  if (u.endsWith(".mpd") || u.includes(".mpd?") || u.includes("manifest")) return "dash";
  if (u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg")) return "mp4";
  if (u.startsWith("http") && !u.includes("youtube")) return "iframe";
  return "unknown";
}

// ─── YOUTUBE URL → EMBED ─────────────────────────────────────
function toYouTubeEmbed(url: string): string {
  let id = "";
  if (url.includes("youtu.be/")) {
    id = url.split("youtu.be/")[1]?.split("?")[0] || "";
  } else if (url.includes("watch?v=")) {
    id = url.split("watch?v=")[1]?.split("&")[0] || "";
  } else if (url.includes("/embed/")) {
    return url; // already embed
  }
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
}

// ─── ICONS ───────────────────────────────────────────────────
const PlayIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);
const PauseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);
const MuteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>
);
const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  </svg>
);
const FullscreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </svg>
);

// ─── HLS PLAYER ───────────────────────────────────────────────
interface PlayerProps { url: string; onError?: (msg: string) => void; }

function HLSPlayer({ url, onError }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState(-1);
  const [levels, setLevels] = useState<any[]>([]);
  const [showQuality, setShowQuality] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const setupHLS = async () => {
      try {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
            setLevels(data.levels);
            setIsLive(!!(hls.currentLevel === -1 || data.levels[0]?.details?.live));
            setLoading(false);
            video.play().catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) onError?.("HLS stream error: " + data.type);
          });

          hls.on(Hls.Events.FRAG_BUFFERED, () => {
            if (video.buffered.length > 0) {
              setBuffered(video.buffered.end(video.buffered.length - 1));
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
              setIsLive(video.duration === Infinity);
              setLoading(false);
              video.play().catch(()=>{});
          });
        } else {
          onError?.("HLS not supported in this browser");
        }
      } catch (e: any) {
        onError?.("Failed to load HLS.js: " + e.message);
      }
    };

    setupHLS();
    return () => { hlsRef.current?.destroy(); };
  }, [url, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrentTime(video.currentTime);
    const onDur = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDur);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDur);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const handleFullscreen = () => {
    const container = videoRef.current?.parentElement?.parentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else container?.requestFullscreen();
  };

  const setQualityLevel = (lvl: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = lvl;
      setQuality(lvl);
    }
    setShowQuality(false);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s) || s === Infinity) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div style={{ position: "relative", background: "#000", width: "100%", aspectRatio: "16/9" }}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
      onClick={() => { togglePlay(); showControlsTemporarily(); }}>

      <video ref={videoRef} style={{ width: "100%", height: "100%", display: "block" }}
        playsInline autoPlay muted={muted} />

      {loading && (
        <div style={{...styles.overlay, background: "rgba(0,0,0,0.5)"}}>
          <div style={styles.spinner} />
        </div>
      )}

      <div style={{...styles.overlay, ...styles.controlsOverlay, opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none"}}
           onClick={e => e.stopPropagation()}>

        {!isLive && duration > 0 && (
          <div style={{ position: "relative", marginBottom: 8 }}>
            <div style={{...styles.progressBar, width: `${(buffered / duration) * 100}%` }} />
            <input type="range" min={0} max={duration} step={0.5} value={currentTime} onChange={handleSeek} style={styles.rangeInput} />
          </div>
        )}

        {isLive && (
          <div style={{ marginBottom: 8 }}>
            <span style={styles.liveBadge}>● LIVE</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={togglePlay} style={ctrlBtn}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
          <button onClick={toggleMute} style={ctrlBtn}>{muted ? <MuteIcon /> : <VolumeIcon />}</button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={handleVolume} style={{...styles.rangeInput, width: 70}} />

          {!isLive && <span style={styles.timeLabel}>{fmt(currentTime)} / {fmt(duration)}</span>}
          <div style={{ flex: 1 }} />

          {levels.length > 0 && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowQuality(!showQuality)} style={ctrlBtn}><SettingsIcon /></button>
              {showQuality && (
                <div style={styles.qualityMenu}>
                  <div style={styles.qualityHeader}>QUALITY</div>
                  <div onClick={() => setQualityLevel(-1)} style={qualityItem(quality === -1)}>Auto</div>
                  {levels.map((l, i) => (
                    <div key={i} onClick={() => setQualityLevel(i)} style={qualityItem(quality === i)}>
                      {l.height ? `${l.height}p` : `Level ${i}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={handleFullscreen} style={ctrlBtn}><FullscreenIcon /></button>
        </div>
      </div>
    </div>
  );
}

// ─── DASH PLAYER ─────────────────────────────────────────────
function DASHPlayer({ url, onError }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let player: any;
    const setup = async () => {
      try {
        const dashjs = (await import("dashjs")).default;
        player = dashjs.MediaPlayer().create();
        player.initialize(video, url, true);
        player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => setReady(true));
        player.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
            if (e.error && e.error.code) {
                 onError?.(`DASH error: ${e.error.code} - ${e.error.message}`);
            } else if (typeof e.error === 'string'){
                 onError?.(`DASH error: ${e.error}`);
            } else {
                 onError?.('An unknown DASH error occurred.');
            }
        });
      } catch (e: any) {
        onError?.("Failed to load dash.js: " + e.message);
      }
    };

    setup();
    return () => player?.destroy();
  }, [url, onError]);

  return (
    <div style={{ position: "relative", background: "#000", width: "100%", aspectRatio: "16/9" }}>
      {!ready && (
        <div style={styles.overlay}>
          <div style={styles.spinner} />
        </div>
      )}
      <video ref={videoRef} controls playsInline
        style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

// ─── IFRAME / YOUTUBE PLAYER ─────────────────────────────────
function IframePlayer({ url, type }: { url: string; type: "youtube" | "iframe" }) {
  const embedUrl = type === "youtube" ? toYouTubeEmbed(url) : url;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000" }}>
      <iframe
        src={embedUrl}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

// ─── NATIVE VIDEO (MP4) ───────────────────────────────────────
function MP4Player({ url }: { url: string }) {
  return (
    <div style={{ width: "100%", aspectRatio: "16/9", background: "#000" }}>
      <video controls playsInline autoPlay
        style={{ width: "100%", height: "100%", display: "block" }}>
        <source src={url} />
        Your browser does not support video playback.
      </video>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────
const ctrlBtn: CSSProperties = {
  background: "none", border: "none", color: "#fff",
  cursor: "pointer", display: "flex", alignItems: "center",
  padding: 4, borderRadius: 4, opacity: 0.9,
};

const qualityItem = (active: boolean): CSSProperties => ({
  padding: "8px 16px", cursor: "pointer", fontSize: 13,
  color: active ? "#ef4444" : "#fff",
  fontWeight: active ? 700 : 400,
  background: active ? "rgba(239,68,68,0.1)" : "transparent",
  transition: "background 0.15s",
});

const styles: { [key: string]: CSSProperties } = {
    overlay: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" },
    spinner: { width: 48, height: 48, border: "4px solid rgba(255,255,255,0.2)", borderTop: "4px solid #ef4444", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    controlsOverlay: { background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "32px 14px 12px", transition: "opacity 0.3s" },
    progressBar: { position: "absolute", top: "50%", transform: "translateY(-50%)", height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, pointerEvents: "none" },
    rangeInput: { width: "100%", accentColor: "#ef4444", cursor: "pointer", background: 'transparent' },
    liveBadge: { background: "#ef4444", color: "#fff", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: 1 },
    timeLabel: { fontSize: 12, color: "#ccc", whiteSpace: "nowrap" },
    qualityMenu: { position: "absolute", bottom: "110%", right: 0, background: "rgba(0,0,0,0.9)", borderRadius: 8, overflow: "hidden", minWidth: 100, border: "1px solid rgba(255,255,255,0.1)" },
    qualityHeader: { padding: "6px 12px", fontSize: 11, color: "#888", fontWeight: 700 },
};


// ─── STREAM SELECTOR (Multiple Streams) ──────────────────────
interface StreamSelectorProps {
  streams: Stream[];
  active: number;
  onChange: (index: number) => void;
}
function StreamSelector({ streams, active, onChange }: StreamSelectorProps) {
  if (!streams || streams.length <= 1) return null;
  return (
    <div style={{
      display: "flex", gap: 6, flexWrap: "wrap",
      padding: "8px 0", borderBottom: "1px solid #e5e7eb", marginBottom: 8
    }}>
      {streams.map((s, i) => (
        <button key={i} onClick={() => onChange(i)} style={{
          padding: "5px 14px",
          background: active === i ? "#ef4444" : "#f0f2f5",
          color: active === i ? "#fff" : "#444",
          border: "none", borderRadius: 20,
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s"
        }}>
          {s.label || `Stream ${i + 1}`}
        </button>
      ))}
    </div>
  );
}

// ─── MAIN UNIVERSAL PLAYER ───────────────────────────────────
interface VideoPlayerProps {
  url?: string;
  streams?: Stream[];
  title?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: string | number;
  awayScore?: string | number;
  isLive?: boolean;
}

export default function VideoPlayer({
  url,
  streams,
  title,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  isLive = false,
}: VideoPlayerProps) {
  const [activeStream, setActiveStream] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamList: Stream[] = streams?.length ? streams : url ? [{ url, label: "Main" }] : [];
  const current = streamList[activeStream];
  const currentUrl = current?.url || "";
  const detectedType = current?.type && current.type !== 'auto' ? current.type : detectStreamType(currentUrl);

  const handleError = (msg: string) => setError(msg);
  const handleStreamChange = (idx: number) => { setActiveStream(idx); setError(null); };

  const renderPlayer = () => {
    if (!currentUrl) return (
      <div style={{aspectRatio: "16/9", ...styles.overlay, flexDirection: "column", color: "#666", gap: 10}}>
        <span style={{ fontSize: 40 }}>📡</span>
        <span style={{ fontWeight: 600 }}>No stream available</span>
      </div>
    );

    if (error) return (
      <div style={{aspectRatio: "16/9", ...styles.overlay, flexDirection: "column", color: "#ef4444", gap: 10, padding: 20, textAlign: "center"}}>
        <span style={{ fontSize: 36 }}>⚠️</span>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Stream Error</span>
        <span style={{ fontSize: 13, color: "#888" }}>{error}</span>
        <button onClick={() => setError(null)} style={{marginTop: 8, padding: "8px 20px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700}}>
          Retry
        </button>
      </div>
    );

    switch (detectedType) {
      case "hls": return <HLSPlayer url={currentUrl} onError={handleError} />;
      case "dash": return <DASHPlayer url={currentUrl} onError={handleError} />;
      case "youtube":
      case "youtube-embed": return <IframePlayer url={currentUrl} type="youtube" />;
      case "iframe": return <IframePlayer url={currentUrl} type="iframe" />;
      case "mp4": return <MP4Player url={currentUrl} />;
      default: return <IframePlayer url={currentUrl} type="iframe" />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; outline: none; background: rgba(255,255,255,0.25); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #ef4444; cursor: pointer; }
      `}</style>

      <div style={{background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.1)", fontFamily: "'Segoe UI', sans-serif"}}>
        {(homeTeam || awayTeam || title) && (
          <div style={{background: "#0f0f1a", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10}}>
            {homeTeam && awayTeam ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "center" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "right", flex: 1 }}>{homeTeam}</span>
                {isLive && homeScore !== undefined ? (
                  <div style={{background: "#ef4444", color: "#fff", padding: "4px 16px", borderRadius: 8, fontSize: 20, fontWeight: 900, letterSpacing: 2, whiteSpace: "nowrap", minWidth: 72, textAlign: "center"}}>
                    {String(homeScore)} – {String(awayScore)}
                  </div>
                ) : (
                  <div style={{color: "#888", fontWeight: 700, fontSize: 13, padding: "4px 12px"}}>VS</div>
                )}
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "left", flex: 1 }}>{awayTeam}</span>
              </div>
            ) : (
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{title}</span>
            )}
            {isLive && <span style={{...styles.liveBadge, flexShrink: 0}}>● LIVE</span>}
          </div>
        )}

        {streamList.length > 1 && (
          <div style={{ padding: "8px 12px 0" }}>
            <StreamSelector streams={streamList} active={activeStream} onChange={handleStreamChange} />
          </div>
        )}

        {renderPlayer()}

        {currentUrl && !error && (
          <div style={{padding: "8px 14px", background: "#fafafa", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 6}}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
              background: detectedType === "hls" ? "#1a73e8" : detectedType === "dash" ? "#7c3aed" : detectedType === "youtube" ? "#ef4444" : "#16a34a",
              color: "#fff", padding: "2px 8px", borderRadius: 4
            }}>
              {detectedType.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: "#888", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentUrl}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
