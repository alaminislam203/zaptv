"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5">
    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs text-red-500 font-bold animate-pulse tracking-widest">LOADING...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

export default function ProfessionalLivePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const fallbackImage = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image";

  // --- ডিজিটাল ঘড়ি (দেশি সময়) ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region");
    if (savedRegion) setUserRegion(savedRegion);
    else setShowRegionModal(true);

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
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
    <main className="min-h-screen bg-[#050505] text-zinc-200">
      
      {/* --- ১. রিজিয়ন সিলেকশন মডাল --- */}
      {showRegionModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-2">সার্ভার নির্বাচন করুন</h2>
                <p className="text-zinc-500 text-xs mb-8">নিরবিচ্ছিন্ন স্ট্রিমের জন্য আপনার বর্তমান অবস্থান সিলেক্ট করুন</p>
                <div className="grid gap-4">
                    <button onClick={() => handleSetRegion("BD")} className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-all">🇧🇩 BANGLADESH SERVER</button>
                    <button onClick={() => handleSetRegion("IN")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all">🇮🇳 GLOBAL SERVER</button>
                </div>
            </div>
        </div>
      )}

      {/* --- ২. নেভিগেশন বার --- */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white px-2 py-1 rounded-md font-black text-sm italic">LIVE</div>
                <h1 className="text-xl font-bold tracking-tighter">FANCODE<span className="text-red-600">.TV</span></h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Local Time</p>
                    <p className="text-sm font-mono text-white">{currentTime}</p>
                </div>
                <button onClick={() => setShowRegionModal(true)} className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-zinc-800 transition">
                   🌐 {userRegion || 'Server'}
                </button>
            </div>
        </div>
      </header>

      {/* --- ৩. নোটিশ এবং জুয়া বিরোধী সতর্কবার্তা --- */}
      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-4">
        {/* জুয়া বিরোধী সতর্কতা */}
        <div className="bg-red-950/30 border border-red-500/20 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-red-600 p-2 rounded-lg text-white">⚠️</div>
            <div>
                <h3 className="text-red-500 font-bold text-sm">সতর্কবার্তা: জুয়া বা বেটিং নিষিদ্ধ!</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                   আমরা কোনো প্রকার জুয়া বা বেটিং সমর্থন করি না। স্ট্রিমের ভেতরে আসা থার্ড-পার্টি বিজ্ঞাপন এড়িয়ে চলুন। এগুলোর জন্য কর্তৃপক্ষ দায়ী নয়।
                </p>
            </div>
        </div>

        {/* সাধারণ নোটিশ */}
        <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-blue-600 p-2 rounded-lg text-white">📢</div>
            <div>
                <h3 className="text-blue-400 font-bold text-sm">লাইভ আপডেট ও নোটিশ</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                   যদি প্লেয়ার লোড না হয় তবে "Server Switch" করে দেখুন অথবা পেজটি রিফ্রেশ দিন। ইন্টারনেট কানেকশন চেক করুন।
                </p>
            </div>
        </div>
      </div>

      {/* --- ৪. ভিডিও প্লেয়ার লেআউট --- */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col lg:flex-row overflow-hidden">
            <div className="w-full lg:w-3/4 relative h-[30vh] md:h-full bg-black">
                <div className="absolute top-4 left-4 z-50 flex gap-2">
                    <button onClick={() => setActiveMatch(null)} className="bg-black/50 hover:bg-red-600 p-2 rounded-full backdrop-blur-md transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                </div>
                {playerType === "native" ? <NativePlayer src={getStreamUrl(activeMatch)} /> : <PlyrPlayer src={getStreamUrl(activeMatch)} />}
            </div>

            <div className="w-full lg:w-1/4 bg-[#0a0a0a] border-l border-white/5 flex flex-col">
                <div className="p-6">
                    <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">{activeMatch.event_category}</span>
                    <h2 className="text-xl font-bold text-white mt-1">{activeMatch.match_name}</h2>
                    
                    <div className="mt-8 space-y-4">
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Player Engine</p>
                        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
                            <button onClick={() => setPlayerType("native")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${playerType === 'native' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500'}`}>NATIVE</button>
                            <button onClick={() => setPlayerType("plyr")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${playerType === 'plyr' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500'}`}>PLYR V2</button>
                        </div>
                    </div>

                    <div className="mt-10 p-4 border border-dashed border-zinc-800 rounded-2xl text-center">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">Advertisement Slot</p>
                        <div className="aspect-square bg-zinc-900/50 rounded-xl flex items-center justify-center">
                             <span className="text-xs text-zinc-700">AD HERE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- ৫. ক্যাটাগরি এবং ফিল্টার --- */}
      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
            {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-tighter border transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-white text-black border-white" : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white"}`}>{cat}</button>
            ))}
        </div>
      </div>

      {/* --- ৬. ম্যাচ লিস্ট (থাম্বনেইল ফিক্সড) --- */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
                [...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-zinc-900 rounded-3xl animate-pulse"></div>)
            ) : filteredMatches.map((match) => (
                <div key={match.match_id} onClick={() => setActiveMatch(match)} className="group cursor-pointer bg-zinc-900/20 border border-white/5 rounded-[2rem] overflow-hidden hover:bg-zinc-900/40 transition-all hover:border-red-600/30">
                    <div className="relative aspect-video">
                        <Image 
                            src={match.src || fallbackImage} 
                            alt={match.match_name} 
                            fill 
                            unoptimized
                            className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                        {match.status === "LIVE" && (
                            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black shadow-xl animate-pulse">
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{match.event_category}</span>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase">{match.startTime.split(' ')[0]}</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">{match.match_name}</h3>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </main>
  );
}
