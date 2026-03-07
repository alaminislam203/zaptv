// ============================================================
// FALCON SPORTS — Main Site (with Video Player integrated)
// npm install firebase hls.js dashjs
// ============================================================

import { useState, useEffect, useRef, CSSProperties } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, setDoc, increment, DocumentData } from "firebase/firestore";
import VideoPlayer from "../components/VideoPlayer";
import Page from "./page";

// 🔧 YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyA3bna8DVXzCLUU3YQoXColTC0-8T4LoF0",
  authDomain: "arenax-live-tv.firebaseapp.com",
  projectId: "arenax-live-tv",
  storageBucket: "arenax-live-tv.appspot.com",
  messagingSenderId: "302900762554",
  appId: "1:302900762554:web:98e23ca37c50868e1a6f83"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ─── TYPE DEFINITIONS ─────────────────────────────────────────
type StreamType = "auto" | "hls" | "dash" | "youtube" | "youtube-embed" | "iframe" | "mp4" | "unknown";

interface Stream {
  label: string;
  url: string;
  type?: StreamType;
}

interface Match {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  matchDate: string;
  status: "upcoming" | "live" | "finished";
  homeScore?: number | string;
  awayScore?: number | string;
  streams: Stream[];
  streamLink?: string;
}

interface PageData {
  id: string;
  title: string;
  content: string;
}

interface MenuItem {
  id: string;
  label: string;
  url: string;
}

interface Ad {
  id: string;
  type?: 'ad';
  imageUrl: string;
  linkUrl: string;
  createdAt?: any;
}

interface SocialLink {
    name: string;
    color: string;
    btn: string;
    emoji: string;
    link: string;
    type?: undefined;
}

const sportEmoji: { [key: string]: string } = {
  football: "⚽", cricket: "🏏", basketball: "🏀",
  tennis: "🎾", baseball: "⚾", rugby: "🏉", hockey: "🏒"
};

const statusOptions = [
  { value: "upcoming", label: "Upcoming", color: "#1a73e8", bg: "#e8f0fe" },
  { value: "live",     label: "LIVE",     color: "#ef4444", bg: "#fef2f2" },
  { value: "finished", label: "Finished", color: "#16a34a", bg: "#f0fdf4" },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase() +
      ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch { return dateStr; }
}

function LiveBadge() {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{
        width:7, height:7, borderRadius:"50%", background:"#ef4444",
        display:"inline-block", animation:"pulseDot 1.4s infinite"
      }}/>
      <span style={{ color:"#ef4444", fontWeight:800, fontSize:11, letterSpacing:1 }}>LIVE</span>
    </span>
  );
}

