"use client";
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase"; 
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { ChevronLeft, Search, Clock, Trophy, Play, Activity, Info, Calendar } from "lucide-react";

// --- ইন্টারফেস (Interface) ---
interface HotMatch {
  id: string;
  team1: string;
  team2: string;
  team1Logo?: string;
  team2Logo?: string;
  info: string;
  matchTime: string; // ISO String format
  channelName: string;
}

export default function MatchPage() {
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'live' | 'upcoming'>('all');

  useEffect(() => {
    const q = query(collection(db, "hotMatches"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HotMatch[];
      
      list.sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());
      setMatches(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getMatchStatus = (matchTimeStr: string) => {
    const start = new Date(matchTimeStr).getTime();
    const end = start + (3 * 60 * 60 * 1000); 
    
    if (currentTime < start) {
      const diff = start - currentTime;
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { status: "upcoming", label: `Starts in ${hours}h ${minutes}m ${seconds}s`, color: "text-emerald-400" };
    } else if (currentTime >= start && currentTime < end) {
      return { status: "live", label: "LIVE NOW", color: "text-red-500" };
    } else {
      return { status: "ended", label: "Match Ended", color: "text-slate-500" };
    }
  };

  const formatNiceTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric', hour12: true });
  };

  const filteredMatches = matches.filter(match => {
    const { status } = getMatchStatus(match.matchTime);
    if (filterType === 'live' && status !== 'live') return false;
    if (filterType === 'upcoming' && status !== 'upcoming') return false;
    const query = searchQuery.toLowerCase();
    return (match.team1?.toLowerCase() || "").includes(query) ||
           (match.team2?.toLowerCase() || "").includes(query) ||
           (match.info?.toLowerCase() || "").includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <Trophy className="w-6 h-6 text-emerald-500" />
              <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em]">Arena Center</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
              Match <span className="text-gradient">Hub</span>
            </h1>
          </div>

          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/5">
                {(['all', 'live', 'upcoming'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            filterType === type 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {type}
                    </button>
                ))}
          </div>
        </div>

        {/* Controls */}
        <div className="relative max-w-2xl mx-auto mb-16">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
            <input
                type="text"
                placeholder="Search team, league or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-lg font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-all shadow-2xl"
            />
        </div>

        {/* Match List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[2/1] glass rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20 glass rounded-[3rem] border-white/5 flex flex-col items-center gap-6">
             <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 border border-white/5">
                <Search className="w-8 h-8" />
             </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest">No matches found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredMatches.map((match) => {
              const { status, label, color } = getMatchStatus(match.matchTime);
              const isLive = status === "live";
              const isEnded = status === "ended";

              return (
                <div 
                  key={match.id} 
                  className={`reveal relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 group
                    ${isEnded 
                      ? "bg-slate-900/40 border-white/5 opacity-50 grayscale"
                      : "glass border-white/5 hover:border-emerald-500/30 hover:-translate-y-2 hover:shadow-emerald-500/10"
                    }
                  `}
                >
                  {/* Header */}
                  <div className="px-8 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-2">
                        <Activity className={`w-3 h-3 ${isLive ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 truncate max-w-[150px]">
                            {match.info}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {formatNiceTime(match.matchTime)}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-10 flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-center gap-4 flex-1">
                      <div className="w-20 h-20 rounded-3xl bg-slate-950 border border-white/5 p-4 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          {match.team1Logo ? (
                            <img src={match.team1Logo} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Trophy className="w-8 h-8 text-slate-800" />
                          )}
                      </div>
                      <h3 className="font-black text-sm text-white uppercase italic text-center leading-tight min-h-[2.5rem] flex items-center">
                        {match.team1}
                      </h3>
                    </div>

                    <div className="flex flex-col items-center px-4">
                        <span className="text-3xl font-black text-slate-800 italic opacity-20 group-hover:opacity-40 transition-opacity">VS</span>
                    </div>

                    <div className="flex flex-col items-center gap-4 flex-1">
                      <div className="w-20 h-20 rounded-3xl bg-slate-950 border border-white/5 p-4 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          {match.team2Logo ? (
                            <img src={match.team2Logo} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Trophy className="w-8 h-8 text-slate-800" />
                          )}
                      </div>
                      <h3 className="font-black text-sm text-white uppercase italic text-center leading-tight min-h-[2.5rem] flex items-center">
                        {match.team2}
                      </h3>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-8 pb-8">
                    <div className={`
                      rounded-2xl py-4 px-6 flex flex-col items-center justify-center font-black text-[10px] tracking-[0.2em] uppercase transition-all
                      ${isLive ? "bg-red-500/10 border border-red-500/20 text-red-500 shadow-lg shadow-red-500/5" : "bg-slate-950/50 border border-white/5 text-slate-400"}
                    `}>
                       <span className={color}>{label}</span>
                       {!isEnded && (
                           <span className="text-[8px] text-slate-500 mt-2 font-bold opacity-60">
                               BROADCASTING ON: <span className="text-slate-300 underline decoration-emerald-500/50">{match.channelName}</span>
                           </span>
                       )}
                    </div>

                    {!isEnded && (
                        <Link href={`/${match.channelName}`} className="block mt-4">
                          <button className="w-full bg-white text-slate-950 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl group/btn">
                            <Play className="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" />
                            Enter Arena
                          </button>
                        </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Help */}
        <section className="mt-20 glass p-10 rounded-[3rem] border-white/5">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Info className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Streaming Guide</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">1. Click <strong>"ENTER ARENA"</strong> to start the live stream.</p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">2. We recommend joining at least 5 minutes before kickoff.</p>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">3. If the stream lags, please refresh the page or check your connection.</p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">4. Content is provided by third-party global sources.</p>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
