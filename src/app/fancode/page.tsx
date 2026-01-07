"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-3 relative overflow-hidden rounded-xl">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/20 to-transparent animate-shimmer"></div>
    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin z-10"></div>
    <span className="text-xs text-red-400 font-mono animate-pulse z-10 tracking-widest">LOADING FANCODE STREAM...</span>
  </div>
);

// আপনার তৈরি করা কাস্টম প্লেয়ারগুলো ইমপোর্ট করুন
const PlyrPlayer = dynamic(() => import("../../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

// --- ICONS ---
const Icons = {
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Back: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Live: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
};

// --- INTERFACES ---
interface FanCodeEvent {
  event_category: string;
  title: string;
  src: string; // Image URL
  team_1: string;
  team_2: string;
  status: string;
  event_name: string;
  match_name: string;
  match_id: number;
  startTime: string;
  dai_url: string;
  adfree_url: string;
}

export default function FanCodePage() {
  const [events, setEvents] = useState<FanCodeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Player State
  const [activeMatch, setActiveMatch] = useState<FanCodeEvent | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");

  // Fetch Data
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/alaminislam203/my_playlist/refs/heads/main/fancode.json");
        const data = await res.json();
        // নিশ্চিত করি data একটি অ্যারে
        if (Array.isArray(data)) {
            setEvents(data);
        } else {
            console.error("Invalid Data Format");
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filter Logic
  const categories = ["All", ...Array.from(new Set(events.map(e => e.event_category)))];
  const filteredEvents = selectedCategory === "All" 
    ? events 
    : events.filter(e => e.event_category === selectedCategory);

  // Helper to format date
  const formatDate = (dateStr: string) => {
    // Assuming format: "07:00:00 PM 07-01-2026"
    // Just returning raw string or simple parsing can be done
    return dateStr.split(' ').slice(0, 2).join(' '); // "07:00:00 PM"
  };

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-200 font-sans relative selection:bg-red-500/30">
      
      {/* --- CINEMATIC PLAYER OVERLAY --- */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-black animate-fadeIn flex flex-col">
            {/* Overlay Header */}
            <div className="bg-gradient-to-b from-black/90 to-transparent p-4 flex justify-between items-center z-10 absolute top-0 w-full">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setActiveMatch(null)} 
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition text-white"
                    >
                        <Icons.Back />
                    </button>
                    <div>
                        <h2 className="text-white font-bold text-sm md:text-lg line-clamp-1">{activeMatch.match_name}</h2>
                        <p className="text-zinc-400 text-xs">{activeMatch.event_name}</p>
                    </div>
                </div>
                
                {/* Engine Switcher inside Player Mode */}
                <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
                    <button onClick={() => setPlayerType("native")} className={`px-3 py-1 rounded-full text-xs font-bold transition ${playerType === 'native' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>Native</button>
                    <button onClick={() => setPlayerType("plyr")} className={`px-3 py-1 rounded-full text-xs font-bold transition ${playerType === 'plyr' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>Plyr</button>
                </div>
            </div>

            {/* Main Player Area */}
            <div className="flex-1 flex items-center justify-center bg-black relative group">
                <div className="w-full h-full max-h-screen aspect-video relative">
                    {/* Prefer adfree_url, fallback to dai_url */}
                    {playerType === "native" ? (
                        <NativePlayer src={activeMatch.adfree_url || activeMatch.dai_url} />
                    ) : (
                        <PlyrPlayer src={activeMatch.adfree_url || activeMatch.dai_url} />
                    )}
                </div>
            </div>

            {/* Overlay Footer/Controls */}
            <div className="p-4 bg-gradient-to-t from-zinc-900 to-black text-center space-y-2">
                <p className="text-xs text-zinc-500">
                    Watching on <span className="text-red-500 font-bold">FanCode Premium</span> via ZapTV
                </p>
                <button 
                    onClick={() => setActiveMatch(null)}
                    className="text-xs text-white underline decoration-zinc-600 hover:decoration-white underline-offset-4"
                >
                    Close Player & Return to Menu
                </button>
            </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT (Hidden when player is active) --- */}
      <div className={`transition-all duration-500 ${activeMatch ? 'opacity-0 pointer-events-none blur-xl scale-95 h-screen overflow-hidden' : 'opacity-100 scale-100'}`}>
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-lg border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition group">
                    <Icons.Back />
                    <span className="font-bold hidden sm:block">Home</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                        <span className="text-black font-black text-xs">FC</span>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Fan<span className="text-red-500">Code</span> Live</h1>
                </div>
                <div className="w-8"></div> 
            </div>
        </header>

        {/* Warning & Info */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider">Disclaimer</h3>
                        <p className="text-xs text-zinc-400 max-w-2xl mt-1">
                            এই লিংকগুলো থার্ড পার্টি সোর্স থেকে সংগৃহীত। আমরা কোনো কন্টেন্ট হোস্ট করি না। স্ট্রিম বাফারিং হলে অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন অথবা প্লেয়ার পরিবর্তন করুন।
                        </p>
                    </div>
                </div>
                <Link href="/support" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-red-900/20 whitespace-nowrap">
                    Report Issue
                </Link>
            </div>
        </div>

        {/* Filter Tabs */}
        <div className="max-w-7xl mx-auto px-4 mt-8">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Match Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="bg-zinc-900/50 h-64 rounded-2xl"></div>
                    ))}
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                    No active matches found in this category.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((match) => {
                        const isLive = match.status === "LIVE";
                        return (
                            <div 
                                key={match.match_id} 
                                onClick={() => setActiveMatch(match)}
                                className="group relative bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/10"
                            >
                                {/* Thumbnail Container */}
                                <div className="aspect-video w-full relative overflow-hidden bg-black">
                                    <Image 
                                        src={match.src} 
                                        alt={match.match_name}
                                        fill
                                        className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-700"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                                    
                                    {/* Live Badge */}
                                    {isLive && (
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg shadow-red-600/20 animate-pulse">
                                            <Icons.Live /> LIVE
                                        </div>
                                    )}

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 backdrop-blur-[2px]">
                                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.6)] transform scale-50 group-hover:scale-100 transition duration-300">
                                            <Icons.Play />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                            {match.event_category}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-800/50 px-2 py-1 rounded">
                                            <Icons.Calendar /> {formatDate(match.startTime)}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-red-400 transition">
                                        {match.match_name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 line-clamp-1">{match.event_name}</p>

                                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Stream Ready</span>
                                        </div>
                                        <button className="text-xs font-bold text-white bg-zinc-800 hover:bg-white hover:text-black px-3 py-1.5 rounded-lg transition">
                                            Watch Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

      </div>
    </main>
  );
}
