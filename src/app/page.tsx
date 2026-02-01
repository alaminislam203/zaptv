"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6 rounded-3xl border border-slate-800/50 shadow-2xl backdrop-blur-xl">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">Loading Stream</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
  const [showNotification, setShowNotification] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- ADMIN CONTROL STATES ---
  const [adminSettings] = useState({
    noticeText: "স্বাগতম! আমাদের সাইটে কোনো প্রকার জুয়া বা বেটিং বিজ্ঞাপন প্রচার করা হয় না।",
    showPopAds: true,
    showBannerAds: true,
    activeNotification: {
      show: true,
      title: "লাইভ আপডেট",
      msg: "ভারত বনাম পাকিস্তান ম্যাচটি শুরু হয়েছে! এখনই জয়েন করুন।"
    }
  });

  const fallbackImage = "https://placehold.co/600x400/1e293b/e2e8f0?text=No+Image";

  // ১. ডিজিটাল ঘড়ি
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ২. অ্যাড স্ক্রিপ্ট ইনজেকশন
  useEffect(() => {
    (function(s: any) {
      s.dataset.zone = '10282293';
      s.src = 'https://al5sm.com/tag.min.js';
      const target = [document.documentElement, document.body].filter(Boolean).pop();
      if (target) target.appendChild(s);
    })(document.createElement('script'));

    const script2 = document.createElement("script");
    script2.src = "https://3nbf4.com/act/files/tag.min.js?z=10282294";
    script2.dataset.cfasync = "false";
    script2.async = true;
    document.body.appendChild(script2);

    return () => {
      if (document.body.contains(script2)) document.body.removeChild(script2);
    };
  }, []);

  // ৩. এন্টি অ্যাড-ব্লকার
  useEffect(() => {
    const checkAdBlock = async () => {
      try {
        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD", mode: "no-cors", cache: "no-store",
        });
        setIsAdBlockActive(false);
      } catch {
        setIsAdBlockActive(true);
      }
    };

    const backupCheck = () => {
      const fakeAd = document.createElement("div");
      fakeAd.className = "adsbox ad-unit ad-zone ads-google public_ads";
      fakeAd.style.position = "absolute"; fakeAd.style.left = "-999px";
      document.body.appendChild(fakeAd);
      setTimeout(() => {
        if (fakeAd.offsetHeight === 0) setIsAdBlockActive(true);
        document.body.removeChild(fakeAd);
      }, 100);
    };

    checkAdBlock();
    backupCheck();
  }, []);

  // ৪. ডেটা ফেচিং
  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region");
    if (savedRegion) setUserRegion(savedRegion);
    else setShowRegionModal(true);

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
        if (adminSettings.activeNotification.show) {
          setTimeout(() => setShowNotification(true), 3000);
        }
      } catch (err) { 
        console.error("Load failed"); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [adminSettings.activeNotification.show]);

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

  // অ্যাড-ব্লকার সতর্কবার্তা
  if (isAdBlockActive) {
    return (
      <div className="fixed inset-0 z-[500] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 p-12 rounded-3xl max-w-md shadow-2xl">
          <div className="bg-gradient-to-br from-red-500 to-orange-600 w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl">🚫</div>
          <h2 className="text-2xl font-bold text-white text-center mb-3">Ad-Blocker Detected</h2>
          <p className="text-slate-400 text-sm text-center leading-relaxed mb-8">
            আমাদের ফ্রি সার্ভিসটি সচল রাখতে দয়া করে আপনার অ্যাড-ব্লকারটি বন্ধ করুন।
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      
      {/* ১. রিজিয়ন মডাল */}
      {showRegionModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-10 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">সার্ভার নির্বাচন করুন</h2>
              <p className="text-slate-400 text-sm">আপনার অঞ্চল অনুযায়ী সেরা সার্ভার বেছে নিন</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleSetRegion("BD")} 
                className="group bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🇧🇩</span>
                <span>Bangladesh Server</span>
              </button>
              <button 
                onClick={() => handleSetRegion("IN")} 
                className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🌐</span>
                <span>Global Server</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ২. পুশ নোটিফিকেশন */}
      {showNotification && (
        <div className="fixed top-24 right-6 z-[300] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500 max-w-sm">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl text-white flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-400 mb-1">{adminSettings.activeNotification.title}</p>
              <p className="text-sm text-slate-200 leading-relaxed">{adminSettings.activeNotification.msg}</p>
            </div>
            <button 
              onClick={() => setShowNotification(false)} 
              className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ৩. নোটিশ বার */}
      <div className="bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50 border-b border-slate-700/50 backdrop-blur-sm py-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5"></div>
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-xs font-medium text-slate-400 px-8">{adminSettings.noticeText}</span>
          <span className="text-xs font-medium text-slate-400 px-8">{adminSettings.noticeText}</span>
          <span className="text-xs font-medium text-slate-400 px-8">{adminSettings.noticeText}</span>
        </div>
      </div>

      {/* ৪. নেভিবার */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">FanCode Live</h1>
              <p className="text-xs text-slate-500">Watch Sports Live</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {liveCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-red-400">{liveCount} Live</span>
              </div>
            )}
            <div className="hidden lg:flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-sm font-mono text-slate-300">{currentTime}</span>
            </div>
            <button 
              onClick={() => setShowRegionModal(true)} 
              className="bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700/50 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="hidden sm:inline">{userRegion === 'BD' ? '🇧🇩 BD' : '🌐 Global'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ৫. সতর্কবার্তা */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 p-6 rounded-2xl flex items-center gap-6 backdrop-blur-sm">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
            ⚠️
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">সতর্কতা: জুয়া ও বেটিং নিষিদ্ধ</h3>
            <p className="text-sm text-slate-400 leading-relaxed">বিজ্ঞাপনের আয় দিয়েই আমরা সার্ভার খরচ চালাই। জুয়া থেকে দূরে থাকুন।</p>
          </div>
        </div>
      </div>

      {/* ৬. ভিডিও প্লেয়ার */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col lg:flex-row">
          {/* প্লেয়ার এরিয়া */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <button 
              onClick={() => setActiveMatch(null)} 
              className="absolute top-6 left-6 z-[110] bg-slate-900/90 hover:bg-slate-800 p-3 rounded-xl backdrop-blur-xl transition-all border border-slate-700/50 text-white shadow-lg group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="w-full h-full">
              {playerType === "native" ? <NativePlayer src={getStreamUrl(activeMatch)} /> : <PlyrPlayer src={getStreamUrl(activeMatch)} />}
            </div>
          </div>

          {/* সাইডবার */}
          <div className="w-full lg:w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <Badge color="emerald">{activeMatch.event_category}</Badge>
                  <h2 className="text-2xl font-bold text-white mt-3 leading-tight">{activeMatch.match_name}</h2>
                </div>
                {activeMatch.status === "LIVE" && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-red-400">LIVE</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-4">Player Options</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPlayerType("native")} 
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    playerType === 'native' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Native
                </button>
                <button 
                  onClick={() => setPlayerType("plyr")} 
                  className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    playerType === 'plyr' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Plyr
                </button>
              </div>
            </div>

            {/* সাইডবার অ্যাড */}
            {adminSettings.showBannerAds && (
              <div className="p-6 border-t border-slate-800">
                <p className="text-xs text-slate-600 font-semibold mb-4 text-center">Sponsored</p>
                <div className="w-full aspect-[300/250] bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
                  <iframe 
                    src="about:blank" 
                    className="w-full h-full border-none"
                    onMouseEnter={(e) => {
                      const doc = e.currentTarget.contentWindow?.document;
                      if (doc && doc.body.innerHTML === "") {
                        doc.open(); 
                        doc.write(`
                          <script type="text/javascript">
                            atOptions = { 'key' : 'f2f17f2fb72b5519eee3147ed075d1fb', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };
                          </script>
                          <script type="text/javascript" src="https://www.highperformanceformat.com/f2f17f2fb72b5519eee3147ed075d1fb/invoke.js"></script>
                        `); 
                        doc.close();
                      }
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ৭. ম্যাচ লিস্ট */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* সার্চ ও ফিল্টার */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <span className="font-semibold text-white">{filteredMatches.length}</span>
              <span>matches</span>
            </div>
          </div>

          {/* ক্যাটাগরি ফিল্টার */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)} 
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg" 
                    : "bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ম্যাচ গ্রিড */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="aspect-video bg-slate-800/50 rounded-2xl animate-pulse"></div>
            ))
          ) : filteredMatches.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="inline-block bg-slate-800/50 p-6 rounded-2xl mb-4">
                <svg className="w-12 h-12 text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">No matches found</h3>
              <p className="text-sm text-slate-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredMatches.map((match) => (
              <div 
                key={match.match_id} 
                onClick={() => setActiveMatch(match)} 
                className="group cursor-pointer bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <Image 
                    src={match.src || fallbackImage} 
                    alt={match.match_name} 
                    fill 
                    unoptimized 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                  {match.status === "LIVE" && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge color="slate">{match.event_category}</Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                    {match.match_name}
                  </h3>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* স্টাইল */}
      <style jsx global>{`
        @keyframes marquee { 
          0% { transform: translateX(0); } 
          100% { transform: translateX(-50%); } 
        }
        .animate-marquee { 
          animation: marquee 30s linear infinite; 
        }
        .no-scrollbar::-webkit-scrollbar { 
          display: none; 
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}

const Badge = ({ children, color }: { children: React.ReactNode; color: string }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    slate: 'bg-slate-700/50 text-slate-300 border border-slate-600/50',
    red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${colorClasses[color as keyof typeof colorClasses] || colorClasses.slate}`}>
      {children}
    </span>
  );
};