// ─── Carousel Component ───────────────────────────────────
function Carousel({ slides }: { slides: Ad[] }) {
    const [current, setCurrent] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(
            () => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1)),
            5000
        );
        return () => {
            if(timeoutRef.current) clearTimeout(timeoutRef.current)
        };
    }, [current, slides.length]);

    if (!slides || slides.length === 0) return null;

    return (
        <div style={{ position: 'relative', width: '100%', height: 'auto', overflow: 'hidden', borderRadius: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', transition: 'transform 0.5s ease-out', transform: `translateX(-${current * 100}%)` }}>
                {slides.map((slide, index) => (
                    <a key={index} href={slide.linkUrl} target="_blank" rel="noopener noreferrer" style={{ flex: '0 0 100%' }}>
                        <img src={slide.imageUrl} alt={`Slide ${index + 1}`} style={{ width: '100%', display: 'block' }} />
                    </a>
                ))}
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                {slides.map((_, i) => (
                    <div
                        key={i}
                        onClick={() => setCurrent(i)}
                        style={{
                            width: 8, height: 8, borderRadius: '50%', background: current === i ? '#fff' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', transition: 'background 0.3s'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}


// ─── MATCH CARD ───────────────────────────────────────────────
function MatchCard({ match, onClick }: { match: Match; onClick: (match: Match) => void; }) {
  const isLive   = match.status === "live";
  const hasStream = match.streamLink || (match.streams?.length > 0);
  const sport    = (match.sport || "football").toLowerCase();
  const statusOpt = statusOptions.find(s => s.value === match.status) || statusOptions[0];

  const cardStyle: CSSProperties = {
    background:"#fff", borderRadius:14, marginBottom:10,
    overflow:"hidden",
    boxShadow: isLive
      ? "0 0 0 2px #ef4444, 0 4px 16px rgba(239,68,68,0.15)"
      : "0 1px 6px rgba(0,0,0,0.07)",
    cursor: hasStream ? "pointer" : "default",
    transition:"transform 0.15s, box-shadow 0.15s",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasStream) {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = isLive
        ? "0 0 0 2px #ef4444, 0 8px 24px rgba(239,68,68,0.2)"
        : "0 6px 20px rgba(0,0,0,0.12)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = isLive
      ? "0 0 0 2px #ef4444, 0 4px 16px rgba(239,68,68,0.15)"
      : "0 1px 6px rgba(0,0,0,0.07)";
  };
  
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement;
      target.style.display = 'none';
  }

  return (
    <div onClick={() => hasStream && onClick(match)} style={cardStyle} 
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* League Bar */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"8px 14px",
        background: isLive ? "#fff5f5" : "#fafafa",
        borderBottom:`1px solid ${isLive ? "#fee2e2" : "#f0f0f0"}`
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:15 }}>{sportEmoji[sport] || "🏆"}</span>
          <span style={{ fontWeight:700, fontSize:11, letterSpacing:0.7, color:"#444", textTransform:"uppercase" }}>
            {match.sport} | {match.league}
          </span>
        </div>
        <div>
          {isLive ? <LiveBadge /> : (
            <span style={{
              fontSize:11, color:statusOpt.color, fontWeight:600,
              background:statusOpt.bg, padding:"2px 8px", borderRadius:20
            }}>
              {match.status === "finished" ? "FT" : formatDate(match.matchDate)}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", gap:8 }}>
        {/* Home */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <div style={{
            width:50, height:50, borderRadius:"50%", background:"#f5f5f5",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, overflow:"hidden"
          }}>
            {match.homeLogo
              ? <img src={match.homeLogo} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}
                  onError={handleImgError} />
              : match.homeTeam?.[0] || "?"}
          </div>
          <span style={{ fontSize:12, fontWeight:600, textAlign:"center", color:"#1a1a1a", lineHeight:1.3, maxWidth:80 }}>
            {match.homeTeam}
          </span>
          {(isLive || match.status === "finished") && match.homeScore != null && (
            <span style={{ fontSize:24, fontWeight:900, color:"#111" }}>{String(match.homeScore)}</span>
          )}
        </div>

        {/* Center */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:800, color:"#bbb", letterSpacing:2 }}>VS</span>
          {hasStream && (
            <div style={{
              background: isLive ? "#ef4444" : "#1a73e8",
              borderRadius:"50%", width:38, height:38,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: isLive ? "0 0 14px rgba(239,68,68,0.5)" : "0 2px 8px rgba(26,115,232,0.4)"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <div style={{
            width:50, height:50, borderRadius:"50%", background:"#f5f5f5",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, overflow:"hidden"
          }}>
            {match.awayLogo
              ? <img src={match.awayLogo} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}
                  onError={handleImgError} />
              : match.awayTeam?.[0] || "?"}
          </div>
          <span style={{ fontSize:12, fontWeight:600, textAlign:"center", color:"#1a1a1a", lineHeight:1.3, maxWidth:80 }}>
            {match.awayTeam}
          </span>
          {(isLive || match.status === "finished") && match.awayScore != null && (
            <span style={{ fontSize:24, fontWeight:900, color:"#111" }}>{String(match.awayScore)}</span>
          )}
        </div>
      </div>

      {/* Watch Strip */}
      {hasStream && (
        <div style={{
          padding:"8px 16px",
          background: isLive ? "linear-gradient(90deg,#ff6b6b10,#ef444415)" : "#f8faff",
          borderTop:`1px solid ${isLive ? "#fee2e2" : "#e8f0fe"}`,
          textAlign:"center"
        }}>
          <span style={{ fontSize:12, fontWeight:700, color: isLive ? "#ef4444" : "#1a73e8" }}>
            {isLive ? "▶ Watch Live Now" : "📺 Watch Stream"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── WATCH PAGE ───────────────────────────────────────────────
function WatchPage({ match, onBack }: { match: Match, onBack: () => void }) {
  const streams: Stream[] = match.streams?.length
    ? match.streams
    : match.streamLink
    ? [{ url: match.streamLink, label: "Main Stream", type: 'auto' }]
    : [];

  return (
    <div style={{ animation:"slideUp 0.25s ease" }}>
      <button onClick={onBack} style={{
        display:"flex", alignItems:"center", gap:6,
        background:"none", border:"none", color:"#1a73e8",
        fontWeight:700, fontSize:14, cursor:"pointer",
        padding:"10px 0", marginBottom:10, fontFamily:"inherit"
      }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to matches
      </button>

      <VideoPlayer
        streams={streams}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeScore={String(match.homeScore)}
        awayScore={String(match.awayScore)}
        isLive={match.status === "live"}
      />

      {/* Match Info Card */}
      <div style={{
        background:"#fff", borderRadius:12, padding:"16px",
        marginTop:12, boxShadow:"0 1px 6px rgba(0,0,0,0.07)"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
          <span style={{ fontSize:16 }}>{sportEmoji[(match.sport||"").toLowerCase()] || "🏆"}</span>
          <span style={{ fontWeight:700, fontSize:12, color:"#666", textTransform:"uppercase", letterSpacing:0.6 }}>
            {match.sport} · {match.league}
          </span>
        </div>
        <div style={{ fontWeight:800, fontSize:18, color:"#111" }}>
          {match.homeTeam} <span style={{ color:"#bbb", fontWeight:400 }}>vs</span> {match.awayTeam}
        </div>
        {match.matchDate && (
          <div style={{ fontSize:13, color:"#888", marginTop:4 }}>
            🕐 {formatDate(match.matchDate)}
          </div>
        )}
        {match.status === "live" && match.homeScore != null && (
          <div style={{ marginTop:8, fontSize:22, fontWeight:900, color:"#ef4444" }}>
            {String(match.homeScore)} – {String(match.awayScore)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function FalconSports() {
  const [matches, setMatches]   = useState<Match[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bannerAds, setBannerAds] = useState<Ad[]>([]);
  const [carouselAds, setCarouselAds] = useState<Ad[]>([]);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [watching, setWatching] = useState<Match | null>(null);
  const [activePage, setActivePage] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const totalRef = doc(db, "visits", "total");
    const dailyRef = doc(db, "visits", today);

    setDoc(totalRef, { count: increment(1) }, { merge: true });
    setDoc(dailyRef, { count: increment(1) }, { merge: true });

    const q = query(collection(db, "matches"), orderBy("matchDate", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Match)));
      setLoading(false);
    }, () => setLoading(false));

    const qPages = query(collection(db, "pages"), orderBy("title", "asc"));
    const unsubPages = onSnapshot(qPages, snap => setPages(snap.docs.map(d => ({ id: d.id, ...d.data() } as PageData))));

    const qMenu = query(collection(db, "menu"), orderBy("label"));
    const unsubMenu = onSnapshot(qMenu, snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem))));

    const unsubBanner = onSnapshot(query(collection(db, "bannerAds")), snap => {
        setBannerAds(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad)));
    });
    const unsubCarousel = onSnapshot(query(collection(db, "carouselAds"), orderBy("createdAt", "asc")), snap => {
        setCarouselAds(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad)));
    });

    return () => { unsub(); unsubPages(); unsubMenu(); unsubBanner(); unsubCarousel(); };
  }, []);

  const handleBack = () => {
    setWatching(null);
    setActivePage(null);
  };

  const tabs = [
    { key:"all",      label:"All" },
    { key:"live",     label:"🔴 Live" },
    { key:"upcoming", label:"Upcoming" },
    { key:"recent",   label:"Recent" },
  ];

  const filtered = matches.filter(m => {
    if (filter === "live")     return m.status === "live";
    if (filter === "upcoming") return m.status === "upcoming";
    if (filter === "recent")   return m.status === "finished";
    return true;
  });

  const liveCount = matches.filter(m => m.status === "live").length;
  const currentView = activePage ? 'page' : watching ? 'watching' : 'home';
  
  const socialAndAds: (SocialLink | Ad)[] = [
    { name:"WhatsApp", color:"#25D366", btn:"Follow", emoji:"💬", link:"#" },
    ...bannerAds.map(ad => ({ ...ad, type: 'ad' as const })),
    { name:"Telegram", color:"#2CA5E0", btn:"Join",   emoji:"✈️", link:"#" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; background:#f0f2f5; }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(1.4); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        input[type=range] { -webkit-appearance:none; height:4px; border-radius:2px; outline:none; background:rgba(255,255,255,0.25); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#ef4444; cursor:pointer; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#f0f2f5" }}>

        {/* NAVBAR */}
        <nav style={{ background:"#fff", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 10px rgba(0,0,0,0.08)" }}>
          <div style={{ maxWidth:700, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px" }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              width:36, height:36, borderRadius:9, background:"#1a73e8",
              color:"#fff", border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              {menuOpen
                ? <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>}
            </button>

            <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:22, letterSpacing:1, cursor:"pointer" }}
              onClick={handleBack}>
              <span style={{ color:"#e53e3e" }}>TOFFETV</span>
              <span style={{ color:"#1a73e8" }}>LIVE</span>
              {liveCount > 0 && (
                <span style={{
                  marginLeft:8, background:"#ef4444", color:"#fff",
                  fontSize:10, fontWeight:700, padding:"2px 7px",
                  borderRadius:10, verticalAlign:"middle"
                }}>{liveCount} LIVE</span>
              )}
            </div>

            <div style={{ width:36 }} />
          </div>
        </nav>

        {/* SIDE MENU */}
        {menuOpen && (
          <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.55)", animation:"fadeIn 0.2s" }}
            onClick={() => setMenuOpen(false)}>
            <div style={{ width:260, height:"100%", background:"#fff", padding:"24px 20px" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:20, marginBottom:24 }}>
                <span style={{ color:"#e53e3e" }}>TOFFE</span><span style={{ color:"#1a73e8" }}>TVLIVE</span>
              </div>
              {menuItems.map(item => (
                <a href={item.url} key={item.id} onClick={() => setMenuOpen(false)} style={{
                  padding:"13px 0", borderBottom:"1px solid #f0f0f0",
                  fontWeight:600, color:"#333", cursor:"pointer", fontSize:15, textDecoration: 'none', display: 'block'
                }}>{item.label}</a>
              ))}
            </div>
          </div>
        )}

        <div style={{ maxWidth:700, margin:"0 auto", padding:"14px 12px" }}>
          {currentView === 'watching' && watching && <WatchPage match={watching} onBack={handleBack} />}
          {currentView === 'page' && activePage && <Page pageSlug={activePage} onBack={handleBack} />}
          {currentView === 'home' && (
            <>
            <Carousel slides={carouselAds} />
              {/* Social Banners & Ads */}
              {socialAndAds.map((s, i) => (
                <div key={i} style={{
                  background:"#fff", borderRadius:10, padding: s.type === 'ad' ? 0 : "11px 16px",
                  marginBottom:8, boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                  display:"block", overflow: 'hidden'
                }}>
                    {s.type === 'ad' ? (
                        <a href={s.linkUrl} target="_blank" rel="noopener noreferrer">
                            <img src={s.imageUrl} alt="Advertisement" style={{ width: '100%', display: 'block' }} />
                        </a>
                    ) : (
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <span style={{ fontSize:18 }}>{s.emoji}</span>
                                <span style={{ fontWeight:700, fontSize:14, color:"#333" }}>{s.name}</span>
                            </div>
                            <a href={s.link} style={{
                                background:s.color, color:"#fff", padding:"6px 18px",
                                borderRadius:20, textDecoration:"none", fontWeight:700, fontSize:13
                            }}>{s.btn}</a>
                        </div>
                    )}
                </div>
              ))}

              {/* Filter Tabs */}
              <div style={{
                background:"#fff", borderRadius:10, padding:5,
                marginBottom:14, marginTop:6, boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                display:"flex", gap:3
              }}>
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                    flex:1, padding:"8px 4px", borderRadius:7,
                    fontWeight:700, fontSize:12, border:"none", cursor:"pointer",
                    background: filter===tab.key ? "#1a73e8" : "transparent",
                    color: filter===tab.key ? "#fff" : "#666",
                    transition:"all 0.18s", fontFamily:"inherit"
                  }}>{tab.label}</button>
                ))}
              </div>

              {/* Match List */}
              {loading ? (
                <div style={{ textAlign:"center", padding:48, color:"#bbb" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>⚽</div>
                  <div style={{ fontWeight:600 }}>Loading matches...</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:44, background:"#fff", borderRadius:14, color:"#aaa" }}>
                  <div style={{ fontSize:44 }}>🏟️</div>
                  <div style={{ fontWeight:700, marginTop:10 }}>No matches found</div>
                </div>
              ) : (
                filtered.map(match => (
                  <MatchCard key={match.id} match={match} onClick={setWatching} />
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer style={{
          background: "linear-gradient(to right, #0f172a, #1e293b)",
          color: "#94a3b8",
          padding: "48px 16px",
          textAlign: "center",
          marginTop: 40,
          borderTop: "1px solid #334155"
        }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 24,
              letterSpacing: 1,
              marginBottom: 16
            }}>
              <span style={{ color: "#e53e3e" }}>TOFFETV</span>
              <span style={{ color: "#4da6ff" }}>LIVE</span>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "24px",
              flexWrap: "wrap",
              marginBottom: 24
            }}>
              {pages.map(p => (
                <a key={p.id} href="#" onClick={(e) => { e.preventDefault(); setActivePage(p.id); }} style={{
                  color: "#cbd5e1",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "color 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "#fff"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "#cbd5e1"}
                >{p.title}</a>
              ))}
            </div>
            <div style={{
              fontSize: 13,
              color: "#64748b",
              borderTop: "1px solid #334155",
              paddingTop: 24,
              marginTop: 24
            }}>
              © {new Date().getFullYear()} TOFFETV LIVE. All Rights Reserved. <br />
              <span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                This site does not store any files on our server, we only share links to 3rd party services.
              </span>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                marginTop: 24,
                background: "#334155",
                color: "#cbd5e1",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "background 0.2s"
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#475569"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#334155"}
            >
              Back to Top
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
