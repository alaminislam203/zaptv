"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5">
    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs text-red-500 font-bold animate-pulse tracking-widest uppercase">Loading Stream...</span>
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
  
  // --- নোটিফিকেশন ও নোটিশ স্টেট ---
  const [showNotification, setShowNotification] = useState(false);
  const [noticeText, setNoticeText] = useState("স্বাগতম! আমাদের সাইটে কোনো প্রকার জুয়া বা বেটিং বিজ্ঞাপন প্রচার করা হয় না। নিরবিচ্ছিন্নভাবে খেলা দেখুন।");

  const fallbackImage = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image";

  // ১. ডিজিটাল ঘড়ি (বাংলাদেশী সময়)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ২. ডেটা লোড এবং নোটিফিকেশন ট্রিগার
  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region");
    if (savedRegion) setUserRegion(savedRegion);
    else setShowRegionModal(true);

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
        
        // ম্যাচ লোড হলে একটি নোটিফিকেশন দেখাবে
        if(data.matches?.length > 0) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 6000);
        }
      } catch (err) { console.error("Failed to load"); } 
      finally { setLoading(false); }
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

  const filteredMatches = selectedCategory === "All" ? matches : matches.filter(m => m.event_category === selectedCategory);
  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-red-600/30">
      
      {/* --- পুশ নোটিফিকেশন (Top-Right) --- */}
      {showNotification && (
        <div className="fixed top-20 right-5 z-[300] bg-zinc-900 border-l-4 border-red-600 p-4 rounded-xl shadow-2xl animate-in slide-in-from-right duration-500 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/20 p-2 rounded-full text-red-500 animate-pulse">🔔</div>
            <div>
              <p className="text-xs font-black text-white">Live Update</p>
              <p className="text-[11px] text-zinc-400">নতুন ম্যাচগুলো এখন লাইভ! উপভোগ করুন।</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-zinc-600 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* --- স্ক্রলিং নোটিশ বার --- */}
      <div className="bg-red-600/10 border-b border-red-600/20 py-2 relative overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-xs font-bold text-red-500 px-4 uppercase tracking-tighter">[!] NOTICE: {noticeText}</span>
          <span className="text-xs font-bold text-red-500 px-4 uppercase tracking-tighter">[!] NOTICE: {noticeText}</span>
        </div>
      </div>

      {/* --- ১. সার্ভার মডাল --- */}
      {showRegionModal && (
        <div className="fixed inset-0 z-[200] bg-black/98 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-[#0f0f11] border border-white/10 p-10 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl">
                <div className="text-5xl mb-4">🌍</div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">সার্ভার নির্বাচন করুন</h2>
                <p className="text-zinc-500 text-xs mb-8">নিরবিচ্ছিন্ন লাইভ স্ট্রিম দেখতে আপনার বর্তমান অবস্থান সিলেক্ট করুন</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => handleSetRegion("BD")} className="bg-white text-black font-black py-4 rounded-2xl hover:bg-green-500 transition-colors">🇧🇩 BANGLADESH SERVER</button>
                    <button onClick={() => handleSetRegion("IN")} className="bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-colors">🇮🇳 GLOBAL SERVER</button>
                </div>
            </div>
        </div>
      )}

      {/* --- ২. নেভিগেশন বার --- */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-black italic text-white shadow-lg shadow-red-600/20">L</div>
                <h1 className="text-xl font-black tracking-tighter uppercase">Fan<span className="text-red-600">Code</span></h1>
            </div>
            <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Dhaka Time</p>
                    <p className="text-sm font-mono text-white font-bold">{currentTime}</p>
                </div>
                <button onClick={() => setShowRegionModal(true)} className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-zinc-800 transition uppercase tracking-widest">
                   📡 {userRegion || 'Switch'}
                </button>
            </div>
        </div>
      </header>

      {/* --- ৩. জুয়া ও বেটিং সতর্কবার্তা বক্স --- */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-gradient-to-br from-red-950/40 to-black border border-red-900/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-xl shadow-red-600/20">🔞</div>
            <div className="text-center md:text-left flex-1">
                <h3 className="text-red-500 font-black text-lg uppercase tracking-tight">Warning: জুয়া বা বেটিং নিষিদ্ধ!</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                    আমরা কোনো প্রকার জুয়া বা বেটিং সাইট সমর্থন করি না। স্ট্রিমের ভেতরে থাকা কোনো থার্ড-পার্টি বিজ্ঞাপন বা লিঙ্কে ক্লিক করবেন না। এসব লিঙ্কের মাধ্যমে আর্থিক ক্ষতি হলে কর্তৃপক্ষ দায়ী নয়।
                </p>
            </div>
            <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-white/5 text-[10px] font-bold text-zinc-500">18+ ONLY</div>
        </div>
      </div>

      {/* --- ৪. ভিডিও প্লেয়ার লেআউট (Active Match) --- */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col lg:flex-row">
            <div className="flex-1 relative bg-black flex items-center justify-center">
                <button onClick={() => setActiveMatch(null)} className="absolute top-6 left-6 z-[110] bg-white/10 hover:bg-red-600 p-3 rounded-full backdrop-blur-xl transition-all border border-white/10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="w-full h-full max-h-screen">
                    {playerType === "native" ? <NativePlayer src={getStreamUrl(activeMatch)} /> : <PlyrPlayer src={getStreamUrl(activeMatch)} />}
                </div>
            </div>
            <div className="w-full lg:w-80 bg-[#080808] border-l border-white/5 p-6 flex flex-col overflow-y-auto">
                <Badge color="red">{activeMatch.event_category}</Badge>
                <h2 className="text-xl font-black text-white mt-3 leading-tight uppercase tracking-tighter">{activeMatch.match_name}</h2>
                <div className="mt-8">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3">Switch Engine</p>
                    <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => setPlayerType("native")} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${playerType === 'native' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`}>NATIVE</button>
                        <button onClick={() => setPlayerType("plyr")} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${playerType === 'plyr' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`}>PLYR V3</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- ৫. ক্যাটাগরি ফিল্টার --- */}
      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedCategory === cat ? "bg-red-600 border-red-600 text-white" : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20"}`}>{cat}</button>
            ))}
        </div>
      </div>

      {/* --- ৬. ম্যাচ লিস্ট --- */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
                [...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-zinc-900 rounded-[2rem] animate-pulse"></div>)
            ) : filteredMatches.map((match) => (
                <div key={match.match_id} onClick={() => setActiveMatch(match)} className="group cursor-pointer bg-[#0f0f11] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-red-600/40 transition-all duration-500 shadow-2xl">
                    <div className="relative aspect-video">
                        <Image src={match.src || fallbackImage} alt={match.match_name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                        {match.status === "LIVE" && (
                            <div className="absolute top-5 left-5 flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black shadow-2xl animate-pulse">
                                <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
                            </div>
                        )}
                    </div>
                    <div className="p-7">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{match.event_category}</span>
                            <span className="text-[10px] text-zinc-600 font-bold">{match.startTime.split(' ')[0]}</span>
                        </div>
                        <h3 className="text-lg font-black text-zinc-200 line-clamp-2 leading-tight uppercase group-hover:text-white transition-colors tracking-tighter">{match.match_name}</h3>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}

// হেল্পার কম্পোনেন্ট
const Badge = ({children, color}: any) => (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${color === 'red' ? 'bg-red-600/10 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>
        {children}
    </span>
);
