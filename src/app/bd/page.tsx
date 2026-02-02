"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { collection, onSnapshot, addDoc, doc, runTransaction } from "firebase/firestore";
import { ref, onValue, off, set, onDisconnect, serverTimestamp } from "firebase/database";
import { db, rtdb } from "../firebase"; 
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { Play, Activity, Search, Shield, Info, Heart, AlertTriangle, Users, Tv, Globe, Star, ChevronRight } from "lucide-react";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 animate-pulse">
    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Connecting...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const VideoJSPlayer = dynamic(() => import("../../../components/VideoJSPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const ShakaPlayer = dynamic(() => import("../../../components/ShakaPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const IframePlayer = dynamic(() => import("../../../components/IframePlayer"), { ssr: false });
const PlayerJSPlayer = dynamic(() => import("../../../components/PlayerJSPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

// --- M3U Parser ---
const parseM3U = (content: string): any[] => {
  const lines = content.split('\n');
  const result: any[] = [];
  let currentName = "", currentLogo = "", currentCategory = "";

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
        result.push({ id: `ch-${index}`, name: currentName, logo: currentLogo, category: currentCategory, is_embed: false, sources: [{ label: "Stream 1", url: line }] });
        currentName = ""; currentLogo = "";
      }
    }
  });
  return result;
};

