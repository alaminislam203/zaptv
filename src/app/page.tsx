"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-[300px] md:h-full bg-zinc-900 flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-800">
    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-zinc-500 font-medium animate-pulse">Initializing Secure Stream...</p>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

// --- UI COMPONENTS & ICONS (Optimized) ---
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${className}`}>
    {children}
  </span>
);

export default function EnhancedHomePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [userRegion, setUserRegion] = useState<string | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setUserRegion(localStorage.getItem("fc_region") || "IN");
  }, []);

  // --- FILTERING LOGIC ---
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchesCat = selectedCategory === "All" || m.event_category === selectedCategory;
      const matchesSearch = m.match_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [matches, selectedCategory, searchQuery]);

  const categories = ["All", ...Array.from(new Set(matches.map((m) => m.event_category)))];

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 selection:bg-red-500/50">
      
      {/* 1. NEW NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                <span className="text-white font-black text-sm">LIVE</span>
              </div>
              <span className="text-xl font-bold tracking-tighter">STREAM<span className="text-red-600">X</span></span>
            </Link>
            
            {/* Desktop Search */}
            <div className="hidden md:flex items-center bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-1.5 focus-within:border-red-500/50 transition-all">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input 
                type="text" 
                placeholder="Search matches..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-64 ml-2"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition">
              <div className={`w-2 h-2 rounded-full ${userRegion === 'BD' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              {userRegion === 'BD' ? 'Bangladesh' : 'Global'}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-orange-400 border border-white/10"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* 2. HERO SECTION (Highlighted Match) */}
        {!activeMatch && filteredMatches.length > 0 && (
          <div className="relative w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden mb-12 group">
            <Image 
              src={filteredMatches[0].src} 
              alt="Hero" 
              fill 
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/40 to-transparent"></div>
            <div className="absolute bottom-10 left-6 md:left-12 max-w-2xl">
              <Badge className="bg-red-600 text-white mb-4">Featured Match</Badge>
              <h1 className="text-3xl md:text-6xl font-black mb-4 leading-tight">{filteredMatches[0].match_name}</h1>
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveMatch(filteredMatches[0])}
                  className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-red-600 hover:text-white transition-all transform hover:scale-105"
                >
                  Watch Now
                </button>
                <button className="bg-zinc-800/80 backdrop-blur-md text-white px-8 py-3 rounded-full font-bold border border-white/10">
                  Match Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CATEGORY FILTERS */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto gap-4 no-scrollbar">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedCategory === cat 
                  ? "bg-red-600 border-red-500 shadow-lg shadow-red-600/20" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4. MATCHES GRID (Redesigned Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
             [...Array(8)].map((_, i) => <div key={i} className="h-64 bg-zinc-900/50 rounded-2xl animate-pulse"></div>)
          ) : (
            filteredMatches.map((match) => (
              <div 
                key={match.match_id}
                className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden hover:bg-zinc-900/60 transition-all hover:border-red-500/50"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image 
                    src={match.src} 
                    alt={match.match_name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {match.status === "LIVE" && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded text-[10px] font-bold animate-pulse">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                       onClick={() => setActiveMatch(match)}
                       className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform"
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Badge className="bg-zinc-800 text-zinc-400">{match.event_category}</Badge>
                    <span className="text-[10px] text-zinc-500 font-mono">{match.startTime.split(' ')[0]}</span>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-2 group-hover:text-red-500 transition-colors">{match.match_name}</h3>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 5. FLOATING PLAYER MINI (When scrolling) */}
      {activeMatch && (
        <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm md:max-w-xl animate-slideUp">
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-zinc-800 px-4 py-2 flex justify-between items-center">
                <span className="text-xs font-bold truncate pr-4">{activeMatch.match_name}</span>
                <button onClick={() => setActiveMatch(null)} className="text-zinc-400 hover:text-white">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="aspect-video bg-black">
                <NativePlayer src={activeMatch.adfree_url || activeMatch.dai_url} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
