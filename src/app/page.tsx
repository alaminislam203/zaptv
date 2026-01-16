"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import UserAdDisplay from "../../components/UserAdDisplay";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-3 relative overflow-hidden rounded-xl">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/20 to-transparent animate-shimmer"></div>
    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin z-10"></div>
    <span className="text-xs text-red-400 font-mono animate-pulse z-10 tracking-widest">LOADING STREAM...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

// --- ICONS ---
const Icons = {
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  Back: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>,
  Live: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Globe: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Warning: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Share: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Info: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Maximize: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
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
  matches: MatchData[];
}

export default function FanCodePage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<number | null>(null);
    
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const [activeMatch, setActiveMatch] = useState<MatchData | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");

  const fallbackImage = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image";

  // --- AD SCRIPT INTEGRATION ---
  useEffect(() => {
    // WARNING: This script injects ads (Pop-under/Direct Link)
    const script = document.createElement("script");
    script.dataset.zone = "10282293";
    script.src = "https://al5sm.com/tag.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // --- DATA FETCHING & DEEP LINK LOGIC ---
  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region");
    if (savedRegion) setUserRegion(savedRegion);
    else setShowRegionModal(true);

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json", { cache: "no-store" });
        const data: JsonResponse = await res.json();
        if (data.matches && Array.isArray(data.matches)) {
            setMatches(data.matches);
            
            // Check for Shared Match ID in URL
            const params = new URLSearchParams(window.location.search);
            const sharedMatchId = params.get('id');
            if (sharedMatchId) {
                const target = data.matches.find((m) => m.match_id.toString() === sharedMatchId);
                if (target) setActiveMatch(target);
            }
        }
      } catch (err) { console.error("Failed to load matches"); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleSetRegion = (region: string) => {
    setUserRegion(region);
    localStorage.setItem("fc_region", region);
    setShowRegionModal(false);
  };

  const handleShare = (e: React.MouseEvent, match: MatchData) => {
    e.stopPropagation();
    const link = `${window.location.origin}/fancode?id=${match.match_id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(match.match_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStreamUrl = (match: MatchData) => {
    let url = "";
    if (match.adfree_url && match.adfree_url.startsWith("http")) url = match.adfree_url;
    else if (match.dai_url && match.dai_url.startsWith("http")) url = match.dai_url;
    
    if (!url) return "";
    return userRegion === "BD" ? url.replace("https://in", "https://bd") : url;
  };

  const formatDate = (dateStr: string) => dateStr ? dateStr.split(" ").slice(0, 2).join(" ") : "";
  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];
  const filteredMatches = selectedCategory === "All" ? matches : matches.filter(m => m.event_category === selectedCategory);

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-200 font-sans relative selection:bg-red-500/30">
      
      {/* --- REGION MODAL --- */}
      {showRegionModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#18181b] border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-2">Select Your Region</h2>
                <p className="text-zinc-400 text-sm mb-6">Select your current location for best playback experience.</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleSetRegion("BD")} className="bg-green-900/20 border border-green-500/30 hover:bg-green-600 hover:text-white text-green-400 font-bold py-4 rounded-xl transition flex flex-col items-center gap-2"><span className="text-2xl">🇧🇩</span> Bangladesh</button>
                    <button onClick={() => handleSetRegion("IN")} className="bg-blue-900/20 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-blue-400 font-bold py-4 rounded-xl transition flex flex-col items-center gap-2"><span className="text-2xl">🇮🇳</span> India / Global</button>
                </div>
            </div>
        </div>
      )}

      {/* --- SPLIT LAYOUT PLAYER OVERLAY --- */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-[#050505] animate-fadeIn flex flex-col lg:flex-row overflow-hidden">
            
            {/* LEFT SIDE: VIDEO PLAYER (75%) */}
            <div className="w-full lg:w-3/4 h-full flex flex-col relative bg-black">
                
                {/* Custom Header INSIDE Player Area */}
                <div className="absolute top-0 left-0 w-full z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-4 flex justify-between items-start pointer-events-none">
                     <div className="pointer-events-auto flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]"></div>
                        <div>
                            <h2 className="text-white font-bold text-sm md:text-lg line-clamp-1">{activeMatch.match_name}</h2>
                            <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{activeMatch.event_category} • {userRegion === "BD" ? "Bangladesh Server" : "International Server"}</p>
                        </div>
                    </div>

                    <div className="pointer-events-auto flex gap-2">
                        {/* Player Switcher */}
                         <div className="hidden md:flex bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10">
                            <button onClick={() => setPlayerType("native")} className={`px-3 py-1 rounded text-[10px] font-bold transition ${playerType === 'native' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>Native</button>
                            <button onClick={() => setPlayerType("plyr")} className={`px-3 py-1 rounded text-[10px] font-bold transition ${playerType === 'plyr' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>Plyr</button>
                        </div>

                        {/* Close Button */}
                        <button 
                            onClick={() => {
                                setActiveMatch(null);
                                window.history.pushState({}, '', window.location.pathname);
                            }} 
                            className="bg-red-600 hover:bg-red-500 text-white w-9 h-9 flex items-center justify-center rounded-lg shadow-lg transition-all"
                        >
                            <Icons.Close />
                        </button>
                    </div>
                </div>

                {/* Main Player */}
                <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
                     {(() => {
                        const url = getStreamUrl(activeMatch);
                        if (!url) return <div className="text-red-500 flex flex-col gap-2 items-center justify-center h-full"><Icons.Warning/><span>Stream Unavailable</span></div>;
                        return playerType === "native" ? <NativePlayer src={url} /> : <PlyrPlayer src={url} />;
                    })()}
                </div>

                {/* Mobile Controls (Only visible on small screens below player) */}
                <div className="lg:hidden p-3 bg-zinc-900 border-t border-zinc-800">
                     <div className="flex bg-zinc-800 rounded p-1 border border-white/5 w-full">
                        <button onClick={() => setPlayerType("native")} className={`flex-1 py-2 rounded text-xs font-bold transition ${playerType === 'native' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Native</button>
                        <button onClick={() => setPlayerType("plyr")} className={`flex-1 py-2 rounded text-xs font-bold transition ${playerType === 'plyr' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Plyr</button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: ADS / SIDEBAR (25%) */}
            <div className="hidden lg:flex w-1/4 h-full bg-[#0a0a0a] border-l border-zinc-800 flex-col relative z-50">
                {/* Sidebar Header */}
                <div className="h-14 border-b border-zinc-800 flex items-center px-4 bg-[#0f0f11]">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sponsored Content</span>
                </div>

                {/* Ad Content Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    
                    {/* Primary Ad Unit (Simulating the 'Claim' ad from screenshot) */}
                    <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative group border border-zinc-800 hover:border-green-500/50 transition-all">
                         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                         
                         <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col items-center text-center">
                             <h3 className="text-2xl font-black text-white italic mb-1">WIN BIG TODAY!</h3>
                             <p className="text-green-400 text-sm font-bold mb-4">100% DEPOSIT BONUS</p>
                             <a 
  href="https://otieu.com/4/7249389"  // <-- এখানে আপনার লিংক দিন
  target="_blank"                             // নতুন ট্যাবে ওপেন হওয়ার জন্য
  rel="noopener noreferrer"                   // সিকিউরিটির জন্য
  className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl shadow-lg shadow-green-500/20 transform hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
>
    CLAIM NOW <Icons.Check />
</a>
                             <p className="text-[9px] text-zinc-500 mt-3">Terms & Conditions Apply. 18+ Only.</p>
                         </div>
                    </div>

                    {/* Secondary Ad Slot */}
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        ADVERTISEMENT
                    </div>

                     {/* Chat/Info Placeholder */}
                     <div className="mt-auto bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                         <h4 className="text-white text-sm font-bold mb-2 flex items-center gap-2"><Icons.Info /> Stream Info</h4>
                         <p className="text-xs text-zinc-400 leading-relaxed">
                             Watching <strong>{activeMatch.match_name}</strong>. If playback issues occur, try switching the player engine or reloading the page.
                         </p>
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <div className={`transition-all duration-700 ease-in-out ${activeMatch ? 'opacity-0 pointer-events-none blur-xl scale-95 h-screen overflow-hidden' : 'opacity-100 scale-100'}`}>
        
        {/* Navbar */}
        <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-lg border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition group"><Icons.Back /> <span className="font-bold hidden sm:block">Back</span></Link>
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-white flex items-center justify-center shadow-lg"><span className="text-black font-black text-xs">FC</span></div><h1 className="text-xl font-bold text-white tracking-tight">Fan<span className="text-red-600">Code</span></h1></div>
                </div>
                <button onClick={() => setShowRegionModal(true)} className="flex items-center gap-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300 transition border border-white/5"><Icons.Globe /> {userRegion ? `Region: ${userRegion}` : "Select Region"}</button>
            </div>
        </header>

        {/* --- ⚠️ WARNING & INFO SECTION --- */}
        <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Warning Box */}
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex gap-4">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500 h-fit"><Icons.Warning /></div>
                <div>
                    <h3 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">Betting Warning</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed text-justify">
                        We strictly <strong>prohibit betting & gambling</strong>. These streams are for entertainment only. If you see any betting ads inside the stream, please ignore them. We do not control third-party stream content.
                    </p>
                </div>
            </div>

            {/* Guide Box */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 h-fit"><Icons.Info /></div>
                <div>
                    <h3 className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">Playback Tips</h3>
                    <ul className="text-[11px] text-zinc-400 list-disc pl-4 space-y-1">
                        <li>If stream buffers, switch player engine (Top Right).</li>
                        <li>Select correct Region (BD/IN) from top menu.</li>
                        <li>Use "Native Player" for faster load on mobile.</li>
                    </ul>
                </div>
            </div>
        </div>
        <UserAdDisplay location="top" />
        
        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 mt-8">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-red-600 border-red-500 text-white shadow-lg" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>{cat}</button>)}
            </div>
        </div>

        {/* Matches Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">{[...Array(6)].map((_, n) => <div key={n} className="bg-zinc-900/50 h-64 rounded-2xl border border-white/5"></div>)}</div> 
            : filteredMatches.length === 0 ? <div className="text-center py-20 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-800 border-dashed">No matches found.</div>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match) => {
                    const isLive = match.status === "LIVE";
                    return (
                        <div key={match.match_id} className="group relative bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-600/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/10">
                            {/* Card Image */}
                            <div onClick={() => setActiveMatch(match)} className="aspect-video w-full relative overflow-hidden bg-black cursor-pointer">
                                <Image src={match.src || fallbackImage} alt={match.match_name} fill className="object-cover opacity-90 group-hover:opacity-100 transition duration-700" unoptimized onError={(e) => { e.currentTarget.src = fallbackImage }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                                {isLive && <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-pulse"><Icons.Live /> LIVE</div>}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300"><div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"><Icons.Play /></div></div>
                            </div>
                            
                            {/* Card Content */}
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-900/20 px-2 py-1 rounded border border-red-900/30">{match.event_category}</span>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700/50"><Icons.Calendar /> {formatDate(match.startTime)}</div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-snug mb-1 group-hover:text-red-500 transition line-clamp-2">{match.match_name}</h3>
                                
                                {/* Footer Actions */}
                                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                                    <button 
                                        onClick={(e) => handleShare(e, match)}
                                        className="flex items-center gap-2 text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition"
                                    >
                                        {copiedId === match.match_id ? <Icons.Check /> : <Icons.Share />}
                                        {copiedId === match.match_id ? "Copied" : "Share"}
                                    </button>
                                    <button onClick={() => setActiveMatch(match)} className="text-xs font-bold text-black bg-white hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-lg transition shadow-lg">Watch</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>}
        </div>
      </div>
    </main>
  );
}
