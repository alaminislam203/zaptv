"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS (Players) ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-3 relative overflow-hidden rounded-xl">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/20 to-transparent animate-shimmer"></div>
    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin z-10"></div>
    <span className="text-xs text-red-400 font-mono animate-pulse z-10 tracking-widest">LOADING STREAM...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

// --- ICONS ---
const Icons = {
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Back: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>, // New Close Icon
  Live: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Warning: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

// --- INTERFACES ---
interface MatchData {
  event_category: string;
  title: string;
  src: string;
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

interface JsonResponse {
  name: string;
  telegram: string;
  matches: MatchData[];
}

export default function FanCodePage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [activeMatch, setActiveMatch] = useState<MatchData | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");

  const fallbackImage = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to connect");
        const data: JsonResponse = await res.json();
        if (data.matches && Array.isArray(data.matches)) {
            setMatches(data.matches);
        } else {
            setErrorMsg("Data format mismatch.");
        }
      } catch (err) {
        setErrorMsg("Failed to load match list.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStreamUrl = (match: MatchData) => {
    if (match.adfree_url && match.adfree_url.startsWith("http")) return match.adfree_url;
    if (match.dai_url && match.dai_url.startsWith("http")) return match.dai_url;
    return "";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split(" ").slice(0, 2).join(" ");
  };

  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];
  const filteredMatches = selectedCategory === "All" ? matches : matches.filter(m => m.event_category === selectedCategory);

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-200 font-sans relative selection:bg-red-500/30">
      
      {/* --- CINEMATIC PLAYER OVERLAY --- */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-black animate-fadeIn flex flex-col">
            
            {/* Header with Stylish Close Button */}
            <div className="bg-gradient-to-b from-black/90 to-transparent p-4 md:p-6 flex justify-between items-start z-20 absolute top-0 w-full pointer-events-none">
                
                {/* Match Info (Left) */}
                <div className="pointer-events-auto flex items-center gap-4 bg-black/40 backdrop-blur-md p-2 pr-6 rounded-full border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                        <Icons.Live />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm line-clamp-1">{activeMatch.match_name}</h2>
                        <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{activeMatch.event_category}</p>
                    </div>
                </div>
                
                {/* Right Side Controls */}
                <div className="pointer-events-auto flex items-center gap-3">
                    {/* Engine Switcher */}
                    <div className="hidden md:flex bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                        <button onClick={() => setPlayerType("native")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${playerType === 'native' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>Native</button>
                        <button onClick={() => setPlayerType("plyr")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${playerType === 'plyr' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>Plyr</button>
                    </div>

                    {/* 🔥 BEAUTIFUL CLOSE BUTTON 🔥 */}
                    <button 
                        onClick={() => setActiveMatch(null)} 
                        className="group relative w-12 h-12 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                        title="Close Player"
                    >
                        <span className="transform group-hover:rotate-90 transition-transform duration-300">
                            <Icons.Close />
                        </span>
                    </button>
                </div>
            </div>

            {/* Video Player Area */}
            <div className="flex-1 flex items-center justify-center bg-black relative group">
                <div className="w-full h-full max-h-screen aspect-video relative">
                    {(() => {
                        const url = getStreamUrl(activeMatch);
                        if (!url) return <div className="text-red-500 flex flex-col gap-2 items-center justify-center h-full"><Icons.Warning/><span>Stream Unavailable</span></div>;
                        return playerType === "native" ? <NativePlayer src={url} /> : <PlyrPlayer src={url} />;
                    })()}
                </div>
            </div>

            {/* Mobile Controls (Bottom) */}
            <div className="md:hidden p-4 bg-zinc-900 flex justify-center pb-8">
                 <div className="flex bg-zinc-800 rounded-lg p-1 border border-white/5 w-full max-w-xs">
                    <button onClick={() => setPlayerType("native")} className={`flex-1 py-2 rounded text-xs font-bold transition ${playerType === 'native' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Native Player</button>
                    <button onClick={() => setPlayerType("plyr")} className={`flex-1 py-2 rounded text-xs font-bold transition ${playerType === 'plyr' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Plyr Engine</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <div className={`transition-all duration-700 ease-in-out ${activeMatch ? 'opacity-0 pointer-events-none blur-2xl scale-90 h-screen overflow-hidden' : 'opacity-100 scale-100'}`}>
        
        <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-lg border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition group">
                    <Icons.Back /> <span className="font-bold hidden sm:block">Back</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-black text-xs tracking-tighter">FC</span>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Fan<span className="text-red-600">Code</span> Hub</h1>
                </div>
                <div className="w-8"></div> 
            </div>
        </header>

        {/* Warning Banner */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="p-2 bg-red-500/10 rounded text-red-500"><Icons.Warning /></div>
                <div>
                    <h3 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-0.5">Disclaimer</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                        These streams are from third-party sources. If buffering occurs, switch player engine.
                    </p>
                </div>
            </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-7xl mx-auto px-4 mt-8">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Matches Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[...Array(6)].map((_, n) => <div key={n} className="bg-zinc-900/50 h-64 rounded-2xl border border-white/5"></div>)}
                </div>
            ) : errorMsg ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-red-900/30 text-red-400">{errorMsg}</div>
            ) : filteredMatches.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-800 border-dashed">No matches found in this category.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMatches.map((match) => {
                        const isLive = match.status === "LIVE";
                        return (
                            <div key={match.match_id} onClick={() => setActiveMatch(match)} className="group relative bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-600/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/10">
                                <div className="aspect-video w-full relative overflow-hidden bg-black">
                                    <Image src={match.src || fallbackImage} alt={match.match_name} fill className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-700" unoptimized onError={(e) => { e.currentTarget.src = fallbackImage }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                                    {isLive && <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-pulse"><Icons.Live /> LIVE</div>}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                        <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transform scale-50 group-hover:scale-100 transition duration-300 backdrop-blur-sm"><Icons.Play /></div>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-900/20 px-2 py-1 rounded border border-red-900/30">{match.event_category}</span>
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700/50"><Icons.Calendar /> {formatDate(match.startTime)}</div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white leading-snug mb-1 group-hover:text-red-500 transition line-clamp-2">{match.match_name}</h3>
                                    <p className="text-xs text-zinc-500 line-clamp-1">{match.event_name}</p>
                                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div><span className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">{isLive ? 'Streaming Now' : 'Scheduled'}</span></div>
                                        <button className="text-xs font-bold text-black bg-white hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-lg transition shadow-lg">Watch</button>
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
