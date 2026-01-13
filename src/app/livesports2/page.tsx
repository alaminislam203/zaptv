"use client";
import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";

// 1. Firebase imports
import { 
  collection, onSnapshot, addDoc, doc, 
  runTransaction 
} from "firebase/firestore";
import { 
  ref, onValue, off, set, onDisconnect, serverTimestamp 
} from "firebase/database";

import { db, rtdb } from "../firebase"; // Ensure firebase.ts path is correct
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

// --- Loading Component ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-[#050b14] flex items-center justify-center flex-col gap-3 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent animate-shimmer"></div>
    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin z-10"></div>
    <span className="text-xs text-cyan-400 font-mono animate-pulse z-10">Loading Stream...</span>
  </div>
);

// --- Dynamic Player Imports ---
const PlyrPlayer = dynamic(() => import("../../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const VideoJSPlayer = dynamic(() => import("../../../components/VideoJSPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const ShakaPlayer = dynamic(() => import("../../../components/ShakaPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const IframePlayer = dynamic(() => import("../../../components/IframePlayer"), { ssr: false });
const PlayerJSPlayer = dynamic(() => import("../../../components/PlayerJSPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

// --- Interfaces ---
interface DrmConfig { type: "clearkey" | "widevine"; keyId?: string; key?: string; licenseUrl?: string; }
interface Source { label: string; url: string; drm?: DrmConfig; }
interface Channel { id: string; name: string; logo: string; is_embed: boolean | string; category?: string; sources: Source[]; }
interface AdData { id: string; location: "top" | "middle"; imageUrl?: string; text?: string; link?: string; }

// --- M3U Parser Function ---
const parseM3U = (content: string): Channel[] => {
  const lines = content.split('\n');
  const result: Channel[] = [];
  
  let currentName = "";
  let currentLogo = "";
  let currentCategory = "";

  lines.forEach((line, index) => {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      currentLogo = logoMatch ? logoMatch[1] : "";
      
      const groupMatch = line.match(/group-title="([^"]*)"/);
      currentCategory = groupMatch ? groupMatch[1] : "Others";
      
      const nameParts = line.split(',');
      currentName = nameParts[nameParts.length - 1].trim();

    } else if (line.length > 0 && !line.startsWith('#')) {
      if (currentName) {
        result.push({
          id: `m3u-${index}`,
          name: currentName,
          logo: currentLogo,
          category: currentCategory,
          is_embed: false,
          sources: [{ label: "Stream 1", url: line }]
        });
        currentName = "";
        currentLogo = "";
      }
    }
  });
  return result;
};

// --- Main Content Component ---
function LiveTVContent() {
  const searchParams = useSearchParams();

  // Data States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [activeDirectLink, setActiveDirectLink] = useState<{url: string, label: string} | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideReported, setHideReported] = useState(false);
  const [reportedChannelNames, setReportedChannelNames] = useState<Set<string>>(new Set());

  // Player States
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [playerType, setPlayerType] = useState<"plyr" | "videojs" | "native" | "playerjs">("plyr");
  const [isClient, setIsClient] = useState(false);
  const scriptsLoaded = useRef(false);
  const [totalChannels, setTotalChannels] = useState(0);

  // --- Computed Categories ---
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(channels.map(ch => ch.category || "Others")));
    return ["All", ...uniqueCats.sort()];
  }, [channels]);

  // --- Filter Logic ---
  const filteredChannels = useMemo(() => {
      return channels.filter(ch => {
        const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || ch.category === selectedCategory;
        const matchesStatus = hideReported ? !reportedChannelNames.has(ch.name) : true;
        return matchesSearch && matchesCategory && matchesStatus;
      });
  }, [channels, searchQuery, selectedCategory, hideReported, reportedChannelNames]);

  // --- Auto Play from URL ---
  useEffect(() => {
    const channelNameFromUrl = searchParams.get("play");
    if (channelNameFromUrl && channels.length > 0) {
        const target = channels.find(ch => ch.name.toLowerCase() === channelNameFromUrl.toLowerCase() || ch.id === channelNameFromUrl);
        if (target) {
            setCurrentChannel(target);
        }
    }
  }, [channels, searchParams]);

  // --- Initialization ---
  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    setPlayerType("plyr");
    setActiveSourceIndex(0);
    if(currentChannel) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      checkIfFavorite(currentChannel.id);
    }
  }, [currentChannel]);

  // --- Security: Prevent Inspector ---
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I") || (e.ctrlKey && e.key === "u")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchPlaylist = async () => {
      const PLAYLIST_URL = "https://raw.githubusercontent.com/alaminislam203/my_playlist/refs/heads/main/dash.json"; 
      
      try {
        setLoading(true);
        const response = await fetch(PLAYLIST_URL);
        if (!response.ok) throw new Error("Failed to fetch playlist");
        
        const rawText = await response.text();
        let parsedChannels: Channel[] = [];

        try {
            // Try JSON
            const jsonData = JSON.parse(rawText);
            if (Array.isArray(jsonData)) {
                parsedChannels = jsonData.map((item: any, idx: number) => ({
                    id: item.id || `json-${idx}`,
                    name: item.name || "Unknown",
                    logo: item.logo || "",
                    category: item.category || "Others",
                    is_embed: item.is_embed || false,
                    sources: item.sources || [{ label: "Stream 1", url: item.url, drm: item.drm }] 
                }));
            }
        } catch (e) {
            // Fallback M3U
            parsedChannels = parseM3U(rawText);
        }
        
        setChannels(parsedChannels);
        setTotalChannels(parsedChannels.length);
        setLoading(false);

      } catch (error) {
        console.error("Error loading playlist:", error);
        setLoading(false);
      }
    };

    fetchPlaylist();

    // Firebase Listeners
    const unsubAds = onSnapshot(collection(db, "ads"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AdData[];
      setAds(list);
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSiteConfig(docSnap.data());
    });
    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportedSet = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === "pending" && data.channelName) {
            reportedSet.add(data.channelName);
        }
      });
      setReportedChannelNames(reportedSet);
    });

    return () => { unsubAds(); unsubSettings(); unsubReports(); };
  }, []);

  // --- Realtime Visitors & Adblock ---
  useEffect(() => {
    if (!isClient) return;

    // Visitor Counter
    const counterRef = doc(db, 'counters', 'visitors');
    const incrementTotalVisitors = async () => {
        if (!sessionStorage.getItem('visitedThisSession')) {
            sessionStorage.setItem('visitedThisSession', 'true');
            try {
                await runTransaction(db, async (transaction) => {
                    const docSnap = await transaction.get(counterRef);
                    if (!docSnap.exists()) { transaction.set(counterRef, { total: 1 }); setTotalVisitors(1); } 
                    else { transaction.update(counterRef, { total: docSnap.data().total + 1 }); setTotalVisitors(docSnap.data().total + 1); }
                });
            } catch (e) { console.error(e); }
        }
    };
    onSnapshot(counterRef, (doc) => { if (doc.exists()) setTotalVisitors(doc.data().total); });
    incrementTotalVisitors();
    
    // Online Users
    const myConnectionsRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    const connectedRef = ref(rtdb, '.info/connected');
    const statusRef = ref(rtdb, 'status');
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            set(myConnectionsRef, { timestamp: serverTimestamp() });
            onDisconnect(myConnectionsRef).remove();
        }
    });
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));

    // Direct Links
    if (siteConfig?.directLinks && Array.isArray(siteConfig.directLinks)) {
        setActiveDirectLink(siteConfig.directLinks[Math.floor(Math.random() * siteConfig.directLinks.length)]);
    }

    // Adblock & Ads Script
    if (!scriptsLoaded.current) {
        setTimeout(async () => {
             let adBlockEnabled = false;
             try { await fetch(new Request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors' })); } catch (e) { adBlockEnabled = true; }
             if (adBlockEnabled) {
                 const modal = document.createElement('div');
                 modal.innerHTML = `<div style='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:99999;display:flex;justify-content:center;align-items:center;flex-direction:column;backdrop-filter:blur(5px);color:#fff;text-align:center;'><h2 style='color:#ef4444;margin-bottom:10px;font-size:24px;font-weight:bold;'>Adblock Detected!</h2><p style='font-size:16px;'>Please disable your adblocker to keep our site free.</p><button onclick='location.reload()' style='background:#ef4444;color:white;border:none;padding:10px 20px;margin-top:15px;cursor:pointer;border-radius:5px;font-weight:bold;'>Refresh Page</button></div>`;
                 document.body.appendChild(modal);
             }
        }, 2000);

        if (siteConfig?.enablePopunder === true) {
            const adScript = document.createElement('script');
            adScript.dataset.zone = '10282293';
            adScript.src = 'https://al5sm.com/tag.min.js';
            document.documentElement.appendChild(adScript);
        }
    }
    scriptsLoaded.current = true;

  }, [isClient, siteConfig]);

  // --- Handlers ---
  const checkIfFavorite = (id: string) => setIsFavorite(JSON.parse(localStorage.getItem("favorites") || '[]').some((c: Channel) => c.id === id));
  
  const toggleFavorite = () => {
    if (!currentChannel) return;
    let favs = JSON.parse(localStorage.getItem("favorites") || '[]');
    if (isFavorite) favs = favs.filter((c: Channel) => c.id !== currentChannel.id);
    else favs.push(currentChannel);
    localStorage.setItem("favorites", JSON.stringify(favs));
    checkIfFavorite(currentChannel.id);
  };

  const handleReport = async () => {
    if (!currentChannel) return;
    if (confirm(`Report "${currentChannel.name}"?`)) {
      try {
        await addDoc(collection(db, "reports"), { 
            channelName: currentChannel.name, 
            channelId: currentChannel.id, 
            sourceLabel: currentChannel.sources[activeSourceIndex]?.label || "Default", 
            timestamp: new Date(), 
            status: "pending", 
            issue: "Stream not working" 
        });
        alert("Report submitted.");
      } catch (e) { console.error(e); }
    }
  };

  const getAd = (loc: "top" | "middle") => ads.find(ad => ad.location === loc);
  const topAd = getAd("top");
  const middleAd = getAd("middle");

  // --- Render Player ---
  const renderPlayer = () => {
    if (!isClient) return <LoadingPlayer />;
    if (!currentChannel) return <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-[#020617]"><p className="text-xl font-bold tracking-widest animate-pulse opacity-50">SELECT A CHANNEL</p></div>;
    if (!currentChannel.sources?.length) return <div className="text-white flex justify-center items-center h-full">No Source Available</div>;

    const activeSource = currentChannel.sources[activeSourceIndex];
    const { url, drm } = activeSource;
    
    if (currentChannel.is_embed) return <IframePlayer src={url} />;
    if (url.includes(".mpd") || drm) return <ShakaPlayer src={url} drm={drm} />;
    
    if (url.includes(".m3u8")) {
      switch (playerType) {
          case "videojs": return <VideoJSPlayer src={url} />;
          case "native": return <NativePlayer src={url} />;
          case "playerjs": return <PlayerJSPlayer src={url} />;
          default: return <PlyrPlayer src={url} />;
      }
    }
    return <IframePlayer src={url} />;
  };

  // --- Maintenance Mode ---
  if (siteConfig?.maintenanceMode === true) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-white">
          <div className="max-w-md w-full text-center bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
            <h1 className="text-3xl font-bold tracking-wide text-white mb-2">Site Under Maintenance</h1>
            <p className="text-gray-400">We are upgrading our servers. Be back soon!</p>
          </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-gray-200 font-sans pb-10 select-none">
      <header className="sticky top-0 z-50 bg-[#0b1120]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div onClick={() => setCurrentChannel(null)} className="flex items-center gap-2 cursor-pointer select-none">
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    <span className="text-white">Toffee</span><span className="text-cyan-500">Live</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold tracking-wider text-red-400">LIVE</span>
                </div>
                <Link href="/admin"><button className="text-xs font-bold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition">Login</button></Link>
            </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-2 md:px-4 mt-4 space-y-4">
        
        {/* Marquee */}
        <div className="bg-[#0f172a] border border-gray-800 rounded-lg h-9 flex items-center overflow-hidden relative shadow-lg">
          <div className="absolute left-0 top-0 h-full w-1 bg-cyan-500"></div>
          <div className="flex items-center whitespace-nowrap animate-marquee pl-6">
            <span className="text-xs sm:text-sm text-gray-300 font-mono tracking-wide">📢 {siteConfig.marqueeText || "Welcome to ToffeeLive — Please disable adblocker to support free streaming."}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div className="bg-[#1e293b] border border-gray-700/50 rounded-lg px-4 py-3 flex items-center justify-between gap-2 shadow-md">
                <span className="text-xs text-gray-300 font-bold">Join Telegram</span>
                <Link href="https://t.me/toffeepro"><button className="text-[10px] font-bold bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-white transition">JOIN</button></Link>
            </div>
            <div className="bg-[#1e293b] border border-gray-700/50 rounded-lg px-4 py-3 flex items-center justify-between gap-2 shadow-md">
                <span className="text-xs text-gray-300 font-bold">More Channels</span>
                <Link href="#"><button className="text-[10px] font-bold bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded text-white transition">VISIT</button></Link>
            </div>
            <div className="bg-[#1e293b] border border-gray-700/50 rounded-lg px-4 py-3 flex items-center justify-between gap-2 shadow-md">
                <span className="text-xs text-gray-300 font-bold">Support Us</span>
                <Link href="#"><button className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-white transition">DONATE</button></Link>
            </div>
        </div>

        {/* --- STRICT WARNING SECTION (GAMBLING & ADULT) --- */}
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 flex gap-4 items-start animate-pulse-slow">
            <div className="shrink-0 text-red-500 p-2 bg-red-500/10 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
                <h3 className="text-red-500 font-extrabold text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
                   ⚠️ সতর্কতা (Warning)
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed text-justify">
                   এই সাইটে প্রদর্শিত বিজ্ঞাপনগুলো <strong>থার্ড-পার্টি</strong> দ্বারা নিয়ন্ত্রিত। এখানে মাঝে মাঝে <strong>জুয়া (Gambling/Betting)</strong> অথবা <strong>অশ্লীল/এডাল্ট (18+)</strong> বিজ্ঞাপন আসতে পারে। আমরা এগুলো সমর্থন করি না। দয়া করে এসব বিজ্ঞাপনে ক্লিক করা থেকে বিরত থাকুন এবং নিজ দায়িত্বে এড়িয়ে চলুন।
                </p>
            </div>
        </div>

        {topAd && (
          <div className="w-full min-h-[60px] bg-[#020617] rounded-lg flex flex-col items-center justify-center overflow-hidden border border-gray-800 relative group animate-fadeIn">
            <span className="absolute top-0 right-0 bg-gray-800 text-[8px] px-1.5 py-0.5 text-gray-400 rounded-bl">Ad</span>
            {topAd.imageUrl ? <a href={topAd.link || "#"} target="_blank" className="w-full"><img src={topAd.imageUrl} alt="Ad" className="w-full h-auto object-contain max-h-32" /></a> : <div className="text-center p-2 text-cyan-500 font-bold text-sm">{topAd.text}</div>}
          </div>
        )}

        {/* Main Player Container */}
        <div className="bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
          <div className="aspect-video w-full bg-black relative group">
            <div key={`${currentChannel?.id}-${activeSourceIndex}-${playerType}`} className="w-full h-full">{renderPlayer()}</div>
          </div>
          
          <div className="bg-[#1e293b] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-gray-700/50">
            {currentChannel?.sources[activeSourceIndex]?.url.includes(".m3u8") && !currentChannel.is_embed && (
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                  <span className="text-gray-500 font-bold uppercase hidden sm:block">Engine:</span>
                  {["plyr", "videojs", "native", "playerjs"].map((type) => (
                      <button key={type} onClick={() => setPlayerType(type as any)} className={`px-3 py-1 rounded font-bold uppercase tracking-wider border transition ${playerType === type ? "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"}`}>{type}</button>
                  ))}
                </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => document.querySelector("video")?.requestPictureInPicture()} className="p-2 rounded bg-gray-700/50 hover:bg-gray-700 hover:text-white transition" title="PiP"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><rect x="12" y="13" width="7" height="6"></rect></svg></button>
              <button onClick={toggleFavorite} className={`p-2 rounded bg-gray-700/50 hover:bg-gray-700 transition ${isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-400"}`} title="Favorite"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>
              <button onClick={handleReport} className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition font-bold" title="Report">⚠ <span className="hidden sm:inline">Report</span></button>
            </div>
          </div>
        </div>

        {/* Direct Link Button */}
        {activeDirectLink && (
            <div className="flex justify-center mt-6">
                <a href={activeDirectLink.url} target="_blank" rel="noopener noreferrer" className="group relative inline-flex items-center gap-2 rounded-full px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-in-out"></div>
                    <span className="relative tracking-wide">{activeDirectLink.label}</span>
                </a>
            </div>
        )}

        {/* Channel Info */}
        <div className="bg-[#1e293b] p-5 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-center gap-5 shadow-lg">
           <div className="w-16 h-16 rounded-full bg-[#020617] border-2 border-gray-600 p-1 flex-shrink-0 relative">
                {currentChannel?.logo ? <img src={currentChannel.logo} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📺</div>}
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#1e293b] ${currentChannel ? "bg-green-500" : "bg-gray-500"}`}></div>
           </div>
           <div className="flex-1 text-center sm:text-left">
             <h2 className="text-xl font-bold text-white">{currentChannel?.name || "No Channel Selected"}</h2>
             <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                {currentChannel && reportedChannelNames.has(currentChannel.name) ? (
                    <span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 flex items-center gap-1">⚠ Unstable</span>
                ) : (
                    <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 flex items-center gap-1">● Online</span>
                )}
                {currentChannel?.category && <span className="text-[10px] font-bold bg-gray-700 text-gray-300 px-2 py-1 rounded">{currentChannel.category}</span>}
             </div>
           </div>
           {currentChannel && currentChannel.sources.length > 1 && (
             <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
               {currentChannel.sources.map((src, idx) => <button key={idx} onClick={() => setActiveSourceIndex(idx)} className={`text-xs px-3 py-1.5 rounded font-bold border transition-all ${activeSourceIndex === idx ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300"}`}>{src.label || `Server ${idx+1}`}</button>)}
             </div>
           )}
        </div>

        {middleAd && <div className="w-full min-h-[50px] bg-[#1e293b] rounded flex flex-col items-center justify-center overflow-hidden border border-gray-800 relative mt-2"><span className="absolute top-0 right-0 bg-gray-700 text-[8px] px-1 text-white">Ad</span>{middleAd.imageUrl ? <a href={middleAd.link || "#"} target="_blank" className="w-full"><img src={middleAd.imageUrl} alt="Ad" className="w-full h-auto object-cover max-h-24" /></a> : <div className="text-center p-2 text-gray-300 text-xs">{middleAd.text}</div>}</div>}

        {/* Channel Grid Section */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800 shadow-xl">
          
          <div className="mb-6 relative">
            <input type="text" placeholder="Search channels..." className="w-full bg-[#1f2937] text-white text-sm px-4 py-3 pl-10 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <span className="absolute left-3 top-3 text-gray-500">🔍</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar w-full sm:w-auto">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === cat ? "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-[#1f2937] border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                    {cat}
                  </button>
                ))}
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer bg-[#1f2937] px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition select-none flex-shrink-0">
                  <div className="relative">
                      <input type="checkbox" className="sr-only" checked={hideReported} onChange={(e) => setHideReported(e.target.checked)} />
                      <div className={`w-9 h-5 rounded-full shadow-inner transition ${hideReported ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                      <div className={`dot absolute w-3 h-3 bg-white rounded-full shadow left-1 top-1 transition transform ${hideReported ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs text-gray-300 font-bold whitespace-nowrap">Stable Only</span>
              </label>
          </div>

          {loading ? (
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 animate-pulse">
                {[...Array(12)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl"></div>)}
             </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredChannels.length > 0 ? (
                filteredChannels.map(ch => {
                  const isReported = reportedChannelNames.has(ch.name);
                  return (
                    <div key={ch.id} onClick={() => setCurrentChannel(ch)} className={`group relative flex flex-col items-center gap-2 cursor-pointer p-3 rounded-xl transition-all border ${currentChannel?.id === ch.id ? "bg-[#1e293b] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "bg-[#1f2937]/50 border-gray-800 hover:bg-[#1f2937] hover:border-gray-600 hover:-translate-y-1"}`}>
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full z-10 ${isReported ? "bg-red-500 animate-pulse shadow-[0_0_8px_red]" : "bg-green-500"}`}></div>
                        <div className="w-12 h-12 bg-[#0b1120] rounded-full p-1.5 overflow-hidden shadow-inner relative ring-1 ring-white/5">
                        {ch.logo ? <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain transition-transform group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 font-bold">TV</div>}
                        </div>
                        <span className={`text-[10px] font-bold text-center line-clamp-1 w-full ${currentChannel?.id === ch.id ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-200"}`}>{ch.name}</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-10 text-gray-500 text-sm font-mono">No channels found.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-[#1e293b] rounded-xl p-5 border border-gray-800 flex flex-col items-center justify-center mb-8 space-y-4 shadow-lg">
            <div className="flex items-center justify-center gap-8 md:gap-16 w-full">
                <div className="text-center"><p className="font-black text-xl text-green-400 tabular-nums">{onlineUsers}</p><p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Online</p></div>
                <div className="border-l border-gray-700 h-8"></div>
                <div className="text-center"><p className="font-black text-xl text-cyan-400 tabular-nums">{totalVisitors}</p><p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Visits</p></div>
              <div className="border-l border-gray-700 h-8"></div>
               <div className="text-center"><p className="font-black text-xl text-purple-400 tabular-nums">{totalChannels}</p><p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Channels</p></div>
            </div>
            <div className="w-full h-px bg-gray-800"></div>
            <div className="text-[10px] text-gray-500 text-center font-medium">&copy; 2026 ToffeePro Streaming. Use responsibly.</div>
        </div>
      </div>
    </main>
  );
}

// --- Default Export wrapped in Suspense ---
export default function Home() {
  return (
    <Suspense fallback={<LoadingPlayer />}>
      <LiveTVContent />
    </Suspense>
  );
}
