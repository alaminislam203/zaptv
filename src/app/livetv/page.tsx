"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { collection, onSnapshot, addDoc, doc, runTransaction } from "firebase/firestore";
import { ref, onValue, off, set, onDisconnect, serverTimestamp } from "firebase/database";
import { db, rtdb } from "../firebase"; 
import { useAuth } from "../../../components/AuthContext";
import { logWatchEvent } from "../../../components/AnalyticsManager";
import dynamic from "next/dynamic";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import GlobalBannerAd from "../../../components/GlobalBannerAd";
import EPG from "../../../components/EPG";
import LiveChat from "../../../components/LiveChat";
import { Play, Activity, Search, Shield, Info, Heart, AlertTriangle, Users, Tv, Maximize2, Settings2 } from "lucide-react";

// Loading Component
const LoadingPlayer = () => (
  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 animate-pulse">
    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Connecting...</span>
  </div>
);

// Dynamic Player Imports
const DynamicPlayer = dynamic(() => import("../../../components/DynamicPlayer"), {
  ssr: false, loading: () => <LoadingPlayer /> 
});

// --- M3U Parser Function ---
const parseM3U = (content: string): any[] => {
  const lines = content.split('\n');
  const result: any[] = [];
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
          sources: [{ label: "High Quality", url: line }]
        });
        currentName = "";
        currentLogo = "";
      }
    }
  });
  return result;
};

export default function LiveTVPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentChannel, setCurrentChannel] = useState<any | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [playerType, setPlayerType] = useState<any>("plyr");
  const [loading, setLoading] = useState(true);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(channels.map(ch => ch.category || "Others")));
    return ["All", ...uniqueCats.sort()];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || ch.category === selectedCategory;
      const isAdult = ch.category === "Adult" || ch.name.toLowerCase().includes("18+");
      const isParentalLock = typeof window !== 'undefined' ? localStorage.getItem("parental_lock") === "true" : false;
      if (isParentalLock && isAdult) return false;
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchQuery, selectedCategory]);

  useEffect(() => {
    onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data();
        setSiteConfig(config);
        
        // Fetch playlist based on config
        const fetchM3UPlaylist = async () => {
          try {
            const url = config.liveTvPlaylistUrl || "https://sm-live-tv-auto-update-playlist.pages.dev/Combined_Live_TV.m3u";
            const response = await fetch(url);
            const text = await response.text();
            setChannels(parseM3U(text));
          } catch (error) {
            console.error("Error loading M3U playlist:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchM3UPlaylist();
      }
    });
  }, []);

  useEffect(() => {
    const statusRef = ref(rtdb, 'status');
    const myRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    set(myRef, { online: true });
    onDisconnect(myRef).remove();
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));
  }, []);

  const toggleFavorite = () => {
    if (!currentChannel) return;
    let favs = JSON.parse(localStorage.getItem("favorites") || '[]');
    const exists = favs.some((c: any) => c.id === currentChannel.id);
    if (exists) favs = favs.filter((c: any) => c.id !== currentChannel.id);
    else favs.push(currentChannel);
    localStorage.setItem("favorites", JSON.stringify(favs));
    setIsFavorite(!exists);
  };

  if (siteConfig?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-[3rem] max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white uppercase italic mb-4">Under Maintenance</h1>
          <p className="text-slate-500 text-sm font-medium">We're upgrading our servers for a better experience. Please check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />
      <GlobalBannerAd location="top" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Marquee */}
        <div className="glass rounded-2xl py-3 px-6 mb-12 overflow-hidden relative border-l-4 border-l-emerald-500">
          <div className="flex whitespace-nowrap animate-marquee">
            <span className="text-xs font-bold text-slate-400 px-8 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3 text-emerald-500" />
              {siteConfig.marqueeText || "Welcome to ToffeePro — Select a channel from the list below to start watching live TV."}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 transition-all duration-700 ${isCinemaMode ? 'lg:gap-0' : 'gap-12'}`}>

          {/* Player Section */}
          <div className={`${isCinemaMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-8`}>
            <div className={`glass rounded-[2.5rem] overflow-hidden relative group border-white/5 shadow-emerald-500/5 shadow-2xl transition-all duration-700 ${isCinemaMode ? 'aspect-[21/9]' : 'aspect-video'}`}>
              {currentChannel ? (
                <DynamicPlayer
                  player={playerType}
                  src={currentChannel.sources[activeSourceIndex].url}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-900/50">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500">
                    <Tv className="w-10 h-10" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Select a channel to begin</p>
                </div>
              )}
            </div>

            {currentChannel && (
              <div className="glass p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-black rounded-3xl border border-white/5 p-2 overflow-hidden flex-shrink-0">
                    <img src={currentChannel.logo} className="w-full h-full object-contain" alt="" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{currentChannel.name}</h2>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-3 h-3 animate-pulse" />
                      Live Stream
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCinemaMode(!isCinemaMode)}
                    className={`p-4 rounded-2xl border transition-all ${isCinemaMode ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-900 border-white/5 text-slate-500 hover:text-white"}`}
                    title="Cinema Mode"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleFavorite}
                    className={`p-4 rounded-2xl border transition-all ${isFavorite ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-900 border-white/5 text-slate-500 hover:text-white"}`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button className="flex items-center gap-2 px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    <Shield className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>
            )}

            {/* EPG & Chat Section */}
            {!isCinemaMode && currentChannel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[400px]">
                  <EPG channelName={currentChannel.name} />
                </div>
                <div className="h-[400px]">
                  <LiveChat channelId={currentChannel.id} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Section */}
          <div className={`${isCinemaMode ? 'hidden' : 'lg:col-span-4'} space-y-8`}>
            <div className="glass p-8 rounded-[2.5rem] h-[700px] flex flex-col">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Channel List</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg">
                    <Users className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500">{onlineUsers}</span>
                  </div>
                </div>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Quick search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        selectedCategory === cat ? "bg-emerald-500 text-white" : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {filteredChannels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChannel(ch);
                      setActiveSourceIndex(0);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all group ${
                      currentChannel?.id === ch.id
                        ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-950 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div className="w-10 h-10 bg-black rounded-xl border border-white/10 p-1 flex-shrink-0">
                      <img src={ch.logo} className="w-full h-full object-contain" alt="" />
                    </div>
                    <span className={`flex-1 text-left text-[10px] font-black uppercase tracking-widest truncate ${
                      currentChannel?.id === ch.id ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}>
                      {ch.name}
                    </span>
                    {currentChannel?.id === ch.id && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    )}
                    {(ch.category === "Adult" || ch.name.toLowerCase().includes("18+")) && (
                        <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                            <Shield className="w-3 h-3" />
                        </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <GlobalBannerAd location="bottom" />
      <Footer />
    </div>
  );
}
