"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "./firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GlobalBannerAd from "../../components/GlobalBannerAd";
import ShortcutDashboard from "../../components/ShortcutDashboard";
import { useAuth } from "../../components/AuthContext";
import { useLanguage } from "../../components/LanguageContext";
import { Play, Activity, Clock, Globe, AlertTriangle, Search, Filter, ChevronRight, Tv, Newspaper, Trophy, Baby, Music, Star, Zap, Shield, X } from "lucide-react";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">Initializing Stream</span>
    </div>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

export default function UltimateLivePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>({});
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

  const addToHistory = (match: any) => {
    const history = JSON.parse(localStorage.getItem("watch_history") || "[]");
    const filtered = history.filter((m: any) => (m.match_id || m.id) !== (match.match_id || match.id));
    const newHistory = [{
      id: match.match_id || match.id,
      name: match.match_name || match.name,
      logo: match.src || match.logo,
      ...match
    }, ...filtered].slice(0, 10);
    localStorage.setItem("watch_history", JSON.stringify(newHistory));
  };

  const handleSelectMatch = (match: any) => {
    setActiveMatch(match);
    addToHistory(match);
  };

  const getStreamUrl = (match: any) => {
    let url = match.adfree_url || match.dai_url || "";
    return userRegion === "BD" ? url.replace("https://in", "https://bd") : url;
  };

  const filteredMatches = matches.filter(m => {
    const categoryMatch = selectedCategory === "All" || m.event_category === selectedCategory;
    const searchMatch = (m.match_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];
  const liveCount = matches.filter(m => m.status === "LIVE").length;
  const featuredMatch = matches.find(m => m.status === "LIVE") || matches[0];

  if (isAdBlockActive) {
    return (
      <div className="fixed inset-0 z-[500] bg-slate-950 flex items-center justify-center p-6">
        <div className="glass p-12 rounded-[3rem] max-w-md text-center">
          <Shield className="w-20 h-20 text-red-500 mx-auto mb-6" />
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-500">
      <Navbar />
      <GlobalBannerAd location="top" />

      {/* Hero Section */}
      {!activeMatch && featuredMatch && (
        <section className="relative h-[80vh] w-full overflow-hidden">
          <Image
            src={featuredMatch.src || fallbackImage}
            alt="Hero"
            fill
            className="object-cover opacity-40 scale-105 animate-pulse-soft"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-transparent"></div>

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest animate-bounce">
                {t('featuredLive')}
              </span>
              <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{featuredMatch.event_category}</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black text-white italic uppercase tracking-tighter max-w-4xl leading-[0.85] mb-10 reveal">
              {featuredMatch.match_name}
            </h2>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => handleSelectMatch(featuredMatch)}
                className="flex items-center gap-4 bg-white text-slate-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all group shadow-2xl shadow-white/5"
              >
                <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                {t('watchNow')}
              </button>
              <button className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-md border border-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                <Zap className="w-5 h-5 text-emerald-500" />
                {t('eventInfo')}
              </button>
            </div>
          </div>

          {/* Stats Overlay */}
          <div className="absolute bottom-10 right-10 hidden lg:flex gap-8">
             <div className="text-right">
                <p className="text-4xl font-black text-white italic">{liveCount}</p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('liveEvents')}</p>
             </div>
             <div className="text-right">
                <p className="text-4xl font-black text-white italic">HD</p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Quality</p>
             </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-32">

        {/* Marquee Notice */}
        <div className="bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50 border-b border-slate-700/50 backdrop-blur-rounded-3xl py-5 px-8 mb-16 overflow-hidden relative border-l-8 border-l-emerald-500 shadow-emerald-500/5">
          <div className="flex whitespace-nowrap animate-marquee">
            <span className="text-xs font-black text-white-400 px-12 flex items-center gap-3 uppercase tracking-[0.2em]">
              <Activity className="w-4 h-4 text-emerald-500" />
              {siteConfig.noticeText || t('welcome')}
            </span>
          </div>
        </div>

        {/* Shortcut Dashboard (Recently Viewed & Popular) */}
        <ShortcutDashboard channels={matches} onSelect={handleSelectMatch} />

        {/* Search & Smart Filter */}
        <div className="flex flex-col lg:flex-row gap-8 mb-20 items-end lg:items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border-2 border-slate-800 rounded-[2rem] py-6 pl-16 pr-8 text-lg text-white font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-all shadow-2xl"
            />
          </div>
          <div className="flex gap-3 p-2 bg-slate-900 border border-slate-800 rounded-[2rem] overflow-x-auto no-scrollbar max-w-full shadow-xl">
            {categories.map(cat => {
               const Icon = cat === "Sports" ? Trophy : cat === "News" ? Newspaper : cat === "Kids" ? Baby : cat === "Entertainment" ? Tv : cat === "Music" ? Music : cat === "All" ? Globe : Tv;
               return (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedCategory === cat
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                    <Icon className="w-4 h-4" />
                    {cat}
                </button>
               )
            })}
          </div>
        </div>

        {/* Grid Section */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{t('availableChannels')}</h3>
          </div>
          <div className="hidden md:block h-[1px] flex-1 bg-slate-900 mx-10"></div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
             <Star className="w-4 h-4 text-emerald-500 fill-current" />
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{filteredMatches.length} Total</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video glass rounded-[3rem] animate-pulse"></div>
            ))
          ) : filteredMatches.length === 0 ? (
            <div className="col-span-full py-32 text-center glass rounded-[4rem]">
              <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl">
                <Search className="w-10 h-10 text-slate-700" />
              </div>
              <h4 className="text-2xl font-black text-slate-500 uppercase tracking-widest">No Matches Found</h4>
              <p className="text-slate-600 font-bold mt-4 uppercase text-xs tracking-widest">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            filteredMatches.map((match, idx) => (
              <div 
                key={match.match_id}
                onClick={() => handleSelectMatch(match)}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="reveal group cursor-pointer glass rounded-[3rem] overflow-hidden hover:border-emerald-500/30 transition-all duration-700 hover:-translate-y-3 hover:shadow-emerald-500/10"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image 
                    src={match.src || fallbackImage} 
                    alt={match.match_name} 
                    fill 
                    unoptimized
                    className="object-cover group-hover:scale-110 transition-transform duration-1000 p-2 rounded-[3rem]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                  {match.status === "LIVE" && (
                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-red-600/40">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Live
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6">
                    <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                      {match.event_category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-black text-white uppercase italic leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2 mb-6 min-h-[3.5rem]">
                    {match.match_name}
                  </h4>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">FanCode Premium</span>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xl">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Responsible Streaming Warning */}
        {/* Responsible Streaming Warning */}
        <div className="mt-32 glass p-10 sm:p-16 rounded-[4rem] relative overflow-hidden group border-red-500/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-12">
            <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-5xl shrink-0 border border-red-500/20 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-red-500/10">
              ⚠️
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Responsible Streaming Notice</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium uppercase tracking-wide max-w-3xl">
                We do not promote gambling, betting, or adult content. Any advertisements appearing during streams are from third-party sources. Please use our service responsibly. By using ToffeePro, you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </main>

      <GlobalBannerAd location="bottom" />

      {/* Region Modal */}
      {showRegionModal && (
        <div className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="glass p-16 rounded-[4rem] max-w-xl w-full text-center border-emerald-500/20 shadow-2xl shadow-emerald-500/10 scale-in-center">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-emerald-500/20 animate-bounce">
              <Globe className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">{t('selectRegion')}</h2>
            <p className="text-slate-500 text-sm mb-12 font-bold uppercase tracking-widest">Choose your location to optimize your streaming experience.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => handleSetRegion("BD")}
                className="group flex flex-col items-center justify-center bg-white text-slate-950 p-10 rounded-[3rem] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-2xl hover:-translate-y-2"
              >
                <span className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500">🇧🇩</span>
                <span>Bangladesh</span>
              </button>
              <button
                onClick={() => handleSetRegion("IN")}
                className="group flex flex-col items-center justify-center bg-slate-900 border border-white/5 text-white p-10 rounded-[3rem] font-black uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all shadow-2xl hover:-translate-y-2"
              >
                <span className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500">🌐</span>
                <span>Global</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeMatch && (
        <div className="fixed inset-0 z-[400] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-500">
          <div className="h-24 bg-slate-900/50 backdrop-blur-2xl border-b border-white/5 px-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveMatch(null)}
                className="p-4 bg-slate-800 hover:bg-red-500 hover:text-white rounded-2xl transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
              <div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-tighter truncate max-w-xs sm:max-w-xl">
                  {activeMatch.match_name}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Streaming Now</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={playerType}
                onChange={(e) => setPlayerType(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-[10px] font-black uppercase text-white px-6 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-all cursor-pointer hover:bg-slate-700"
              >
                <option value="native">Standard Engine</option>
                <option value="plyr">Premium Engine</option>
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
