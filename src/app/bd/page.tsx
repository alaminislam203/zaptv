"use client";
import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { 
  collection, onSnapshot, addDoc, doc, 
  runTransaction 
} from "firebase/firestore";
import { 
  ref, onValue, off, set, onDisconnect, serverTimestamp 
} from "firebase/database";
import { db, rtdb } from "../firebase"; 
import Link from "next/link";
import { useSearchParams } from "next/navigation"; 
import dynamic from "next/dynamic";
import Image from "next/image";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-[#050b14] flex items-center justify-center flex-col gap-3 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent animate-shimmer"></div>
    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin z-10"></div>
    <span className="text-xs text-cyan-400 font-mono animate-pulse z-10">Initializing Stream...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const VideoJSPlayer = dynamic(() => import("../../../components/VideoJSPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const ShakaPlayer = dynamic(() => import("../../../components/ShakaPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const IframePlayer = dynamic(() => import("../../../components/IframePlayer"), { ssr: false });
const PlayerJSPlayer = dynamic(() => import("../../../components/PlayerJSPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

// --- INTERFACES ---
interface DrmConfig { type: "clearkey" | "widevine"; keyId?: string; key?: string; licenseUrl?: string; }
interface Source { label: string; url: string; drm?: DrmConfig; status?: "online" | "offline" | "checking" | "unknown"; }
interface Channel { id: string; name: string; logo: string; is_embed: boolean | string; category?: string; sources: Source[]; }
interface AdData { id: string; location: "top" | "middle"; imageUrl?: string; text?: string; link?: string; }

// --- ICONS ---
const Icons = {
    Play: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Heart: ({ filled }: { filled: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${filled ? "text-red-500 fill-current" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    Share: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
    Report: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Server: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
    Tv: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Shield: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
};

function LiveTVContent() {
  const searchParams = useSearchParams();

  // Data States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [activeDirectLink, setActiveDirectLink] = useState<{url: string, label: string} | null>(null);

  // Player & User States
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [playerType, setPlayerType] = useState<"plyr" | "videojs" | "native" | "playerjs">("plyr");
  const [isClient, setIsClient] = useState(false);
  const scriptsLoaded = useRef(false);
  const [totalChannels, setTotalChannels] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  // Ad Rotation State
  const [adIndex, setAdIndex] = useState(0);

  // Infinite Scroll
  const [visibleCount, setVisibleCount] = useState(48);

  // --- LOGIC: AD ROTATION ---
  useEffect(() => {
    const interval = setInterval(() => {
        setAdIndex((prev) => prev + 1);
    }, 5000); // 5 Seconds Rotation
    return () => clearInterval(interval);
  }, []);

  const topAds = ads.filter(ad => ad.location === "top");
  const middleAds = ads.filter(ad => ad.location === "middle");

  const currentTopAd = topAds.length > 0 ? topAds[adIndex % topAds.length] : null;
  const currentMiddleAd = middleAds.length > 0 ? middleAds[adIndex % middleAds.length] : null;

  // --- LOGIC: 4-DIGIT ID GENERATOR ---
  const getShortId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return (Math.abs(hash % 9000) + 1000).toString();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
        if (visibleCount < channels.length) setVisibleCount((prev) => prev + 24);
    }
  };

  // URL Play Logic
  useEffect(() => {
    const channelIdToPlay = searchParams.get("play");
    if (channelIdToPlay && channels.length > 0) {
      // Find by ID or Short ID logic (simplified here to ID/Name)
      const targetChannel = channels.find((ch) => ch.id === channelIdToPlay || ch.name === channelIdToPlay);
      if (targetChannel) setCurrentChannel(targetChannel);
    }
  }, [channels, searchParams]);

  useEffect(() => {
    if (siteConfig?.directLinks && Array.isArray(siteConfig.directLinks) && siteConfig.directLinks.length > 0) {
        setActiveDirectLink(siteConfig.directLinks[Math.floor(Math.random() * siteConfig.directLinks.length)]);
    }
  }, [siteConfig]);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    setPlayerType("plyr");
    setActiveSourceIndex(0);
    if(currentChannel) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      checkIfFavorite(currentChannel.id);
    }
  }, [currentChannel]);

  // Firebase Fetch
  useEffect(() => {
    const unsubChannels = onSnapshot(collection(db, "channels"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Channel[];
      setChannels(list);
      setTotalChannels(snapshot.docs.length);
      setLoading(false);
    });
    const unsubAds = onSnapshot(collection(db, "ads"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AdData[];
      setAds(list);
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSiteConfig(docSnap.data());
    });
    return () => { unsubChannels(); unsubAds(); unsubSettings(); };
  }, []);

  // Stats Logic (Simplified)
  useEffect(() => {
    if (!isClient) return;
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
    const unsub = onSnapshot(counterRef, (doc) => { if (doc.exists()) setTotalVisitors(doc.data().total); });
    incrementTotalVisitors();
    
    const statusRef = ref(rtdb, 'status');
    const connectedRef = ref(rtdb, '.info/connected');
    const myConnectionsRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    onValue(connectedRef, (snap) => { if (snap.val() === true) { set(myConnectionsRef, { timestamp: serverTimestamp() }); onDisconnect(myConnectionsRef).remove(); } });
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));
    return () => { unsub(); off(connectedRef); off(statusRef); onDisconnect(myConnectionsRef).cancel(); set(myConnectionsRef, null); };
  }, [isClient]);

  // Anti-Adblock
  useEffect(() => {
    if (!scriptsLoaded.current) {
      const detectAdBlock = async () => {
          let adBlockEnabled = false;
          try { await fetch(new Request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors' })); } catch (e) { adBlockEnabled = true; }
          if (adBlockEnabled) console.log("Adblock Detected");
      };
      setTimeout(detectAdBlock, 2000);
    }
    scriptsLoaded.current = true;
  }, [siteConfig]);

  const checkIfFavorite = (id: string) => setIsFavorite(JSON.parse(localStorage.getItem("favorites") || '[]').some((c: Channel) => c.id === id));
  
  const toggleFavorite = () => {
    if (!currentChannel) return;
    let favs = JSON.parse(localStorage.getItem("favorites") || '[]');
    if (isFavorite) favs = favs.filter((c: Channel) => c.id !== currentChannel.id);
    else favs.push(currentChannel);
    localStorage.setItem("favorites", JSON.stringify(favs));
    checkIfFavorite(currentChannel.id);
  };

  const handleShare = () => {
    if (!currentChannel) return;
    // URL কপি হবে, কিন্তু ইউজার দেখবে ৪ ডিজিট আইডি কনসেপ্ট
    const url = `${window.location.origin}${window.location.pathname}?play=${currentChannel.id}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleReport = async () => {
    if (!currentChannel) return;
    if (confirm(`Report "${currentChannel.name}"?`)) {
      try {
        await addDoc(collection(db, "reports"), { channelName: currentChannel.name, channelId: currentChannel.id, sourceLabel: currentChannel.sources[activeSourceIndex]?.label || "Default", timestamp: new Date(), status: "pending", issue: "Stream not working" });
        alert("Report submitted! We will check soon.");
      } catch (e) { console.error("Error reporting:", e); }
    }
  };

  const filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const channelsToDisplay = filteredChannels.slice(0, visibleCount);

  const renderPlayer = () => {
    if (!isClient) return <LoadingPlayer />;
    if (!currentChannel) return (
        <div className="flex flex-col items-center justify-center h-full bg-[#050b14] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="z-10 text-center space-y-4 p-6">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-cyan-500/30 animate-pulse">
                    <Icons.Tv />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest">SELECT A CHANNEL</h2>
                <p className="text-gray-500 text-sm">Choose from the list below to start watching</p>
            </div>
        </div>
    );

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

  if (siteConfig?.maintenanceMode === true) {
    return (
      <div className="min-h-screen bg-[#050b14] flex items-center justify-center px-6 text-white">
        <div className="max-w-md w-full text-center bg-[#0f172a] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <h1 className="text-3xl font-bold tracking-wide text-red-500 mb-3">Site Under Maintenance</h1>
            <p className="text-sm text-gray-400">We’re upgrading systems. Please check back shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b14] text-gray-200 font-sans pb-10 select-none selection:bg-cyan-500/30">
      
      {/* --- Header --- */}
      <header className="sticky top-0 z-50 bg-[#050b14]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div onClick={() => setCurrentChannel(null)} className="flex items-center gap-2 cursor-pointer">
                <Icons.Tv />
                <div className="text-xl font-extrabold tracking-tight">
                    <span className="text-white">Toffee</span><span className="text-cyan-400">Pro</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold tracking-wider text-red-400">LIVE</span>
                </div>
                <Link href="/admin">
                    <button className="hidden sm:block text-xs font-bold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition">Login</button>
                </Link>
            </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-2 md:px-4 mt-6 space-y-6">
        
        {/* --- Marquee --- */}
        <div className="bg-[#0f172a] border border-gray-800 rounded-lg h-10 flex items-center overflow-hidden relative shadow-lg">
            <div className="absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-[#0f172a] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#0f172a] to-transparent z-10"></div>
            <div className="flex items-center whitespace-nowrap animate-marquee pl-6">
                <span className="text-sm text-gray-300 font-mono tracking-wide flex items-center gap-2">
                    <span className="text-cyan-400">📢 UPDATE:</span> 
                    {siteConfig.marqueeText || "Welcome to ToffeePro — Please disable adblocker to support free streaming."}
                </span>
            </div>
        </div>
   
        {/* --- Action Buttons Grid --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link href="https://t.me/toffeepro" target="_blank" className="bg-[#1e293b] hover:bg-[#263349] border border-gray-700 p-3 rounded-xl flex items-center justify-between group transition">
                <span className="text-xs text-gray-400">Join Telegram</span>
                <span className="text-blue-400 group-hover:translate-x-1 transition">➔</span>
            </Link>
            <Link href="/livetv" className="bg-[#1e293b] hover:bg-[#263349] border border-gray-700 p-3 rounded-xl flex items-center justify-between group transition">
                <span className="text-xs text-gray-400">New Channels</span>
                <span className="text-green-400 group-hover:translate-x-1 transition">➔</span>
            </Link>
            <Link href="/support" className="col-span-2 md:col-span-1 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 hover:from-cyan-900/30 hover:to-blue-900/30 border border-cyan-500/20 p-3 rounded-xl flex items-center justify-between group transition">
                <span className="text-xs text-cyan-100">Support Us</span>
                <Icons.Heart filled={true} />
            </Link>
        </div>

        {/* --- Gambling Warning (জুয়া বিরোধী সতর্কবার্তা) --- */}
        <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 flex gap-4 items-start">
            <div className="shrink-0 text-red-500 p-1 bg-red-500/10 rounded-full mt-1">
                <Icons.Shield />
            </div>
            <div>
                <h3 className="text-red-400 font-bold text-sm uppercase tracking-wide mb-1">সতর্কবার্তা</h3>
                <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed">
                    এই সাইটটি শুধুমাত্র খেলা দেখার জন্য। আমরা কোনো ধরনের <strong className="text-gray-300">বেটিং (Betting), জুয়া বা প্রেডিকশন</strong> অ্যাপ প্রমোট করি না। খেলার মাঝে কোনো জুয়ার বিজ্ঞাপন আসলে দয়া করে তাতে ক্লিক করবেন না। জুয়া আর্থিক এবং ধর্মীয় উভয়ভাবেই ক্ষতিকর।
                </p>
            </div>
        </div>

        {/* --- TOP AD (ROTATING) --- */}
        {currentTopAd && (
          <div className="w-full h-[100px] sm:h-[120px] bg-[#020617] rounded-xl flex items-center justify-center overflow-hidden border border-gray-800 relative group animate-fadeIn">
            <span className="absolute top-0 right-0 bg-gray-800 text-[9px] px-1.5 py-0.5 text-gray-400 rounded-bl-lg z-20">
                Sponsored {topAds.length > 1 && "⟳"}
            </span>
            {currentTopAd.imageUrl ? (
                <a href={currentTopAd.link || "#"} target="_blank" className="w-full h-full flex items-center justify-center relative">
                    <img src={currentTopAd.imageUrl} alt="Advertisement" className="h-full w-auto object-contain max-w-full transition-opacity duration-500" />
                </a>
            ) : (
                <div className="text-center p-2 text-cyan-600 font-bold opacity-50 text-sm tracking-widest">{currentTopAd.text}</div>
            )}
          </div>
        )}

        {/* --- Main Player Section --- */}
        <div className="bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
            <div className="aspect-video w-full bg-black relative group">
                <div key={`${currentChannel?.id}-${activeSourceIndex}-${playerType}`} className="w-full h-full">
                    {renderPlayer()}
                </div>
            </div>

            <div className="bg-[#1e293b] px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-700">
                {currentChannel && !currentChannel.is_embed && currentChannel.sources[activeSourceIndex]?.url.includes(".m3u8") && (
                   <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        <span className="text-[10px] uppercase font-bold text-gray-500 shrink-0">Engine:</span>
                        {["plyr", "videojs", "native", "playerjs"].map((type) => (
                            <button key={type} onClick={() => setPlayerType(type as any)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition ${playerType === type ? "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"}`}>
                                {type}
                            </button>
                        ))}
                   </div>
                )}
                
                <div className="flex items-center gap-3 ml-auto">
                    <button onClick={handleShare} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-xs font-bold ${shareCopied ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-cyan-400"}`} title="Share ID">
                        {shareCopied ? <Icons.Check /> : <Icons.Share />}
                        <span>{shareCopied ? "Copied" : currentChannel ? `#${getShortId(currentChannel.id)}` : "Share"}</span>
                    </button>
                    <button onClick={toggleFavorite} className={`p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition ${isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-400"}`} title="Favorite">
                        <Icons.Heart filled={isFavorite} />
                    </button>
                    <button onClick={handleReport} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition text-xs font-bold" title="Report Issue">
                        <Icons.Report /> <span>Report</span>
                    </button>
                </div>
            </div>
        </div>

        {/* --- Direct Link Button --- */}
        {activeDirectLink && (
            <div className="flex justify-center">
                <a href={activeDirectLink.url} target="_blank" rel="noopener noreferrer" className="group relative inline-flex items-center gap-2 rounded-full px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-in-out"></div>
                    <Icons.Play />
                    <span>{activeDirectLink.label}</span>
                </a>
            </div>
        )}

        {/* --- Channel Info Card --- */}
        <div className="bg-[#1e293b] p-5 rounded-2xl border border-gray-700 flex flex-col md:flex-row items-center gap-5 md:gap-6 shadow-lg">
           <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#0f172a] border-2 border-gray-600 p-1 flex-shrink-0 relative">
                {currentChannel?.logo ? <img src={currentChannel.logo} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><Icons.Tv /></div>}
                {currentChannel && <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-[#1e293b] rounded-full animate-bounce"></div>}
           </div>
           <div className="flex-1 text-center md:text-left space-y-2">
             <h2 className="text-xl md:text-2xl font-bold text-white">{currentChannel?.name || "No Channel Selected"}</h2>
             <p className="text-xs text-cyan-400 font-mono tracking-wide">{currentChannel ? "● Streaming Live in HD" : "Select a channel to begin"}</p>
             {/* Source Switcher */}
             {currentChannel && currentChannel.sources.length > 1 && (
               <div className="flex gap-2 flex-wrap justify-center md:justify-start mt-2">
                 {currentChannel.sources.map((src, idx) => (
                    <button key={idx} onClick={() => setActiveSourceIndex(idx)} className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded font-bold border transition-all ${activeSourceIndex === idx ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-400"}`}>
                        <Icons.Server /> {src.label || `Server ${idx+1}`}
                    </button>
                 ))}
               </div>
             )}
           </div>
        </div>
        
        {/* --- Instructions / Guide --- */}
        <div className="bg-[#0f172a] rounded-xl p-4 border border-gray-800">
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest border-b border-gray-800 pb-2">Quick Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <p>1. Video লোড না হলে <strong>Server</strong> পরিবর্তন করে দেখুন।</p>
                <p>2. প্লেয়ারে সমস্যা হলে <strong>Engine</strong> (Plyr/Native) চেঞ্জ করুন।</p>
                <p>3. সাউন্ড না আসলে প্লেয়ারে ট্যাপ করে <strong>Unmute</strong> করুন।</p>
                <p>4. বাফারিং এড়াতে ইন্টারনেট স্পিড চেক করুন।</p>
            </div>
        </div>

        {/* --- MIDDLE AD (ROTATING) --- */}
        {currentMiddleAd && (
            <div className="w-full h-[90px] bg-[#020617] rounded-xl flex items-center justify-center overflow-hidden border border-gray-800 relative animate-fadeIn">
                <span className="absolute top-0 right-0 bg-gray-800 text-[9px] px-1 text-gray-500">Ad {middleAds.length > 1 && "⟳"}</span>
                {currentMiddleAd.imageUrl ? (
                     <a href={currentMiddleAd.link || "#"} target="_blank" className="w-full h-full flex items-center justify-center">
                        <img src={currentMiddleAd.imageUrl} alt="Ad" className="h-full w-auto object-contain transition-opacity duration-500" />
                     </a>
                ) : <div className="text-gray-600 text-xs">{currentMiddleAd.text}</div>}
            </div>
        )}

        {/* --- Channel Grid --- */}
        <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Icons.Tv /> Live Channels</h3>
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Icons.Search /></div>
                <input type="text" placeholder="Search channels..." className="w-full bg-[#1f2937] text-white text-sm py-2 pl-10 pr-4 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
          </div>

          {loading ? <div className="grid grid-cols-4 md:grid-cols-6 gap-4 animate-pulse">{[...Array(12)].map((_,i) => <div key={i} className="h-24 bg-gray-800 rounded-lg"></div>)}</div> : (
            <div id="channel-grid-container" className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar" onScroll={handleScroll}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {channelsToDisplay.map(ch => (
                    <div key={ch.id} onClick={() => setCurrentChannel(ch)} className={`group relative flex flex-col items-center gap-2 cursor-pointer p-3 rounded-xl transition-all border ${currentChannel?.id === ch.id ? "bg-[#1e293b] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "bg-[#1f2937]/50 border-gray-800 hover:bg-[#1f2937] hover:border-gray-600 hover:-translate-y-1"}`}>
                        <div className="w-12 h-12 bg-[#0b1120] rounded-full p-1.5 overflow-hidden shadow-inner relative ring-1 ring-white/5">
                            {ch.logo ? <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain transition-transform group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><Icons.Tv /></div>}
                        </div>
                        <span className={`text-[10px] font-bold text-center line-clamp-1 w-full ${currentChannel?.id === ch.id ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-200"}`}>{ch.name}</span>
                        {currentChannel?.id === ch.id && <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_5px_#06b6d4]"></div>}
                    </div>
                ))}
                </div>
            </div>
          )}
        </div>

        {/* --- Footer Stats --- */}
        <div className="bg-[#1e293b] rounded-xl p-6 border border-gray-800 flex flex-col items-center text-center space-y-4 shadow-lg mb-8">
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Realtime Stats</h4>
            <div className="flex items-center justify-center gap-8 md:gap-16 w-full">
                <div>
                    <p className="text-2xl font-black text-green-400 tabular-nums">{onlineUsers}</p>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Online</p>
                </div>
                <div className="w-px h-8 bg-gray-700"></div>
                <div>
                    <p className="text-2xl font-black text-cyan-400 tabular-nums">{totalVisitors}</p>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Visits</p>
                </div>
                <div className="w-px h-8 bg-gray-700"></div>
                <div>
                    <p className="text-2xl font-black text-purple-400 tabular-nums">{totalChannels}</p>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Channels</p>
                </div>
            </div>
            <div className="w-full h-px bg-gray-800"></div>
            <p className="text-[10px] text-gray-500">&copy; 2026 ToffeePro Streaming. Use responsibly.</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingPlayer />}>
      <LiveTVContent />
    </Suspense>
  );
}
