"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 shadow-2xl">
    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[10px] text-red-500 font-black animate-pulse tracking-[0.3em] uppercase">Securing Stream...</span>
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
  
  // --- ADMIN CONTROL STATES (এগুলো এডমিন থেকে ডাটা আনবে) ---
  const [adminSettings, setAdminSettings] = useState({
    noticeText: "স্বাগতম! আমাদের সাইটে কোনো প্রকার জুয়া বা বেটিং বিজ্ঞাপন প্রচার করা হয় না।",
    showPopAds: true, // Tag.min.js কন্ট্রোল
    showBannerAds: true, // Iframe Ads কন্ট্রোল
    activeNotification: {
      show: true,
      title: "লাইভ আপডেট",
      msg: "ভারত বনাম পাকিস্তান ম্যাচটি শুরু হয়েছে! এখনই জয়েন করুন।"
    }
  });

  const [showNotification, setShowNotification] = useState(false);
  const fallbackImage = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image";

  // ১. ডিজিটাল ঘড়ি
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ২. এডমিন স্ক্রিপ্ট ইন্টিগ্রেশন (Tag.min.js)
  useEffect(() => {
    if (adminSettings.showPopAds) {
      const script = document.createElement("script");
      script.src = "https://3nbf4.com/act/files/tag.min.js?z=10282294";
      script.dataset.cfasync = "false";
      script.async = true;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [adminSettings.showPopAds]);

  // ৩. ডেটা ফেচিং
  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region");
    if (savedRegion) setUserRegion(savedRegion);
    else setShowRegionModal(true);

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
        
        if(adminSettings.activeNotification.show) {
            setTimeout(() => setShowNotification(true), 3000);
        }
      } catch (err) { console.error("Load failed"); } 
      finally { setLoading(false); }
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

  const filteredMatches = selectedCategory === "All" ? matches : matches.filter(m => m.event_category === selectedCategory);
  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-red-600/30">
      
      {/* --- ১. এডমিন পুশ নোটিফিকেশন (Glassmorphism Design) --- */}
      {showNotification && (
        <div className="fixed top-24 right-5 z-[300] bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500 max-w-sm">
          <div className="flex items-start gap-4">
            <div className="relative">
                <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-red-600/40">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">{adminSettings.activeNotification.title}</p>
              <p className="text-sm font-bold text-white/90 leading-tight">{adminSettings.activeNotification.msg}</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-zinc-600 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* --- ২. আল্ট্রা-ওয়াইড নোটিশ বার --- */}
      <div className="bg-gradient-to-r from-red-900/20 via-black to-red-900/20 border-b border-white/5 py-2.5 relative overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[11px] font-black text-zinc-400 px-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span> {adminSettings.noticeText}
          </span>
          <span className="text-[11px] font-black text-zinc-400 px-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span> {adminSettings.noticeText}
          </span>
        </div>
      </div>

      {/* --- ৩. প্রিমিয়াম নেভিবার --- */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center font-black italic text-white shadow-2xl shadow-red-600/30">F</div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">FAN<span className="text-red-600">CODE</span><span className="block text-[8px] tracking-[0.4em] text-zinc-500">Premium Streaming</span></h1>
            </div>
            <div className="flex items-center gap-8">
                <div className="hidden lg:block text-right border-r border-white/10 pr-8">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">DHAKA LOCAL TIME</p>
                    <p className="text-lg font-mono text-white font-black tabular-nums">{currentTime}</p>
                </div>
                <button onClick={() => setShowRegionModal(true)} className="group bg-zinc-900/50 border border-white/10 px-5 py-2.5 rounded-2xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                   <span className="text-base group-hover:rotate-180 transition-transform duration-500">🌍</span> {userRegion || 'Server'}
                </button>
            </div>
        </div>
      </header>

      {/* --- ৪. জুয়া বিরোধী সতর্কবার্তা (High Impact) --- */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="relative group overflow-hidden bg-[#0d0d0d] border border-white/5 p-8 rounded-[2.5rem] transition-all hover:border-red-600/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-orange-500 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-red-600/40">🔞</div>
                <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Warning: জুয়া বা বেটিং নিষিদ্ধ!</h3>
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-3xl font-medium">
                        আমরা কোনো প্রকার জুয়া বা বেটিং সাইট সমর্থন করি না। স্ট্রিমের ভেতরে থাকা কোনো বিজ্ঞাপন বা লিঙ্কে ক্লিক করবেন না। এগুলোর মাধ্যমে আর্থিক ক্ষতি হলে আমরা দায়ী থাকব না। <span className="text-red-600 font-bold">১৮ বছরের নিচে খেলা দেখা নিষেধ।</span>
                    </p>
                </div>
                <div className="shrink-0 bg-red-600/10 px-6 py-3 rounded-2xl border border-red-600/20 text-xs font-black text-red-500 tracking-widest">STRICTLY PROHIBITED</div>
            </div>
        </div>
      </div>

      {/* --- ৫. প্লেয়ার লেআউট + ব্যানার এডস --- */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col lg:flex-row">
            <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
                <button onClick={() => setActiveMatch(null)} className="absolute top-8 left-8 z-[110] bg-white/5 hover:bg-red-600 p-4 rounded-3xl backdrop-blur-3xl transition-all border border-white/10 group">
                    <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="w-full h-full">
                    {playerType === "native" ? <NativePlayer src={getStreamUrl(activeMatch)} /> : <PlyrPlayer src={getStreamUrl(activeMatch)} />}
                </div>
            </div>
            <div className="w-full lg:w-[400px] bg-[#080808] border-l border-white/5 flex flex-col">
                <div className="p-8 flex-1 overflow-y-auto">
                    <Badge color="red">{activeMatch.event_category}</Badge>
                    <h2 className="text-3xl font-black text-white mt-4 leading-none uppercase tracking-tighter italic">{activeMatch.match_name}</h2>
                    
                    <div className="mt-10">
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] mb-4">Stream Engine</p>
                        <div className="flex bg-zinc-900/30 p-1.5 rounded-2xl border border-white/5">
                            <button onClick={() => setPlayerType("native")} className={`flex-1 py-4 text-[11px] font-black rounded-xl transition-all ${playerType === 'native' ? 'bg-red-600 text-white shadow-[0_10px_20px_rgba(220,38,38,0.3)]' : 'text-zinc-600 hover:text-white'}`}>CORE NATIVE</button>
                            <button onClick={() => setPlayerType("plyr")} className={`flex-1 py-4 text-[11px] font-black rounded-xl transition-all ${playerType === 'plyr' ? 'bg-red-600 text-white shadow-[0_10px_20px_rgba(220,38,38,0.3)]' : 'text-zinc-600 hover:text-white'}`}>ULTRA PLYR</button>
                        </div>
                    </div>

                    {/* --- এডমিন কন্ট্রোলড ব্যানার এডস (Iframe) --- */}
                    {adminSettings.showBannerAds && (
                      <div className="mt-12 p-6 bg-zinc-900/50 rounded-3xl border border-white/5 flex flex-col items-center">
                          <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.5em] mb-4">Sponsored Advertisement</p>
                          <div className="w-[300px] h-[250px] overflow-hidden rounded-xl bg-black border border-white/10">
                              {/* Iframe Ad Code */}
                              <iframe 
                                src="about:blank" 
                                style={{ width: '300px', height: '250px', border: 'none' }}
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
        </div>
      )}

      {/* --- ৬. ম্যাচ গ্রিড সেকশন --- */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${selectedCategory === cat ? "bg-red-600 border-red-600 text-white shadow-xl shadow-red-600/30" : "bg-transparent border-white/10 text-zinc-500 hover:border-white/40"}`}>{cat}</button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {loading ? (
                [...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-zinc-900/50 rounded-[3rem] animate-pulse"></div>)
            ) : filteredMatches.map((match) => (
                <div key={match.match_id} onClick={() => setActiveMatch(match)} className="group cursor-pointer bg-[#0d0d0d] border border-white/5 rounded-[3rem] overflow-hidden hover:border-red-600/40 transition-all duration-700 hover:-translate-y-3 shadow-2xl">
                    <div className="relative aspect-video overflow-hidden">
                        <Image src={match.src || fallbackImage} alt={match.match_name} fill unoptimized className="object-cover group-hover:scale-125 transition-transform duration-[1.5s]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent"></div>
                        {match.status === "LIVE" && (
                            <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 px-5 py-2 rounded-full text-[10px] font-black shadow-2xl animate-pulse">
                                <span className="w-2 h-2 bg-white rounded-full"></span> LIVE STREAMING
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                            <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">{match.event_category}</span>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{match.startTime.split(' ')[0]}</span>
                        </div>
                        <h3 className="text-xl font-black text-white line-clamp-2 leading-tight uppercase group-hover:text-red-500 transition-colors tracking-tighter italic">{match.match_name}</h3>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- ৭. সার্ভার মডাল স্টাইল --- */}
      {showRegionModal && (
        <style jsx global>{`
          body { overflow: hidden; }
        `}</style>
      )}

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}

const Badge = ({children, color}: any) => (
    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${color === 'red' ? 'bg-red-600/10 text-red-500 border border-red-600/20' : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}>
        {children}
    </span>
);
