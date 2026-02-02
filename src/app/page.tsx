"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Play, Activity, Clock, Globe, AlertTriangle, Search, Filter, ChevronRight } from "lucide-react";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">Initializing Stream</span>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

export default function UltimateLivePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fallbackImage = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkAdBlock = async () => {
      try {
        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD", mode: "no-cors", cache: "no-store",
        });
      } catch {
        setIsAdBlockActive(true);
      }
    };
    checkAdBlock();
  }, []);

  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region");
    if (savedRegion) setUserRegion(savedRegion);
    else setShowRegionModal(true);

    onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSiteConfig(docSnap.data());
    });

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) { 
        console.error("Load failed"); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  const handleSetRegion = (region: string) => {
    setUserRegion(region);
    localStorage.setItem("fc_region", region);
    setShowRegionModal(false);
  };

  const getStreamUrl = (match: any) => {
    let url = match.adfree_url || match.dai_url || "";
    return userRegion === "BD" ? url.replace("https://in", "https://bd") : url;
  };

  const filteredMatches = matches.filter(m => {
    const categoryMatch = selectedCategory === "All" || m.event_category === selectedCategory;
    const searchMatch = m.match_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];
  const liveCount = matches.filter(m => m.status === "LIVE").length;
  const featuredMatch = matches.find(m => m.status === "LIVE") || matches[0];

  if (isAdBlockActive) {
    return (
      <div className="fixed inset-0 z-[500] bg-slate-950 flex items-center justify-center p-6">
        <div className="glass p-12 rounded-[3rem] max-w-md text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">🚫</div>
          <h2 className="text-2xl font-black text-white mb-3 uppercase italic">Ad-Blocker Detected</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
            To keep our service free and high-quality, please disable your ad-blocker and reload the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />

      {/* Hero Section */}
      {!activeMatch && featuredMatch && (
        <section className="relative h-[70vh] w-full overflow-hidden">
          <Image
            src={featuredMatch.src || fallbackImage}
            alt="Hero"
            fill
            className="object-cover opacity-40 scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent"></div>

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest animate-pulse">
                Featured Live
              </span>
              <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{featuredMatch.event_category}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter max-w-3xl leading-[0.9] mb-8">
              {featuredMatch.match_name}
            </h2>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setActiveMatch(featuredMatch)}
                className="flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all group"
              >
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                Watch Now
              </button>
              <button className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Event Info
              </button>
            </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">

        {/* Marquee Notice */}
        <div className="glass rounded-2xl py-4 px-6 mb-12 overflow-hidden relative border-l-4 border-l-emerald-500">
          <div className="flex whitespace-nowrap animate-marquee">
            <span className="text-xs font-bold text-slate-400 px-8 flex items-center gap-2 uppercase tracking-widest">
              <Activity className="w-3 h-3 text-emerald-500" />
              {siteConfig.noticeText || "Welcome to ToffeePro — Your premium destination for live sports and TV. Enjoy seamless streaming in HD."}
            </span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-end md:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search matches or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Live Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-black text-white italic">{liveCount}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Events</p>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white italic">{userRegion || "---"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region</p>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white italic">{currentTime.split(' ')[0]}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Time</p>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white italic">{filteredMatches.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Results</p>
            </div>
          </div>
        </div>

        {/* Grid Section */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Current Events</h3>
          <div className="h-[1px] flex-1 bg-slate-900 mx-8"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="aspect-video glass rounded-[2.5rem] animate-pulse"></div>
            ))
          ) : filteredMatches.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                <Search className="w-8 h-8 text-slate-700" />
              </div>
              <h4 className="text-xl font-bold text-slate-500 uppercase tracking-widest">No Matches Found</h4>
              <p className="text-slate-600 text-sm mt-2">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            filteredMatches.map((match, idx) => (
              <div 
                key={match.match_id}
                onClick={() => setActiveMatch(match)}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="reveal group cursor-pointer glass rounded-[2.5rem] overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-emerald-500/10"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image 
                    src={match.src || fallbackImage} 
                    alt={match.match_name} 
                    fill 
                    unoptimized
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  {match.status === "LIVE" && (
                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      Live
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {match.event_category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="text-lg font-black text-white uppercase italic leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2 mb-4">
                    {match.match_name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">FanCode Stream</span>
                    <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Warning Section */}
        <div className="mt-20 glass p-8 sm:p-12 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-4xl shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
              ⚠️
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Responsible Streaming Notice</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                We do not promote gambling or betting. Any advertisements appearing during streams are from third-party sources. Please use our service responsibly and enjoy the games.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Region Modal */}
      {showRegionModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass p-12 rounded-[3rem] max-w-md w-full text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-emerald-500/20">
              <Globe className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tighter">Select Region</h2>
            <p className="text-slate-500 text-sm mb-10 font-medium">Choose your location to optimize your streaming experience.</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleSetRegion("BD")}
                className="group flex items-center justify-between bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
              >
                <span>Bangladesh</span>
                <span className="text-2xl group-hover:scale-110 transition-transform">🇧🇩</span>
              </button>
              <button
                onClick={() => handleSetRegion("IN")}
                className="group flex items-center justify-between bg-slate-900 border border-white/5 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all"
              >
                <span>Global</span>
                <span className="text-2xl group-hover:scale-110 transition-transform">🌐</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeMatch && (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col">
          <div className="h-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveMatch(null)}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors group"
              >
                <Play className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h2 className="text-sm font-black text-white uppercase italic tracking-tighter truncate max-w-xs sm:max-w-md">
                  {activeMatch.match_name}
                </h2>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Now</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={playerType}
                onChange={(e) => setPlayerType(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-[10px] font-black uppercase text-white px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="native">Native Player</option>
                <option value="plyr">Plyr Player</option>
              </select>
            </div>
          </div>

          <div className="flex-1 bg-black relative">
            <div className="absolute inset-0 flex items-center justify-center">
              {playerType === "native" ? <NativePlayer src={getStreamUrl(activeMatch)} /> : <PlyrPlayer src={getStreamUrl(activeMatch)} />}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
