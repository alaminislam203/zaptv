"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
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

// --- Dynamic Player Imports ---
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

// --- Interfaces ---
interface DrmConfig { type: "clearkey" | "widevine"; keyId?: string; key?: string; licenseUrl?: string; }
interface Source { label: string; url: string; drm?: DrmConfig; }
interface Channel { id: string; name: string; logo: string; is_embed: boolean | string; category?: string; sources: Source[]; }
interface AdData { id: string; location: "top" | "middle"; imageUrl?: string; text?: string; link?: string; }

// --- SVG Icons Collection ---
const Icons = {
    Play: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>,
    Heart: ({ filled }: { filled: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${filled ? "text-red-500" : "text-gray-400"}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,
    Share: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>,
    Report: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
    Server: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" /></svg>,
    Tv: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" /></svg>,
    Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>
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

  // Infinite Scroll
  const [visibleCount, setVisibleCount] = useState(48);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
        if (visibleCount < channels.length) {
            setVisibleCount((prev) => prev + 24);
        }
    }
  };

  // Logic: URL Play & Favorites
  useEffect(() => {
    const channelIdToPlay = searchParams.get("play");
    if (channelIdToPlay && channels.length > 0) {
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

  // Security Hooks (Context Menu block etc)
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

  // Firebase Data Fetching
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

  // Stats Logic
  useEffect(() => {
    if (!isClient) return;
    const counterRef = doc(db, 'counters', 'visitors');
    const incrementTotalVisitors = async () => {
        if (!sessionStorage.getItem('visitedThisSession')) {
            sessionStorage.setItem('visitedThisSession', 'true');
            try {
                await runTransaction(db, async (transaction) => {
                    const docSnap = await transaction.get(counterRef);
                    if (!docSnap.exists()) {
                        transaction.set(counterRef, { total: 1 });
                        setTotalVisitors(1);
                    } else {
                        const newTotal = docSnap.data().total + 1;
                        transaction.update(counterRef, { total: newTotal });
                        setTotalVisitors(newTotal);
                    }
                });
            } catch (e) { console.error("Failed to increment visitor count:", e); }
        }
    };
    const unsub = onSnapshot(counterRef, (doc) => { if (doc.exists()) setTotalVisitors(doc.data().total); });
    incrementTotalVisitors();
    
    const myConnectionsRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    const connectedRef = ref(rtdb, '.info/connected');
    const statusRef = ref(rtdb, 'status');
    const unsubscribe = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            set(myConnectionsRef, { timestamp: serverTimestamp() });
            onDisconnect(myConnectionsRef).remove();
        }
    });
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));
    return () => { unsub(); off(connectedRef); off(statusRef); onDisconnect(myConnectionsRef).cancel(); set(myConnectionsRef, null); };
  }, [isClient]);

  // Adblock & Scripts
  useEffect(() => {
    if (!scriptsLoaded.current) {
      const detectAdBlock = async () => {
          let adBlockEnabled = false;
          try { await fetch(new Request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors' })); } catch (e) { adBlockEnabled = true; }
          if (adBlockEnabled) {
              // Simple alert logic or modal can be placed here
              console.log("Adblock Detected");
          }
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
    const url = `${window.location.origin}${window.location.pathname}?play=${currentChannel.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard! Share it with friends.");
  };

  const handleReport = async () => {
    if (!currentChannel) return;
    if (confirm(`Report "${currentChannel.name}"?`)) {
      try {
        await addDoc(collection(db, "reports"), { channelName: currentChannel.name, channelId: currentChannel.id, sourceLabel: currentChannel.sources[activeSourceIndex]?.label || "Default", timestamp: new Date(), status: "pending", issue: "Stream not working" });
        alert("Report submitted successfully!");
      } catch (e) { console.error("Error reporting:", e); }
    }
  };

  const filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const channelsToDisplay = filteredChannels.slice(0, visibleCount);

  const getAd = (loc: "top" | "middle") => ads.find(ad => ad.location === loc);
  const topAd = getAd("top");
  const middleAd = getAd("middle");

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
                <span className="text-xs text-gray-400">All Channels</span>
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

        {/* --- Top Ad (Fixed Size) --- */}
        {topAd && (
          <div className="w-full h-[100px] sm:h-[120px] bg-[#020617] rounded-xl flex items-center justify-center overflow-hidden border border-gray-800 relative group">
            <span className="absolute top-0 right-0 bg-gray-800 text-[9px] px-1.5 py-0.5 text-gray-400 rounded-bl-lg z-20">Sponsored</span>
            {topAd.imageUrl ? (
                <a href={topAd.link || "#"} target="_blank" className="w-full h-full flex items-center justify-center">
                    <img src={topAd.imageUrl} alt="Advertisement" className="h-full w-auto object-contain max-w-full" />
                </a>
            ) : (
                <div className="text-center p-2 text-cyan-600 font-bold opacity-50 text-sm tracking-widest">{topAd.text}</div>
            )}
          </div>
        )}

        {/* --- Main Player Section --- */}
        <div className="bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
            {/* Player Wrapper */}
            <div className="aspect-video w-full bg-black relative group">
                <div key={`${currentChannel?.id}-${activeSourceIndex}-${playerType}`} className="w-full h-full">
                    {renderPlayer()}
                </div>
            </div>

            {/* Controls Bar */}
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
                    <button onClick={handleShare} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-cyan-400 transition" title="Share">
                        <Icons.Share />
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
        
        {/* --- Instructions / Guide (New Feature) --- */}
        <div className="bg-[#0f172a] rounded-xl p-4 border border-gray-800">
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-widest border-b border-gray-800 pb-2">Quick Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                <p>1. Video লোড না হলে <strong>Server</strong> পরিবর্তন করে দেখুন।</p>
                <p>2. প্লেয়ারে সমস্যা হলে <strong>Engine</strong> (Plyr/Native) চেঞ্জ করুন।</p>
                <p>3. সাউন্ড না আসলে প্লেয়ারে ট্যাপ করে <strong>Unmute</strong> করুন।</p>
                <p>4. বাফারিং এড়াতে ইন্টারনেট স্পিড চেক করুন।</p>
            </div>
        </div>

        {/* --- Middle Ad (Fixed Size) --- */}
        {middleAd && (
            <div className="w-full h-[90px] bg-[#020617] rounded-xl flex items-center justify-center overflow-hidden border border-gray-800 relative">
                <span className="absolute top-0 right-0 bg-gray-800 text-[9px] px-1 text-gray-500">Ad</span>
                {middleAd.imageUrl ? (
                     <a href={middleAd.link || "#"} target="_blank" className="w-full h-full flex items-center justify-center">
                        <img src={middleAd.imageUrl} alt="Ad" className="h-full w-auto object-contain" />
                     </a>
                ) : <div className="text-gray-600 text-xs">{middleAd.text}</div>}
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