function BDLiveTVContent() {
  const searchParams = useSearchParams();

  // Data States
  const [channels, setChannels] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportedChannelNames, setReportedChannelNames] = useState<Set<string>>(new Set());

  // Player & User States
  const [currentChannel, setCurrentChannel] = useState<any | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [playerType, setPlayerType] = useState<any>("plyr");
  const [visibleCount, setVisibleCount] = useState(48);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(channels.map(ch => ch.category || "Others")));
    return ["All", ...uniqueCats.sort()];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || ch.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchQuery, selectedCategory]);

  useEffect(() => {
    onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data();
        setSiteConfig(config);

        const fetchPlaylist = async () => {
          const PLAYLIST_URL = config.bdPlaylistUrl || "https://raw.githubusercontent.com/alaminislam203/my_playlist/refs/heads/main/bd.json";
          try {
            const response = await fetch(PLAYLIST_URL);
            const rawText = await response.text();
            let parsedChannels: any[] = [];
            try {
                const jsonData = JSON.parse(rawText);
                parsedChannels = jsonData.map((item: any, idx: number) => ({
                    id: item.id || `json-${idx}`,
                    name: item.name || "Unknown",
                    logo: item.logo || "",
                    category: item.category || "Others",
                    is_embed: item.is_embed || false,
                    sources: item.sources || [{ label: "Stream 1", url: item.url, drm: item.drm }] 
                }));
            } catch (e) {
                parsedChannels = parseM3U(rawText);
            }
            setChannels(parsedChannels);
          } catch (error) {
            console.error("Error loading playlist:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchPlaylist();
      }
    });
    onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportedSet = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === "pending" && data.channelName) reportedSet.add(data.channelName);
      });
      setReportedChannelNames(reportedSet);
    });
  }, []);

  useEffect(() => {
    const counterRef = doc(db, 'counters', 'visitors');
    onSnapshot(counterRef, (doc) => { if (doc.exists()) setTotalVisitors(doc.data().total); });

    const statusRef = ref(rtdb, 'status');
    const myRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    set(myRef, { online: true });
    onDisconnect(myRef).remove();
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));
  }, []);

  useEffect(() => {
    const channelIdToPlay = searchParams.get("play");
    if (channelIdToPlay && channels.length > 0) {
      const targetChannel = channels.find((ch) => ch.id === channelIdToPlay || ch.name === channelIdToPlay);
      if (targetChannel) setCurrentChannel(targetChannel);
    }
  }, [channels, searchParams]);

  useEffect(() => {
    if (currentChannel) {
        const favs = JSON.parse(localStorage.getItem("favorites") || '[]');
        setIsFavorite(favs.some((c: any) => c.id === currentChannel.id));
    }
  }, [currentChannel]);

  const toggleFavorite = () => {
    if (!currentChannel) return;
    let favs = JSON.parse(localStorage.getItem("favorites") || '[]');
    const exists = favs.some((c: any) => c.id === currentChannel.id);
    if (exists) favs = favs.filter((c: any) => c.id !== currentChannel.id);
    else favs.push(currentChannel);
    localStorage.setItem("favorites", JSON.stringify(favs));
    setIsFavorite(!exists);
  };

  const handleReport = async () => {
    if (!currentChannel) return;
    if (confirm(`Report "${currentChannel.name}"?`)) {
      try {
        await addDoc(collection(db, "reports"), { channelName: currentChannel.name, channelId: currentChannel.id, timestamp: new Date(), status: "pending", issue: "Stream not working" });
        alert("Report submitted successfully!");
      } catch (e) { console.error("Error reporting:", e); }
    }
  };

  const renderPlayer = () => {
    if (!currentChannel) return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-900/50">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500">
          <Tv className="w-10 h-10" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Select a Bangladesh channel</p>
      </div>
    );

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
    return <NativePlayer src={url} />;
  };

  if (siteConfig?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-[3rem] max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white uppercase italic mb-4">Under Maintenance</h1>
          <p className="text-slate-500 text-sm font-medium">Bangladesh section is temporarily offline. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="text-2xl">🇧🇩</span>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em]">Home Network</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
              Bangladesh <span className="text-gradient">TV</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="glass px-8 py-6 rounded-3xl text-center">
              <p className="text-3xl font-black text-white italic leading-none mb-1">{onlineUsers}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Watching Live</p>
            </div>
            <div className="glass px-8 py-6 rounded-3xl text-center border-emerald-500/20">
              <p className="text-3xl font-black text-emerald-500 italic leading-none mb-1">{channels.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BD Channels</p>
            </div>
          </div>
        </div>

        {/* Notice Section */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 mb-12 flex flex-col md:flex-row items-center gap-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center md:text-left">
                <h4 className="text-red-500 font-black uppercase italic tracking-tighter mb-1">সতর্কবাণী (Notice)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-wide">
                    এই সাইটে প্রদর্শিত বিজ্ঞাপনগুলো থার্ড-পার্টি দ্বারা নিয়ন্ত্রিত। জুয়া বা অশ্লীল বিজ্ঞাপন এড়িয়ে চলুন। নিজ দায়িত্বে ব্যবহার করুন।
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Player Section */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass rounded-[3rem] overflow-hidden aspect-video relative border-white/5 shadow-2xl">
              {renderPlayer()}
            </div>

            {currentChannel && (
              <div className="glass p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-black rounded-3xl border border-white/5 p-2 overflow-hidden flex-shrink-0 flex items-center justify-center text-4xl">
                    {currentChannel.logo ? <img src={currentChannel.logo} className="w-full h-full object-contain" alt="" /> : "📡"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{currentChannel.name}</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3 animate-pulse" />
                            Live Stream
                        </span>
                        {reportedChannelNames.has(currentChannel.name) && (
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                Unstable
                            </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleFavorite}
                    className={`p-4 rounded-2xl border transition-all ${isFavorite ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-900 border-white/5 text-slate-500 hover:text-white"}`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button onClick={handleReport} className="flex items-center gap-2 px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    <Shield className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass p-8 rounded-[3rem] h-[700px] flex flex-col">
              <div className="mb-8">
                <h3 className="text-xs font-black text-white uppercase italic tracking-widest mb-6">Local Network</h3>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search BD channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        selectedCategory === cat ? "bg-emerald-500 text-white" : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {filteredChannels.slice(0, visibleCount).map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChannel(ch);
                      setActiveSourceIndex(0);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                      currentChannel?.id === ch.id
                        ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-950 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div className="w-10 h-10 bg-black rounded-xl border border-white/10 p-1 flex-shrink-0 flex items-center justify-center text-xs">
                      {ch.logo ? <img src={ch.logo} className="w-full h-full object-contain" alt="" /> : "📡"}
                    </div>
                    <span className={`flex-1 text-left text-[10px] font-black uppercase tracking-widest truncate ${
                      currentChannel?.id === ch.id ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}>
                      {ch.name}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${currentChannel?.id === ch.id ? "text-white" : "text-slate-800 group-hover:text-white"} transition-all`} />
                  </button>
                ))}
                {visibleCount < filteredChannels.length && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 48)}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    Load More
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="bg-slate-950 min-h-screen" />}>
      <BDLiveTVContent />
    </Suspense>
  );
}
