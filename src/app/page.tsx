"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center gap-4 rounded-xl border border-white/5">
    <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Connecting Stream...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

export default function UpdatedHomePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState(""); // নতুন সার্চ ফাংশন
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");
  const [userRegion, setUserRegion] = useState<string | null>(null);

  const fallbackImage = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image";

  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region") || "IN";
    setUserRegion(savedRegion);

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Data load failed");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTER & SEARCH LOGIC ---
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const categoryMatch = selectedCategory === "All" || m.event_category === selectedCategory;
      const searchMatch = m.match_name.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [matches, selectedCategory, searchQuery]);

  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 font-sans">
      
      {/* 1. প্রোফেশনাল নেভিগেশন */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black tracking-tighter text-white">
              FAN<span className="text-red-600">CODE</span>
            </h1>
            <div className="hidden md:flex bg-zinc-900 rounded-lg px-3 py-1.5 border border-white/5">
              <input 
                type="text" 
                placeholder="Search match..." 
                className="bg-transparent border-none focus:ring-0 text-xs w-48 text-zinc-300"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-white/5 uppercase">
               {userRegion} Server
             </span>
          </div>
        </div>
      </nav>

      {/* 2. ভিডিও প্লেয়ার ওভারলে (আপনার অরিজিনাল লজিক ঠিক রেখে ডিজাইন উন্নত করা হয়েছে) */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col lg:flex-row">
            <div className="flex-1 relative group">
                <button 
                  onClick={() => setActiveMatch(null)}
                  className="absolute top-4 left-4 z-50 bg-white/10 hover:bg-red-600 p-2 rounded-full backdrop-blur-md transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                
                <div className="w-full h-full">
                   {playerType === "native" ? 
                    <NativePlayer src={activeMatch.adfree_url || activeMatch.dai_url} /> : 
                    <PlyrPlayer src={activeMatch.adfree_url || activeMatch.dai_url} />
                   }
                </div>
            </div>
            
            {/* সাইডবার (ADS/INFO) */}
            <div className="w-full lg:w-80 bg-[#0a0a0a] border-l border-white/5 p-4 overflow-y-auto">
                <h2 className="text-sm font-bold mb-4 border-b border-white/5 pb-2">Match Info</h2>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 mb-6">
                    <p className="text-xs text-zinc-400 mb-1">{activeMatch.event_category}</p>
                    <h3 className="text-white font-bold text-sm leading-tight">{activeMatch.match_name}</h3>
                </div>
                
                <div className="flex bg-zinc-900 p-1 rounded-lg mb-6">
                    <button onClick={() => setPlayerType("native")} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${playerType === 'native' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>NATIVE</button>
                    <button onClick={() => setPlayerType("plyr")} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${playerType === 'plyr' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>PLYR</button>
                </div>
                
                <div className="aspect-[3/4] bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5">
                    <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Advertisement</span>
                </div>
            </div>
        </div>
      )}

      {/* 3. ক্যাটাগরি ফিল্টার */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase transition-all border ${
                selectedCategory === cat ? "bg-red-600 border-red-600 text-white shadow-lg" : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ম্যাচ গ্রিড (থাম্বনেইল ফিক্স সহ) */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
             [...Array(8)].map((_, i) => <div key={i} className="aspect-video bg-zinc-900 rounded-2xl animate-pulse"></div>)
          ) : filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <div 
                key={match.match_id}
                onClick={() => setActiveMatch(match)}
                className="group cursor-pointer bg-[#0f0f11] border border-white/5 rounded-2xl overflow-hidden hover:border-red-600/30 transition-all"
              >
                {/* ইমেজ কন্টেইনার */}
                <div className="relative aspect-video w-full">
                  <Image 
                    src={match.src || fallbackImage} 
                    alt={match.match_name} 
                    fill 
                    unoptimized // এটি ইমেজ লোড করতে সাহায্য করবে
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  
                  {match.status === "LIVE" && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded text-[9px] font-black animate-pulse">
                      LIVE
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-[9px] font-bold text-red-500 uppercase mb-1">{match.event_category}</p>
                  <h3 className="text-sm font-bold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                    {match.match_name}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">{match.startTime.split(' ')[0]}</span>
                    <button className="text-[10px] font-bold bg-white text-black px-3 py-1 rounded-md group-hover:bg-red-600 group-hover:text-white transition-colors">
                      WATCH
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-zinc-600">No matches available.</div>
          )}
        </div>
      </div>
    </main>
  );
}
