"use client";
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase"; 
import Link from "next/link";

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
  
  // নতুন ফিচার: সার্চ এবং ফিল্টার স্টেট
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'live' | 'upcoming'>('all');

  // --- SVG Icons Collection ---
  const Icons = {
    Back: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>,
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
    Clock: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
    Shield: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>,
    Play: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>,
    Alert: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
    Info: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
  };

  // --- ১. ডেটা ফেচিং ---
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

  // --- ২. টাইমার ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- ৩. হেল্পার ফাংশন ---
  const getMatchStatus = (matchTimeStr: string) => {
    const start = new Date(matchTimeStr).getTime();
    const end = start + (3 * 60 * 60 * 1000); 
    
    if (currentTime < start) {
      const diff = start - currentTime;
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { status: "upcoming", label: `Starts in ${hours}h ${minutes}m ${seconds}s`, color: "text-cyan-400" };
    } else if (currentTime >= start && currentTime < end) {
      return { status: "live", label: "LIVE NOW", color: "text-red-500" };
    } else {
      return { status: "ended", label: "Match Ended", color: "text-gray-500" };
    }
  };

  const formatNiceTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric', hour12: true });
  };

  // --- ৪. ফিল্টারিং লজিক ---
  const filteredMatches = matches.filter(match => {
    const { status } = getMatchStatus(match.matchTime);
    
    // Status Filter
    if (filterType === 'live' && status !== 'live') return false;
    if (filterType === 'upcoming' && status !== 'upcoming') return false;

    // Search Filter
    const query = searchQuery.toLowerCase();
    return match.team1.toLowerCase().includes(query) || 
           match.team2.toLowerCase().includes(query) || 
           match.info.toLowerCase().includes(query);
  });

  return (
    <main className="min-h-screen bg-[#050b14] text-gray-200 font-sans pb-20 selection:bg-cyan-500/30">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-[#050b14]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/livetv" className="flex items-center gap-2 text-gray-400 hover:text-white transition group">
            <div className="group-hover:-translate-x-1 transition-transform">
               <Icons.Back />
            </div>
            <span className="text-sm font-bold hidden sm:block">Back to TV</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🔴</span>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">
              Match Center
            </h1>
          </div>
          <div className="w-8"></div> 
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* --- GAMBLING WARNING (সতর্কবার্তা) --- */}
        <div className="mb-8 bg-red-950/20 border border-red-500/30 rounded-xl p-4 flex gap-4 items-start md:items-center">
            <div className="shrink-0 p-2 bg-red-500/10 rounded-full">
                <Icons.Alert />
            </div>
            <div>
                <h3 className="text-red-400 font-bold text-sm uppercase tracking-wide mb-1">সতর্কবার্তা</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    এই সাইটটি শুধুমাত্র খেলা দেখার জন্য। আমরা কোনো ধরনের <strong className="text-gray-300">বেটিং (Betting), জুয়া বা প্রেডিকশন</strong> অ্যাপ প্রমোট করি না। খেলার মাঝে কোনো জুয়ার বিজ্ঞাপন আসলে দয়া করে তাতে ক্লিক করবেন না। জুয়া আর্থিক এবং ধর্মীয় উভয়ভাবেই ক্ষতিকর।
                </p>
            </div>
        </div>

        {/* --- CONTROLS: SEARCH & FILTER --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
            {/* Search Bar */}
            <div className="relative w-full md:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-400 transition">
                    <Icons.Search />
                </div>
                <input 
                    type="text" 
                    placeholder="Search team or league..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-800 rounded-xl leading-5 bg-[#0f172a] text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-[#1e293b] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 sm:text-sm transition-all shadow-lg"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-[#0f172a] p-1 rounded-xl border border-gray-800">
                {(['all', 'live', 'upcoming'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                            filterType === type 
                            ? 'bg-cyan-600 text-white shadow-lg' 
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>

        {/* --- MATCH LIST --- */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 bg-[#0f172a] rounded-2xl animate-pulse border border-gray-800"></div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20 bg-[#0f172a]/50 rounded-2xl border border-gray-800/50 flex flex-col items-center gap-4">
             <div className="p-4 bg-gray-800 rounded-full text-gray-500">
                <Icons.Search />
             </div>
            <p className="text-gray-400">কোনো ম্যাচ পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMatches.map((match) => {
              const { status, label, color } = getMatchStatus(match.matchTime);
              const isLive = status === "live";
              const isEnded = status === "ended";

              return (
                <div 
                  key={match.id} 
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-300 group
                    ${isEnded 
                      ? "bg-gray-900/40 border-gray-800 opacity-60 grayscale" 
                      : "bg-[#0f172a] border-gray-800 hover:border-gray-600 hover:bg-[#162032] hover:shadow-2xl hover:shadow-cyan-900/10 hover:-translate-y-1"
                    }
                  `}
                >
                  {/* Live Glow */}
                  {isLive && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[50px] rounded-full pointer-events-none"></div>
                  )}

                  {/* Header: League Info & Time */}
                  <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 truncate max-w-[150px]">
                            {match.info}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">
                      <Icons.Clock />
                      {formatNiceTime(match.matchTime)}
                    </div>
                  </div>

                  {/* Body: Teams */}
                  <div className="p-6 flex items-center justify-between relative z-10">
                    {/* Team 1 */}
                    <div className="flex flex-col items-center gap-3 flex-1 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#050b14] border border-gray-700 p-3 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                          {match.team1Logo ? (
                            <img src={match.team1Logo} alt={match.team1} className="w-full h-full object-contain" />
                          ) : (
                            <Icons.Shield />
                          )}
                      </div>
                      <h3 className="font-bold text-sm text-gray-200 leading-tight line-clamp-2">
                        {match.team1}
                      </h3>
                    </div>

                    {/* VS / Score Placeholder */}
                    <div className="flex flex-col items-center px-2">
                        <span className="text-2xl font-black text-gray-700 italic opacity-30">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center gap-3 flex-1 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#050b14] border border-gray-700 p-3 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                          {match.team2Logo ? (
                            <img src={match.team2Logo} alt={match.team2} className="w-full h-full object-contain" />
                          ) : (
                            <Icons.Shield />
                          )}
                      </div>
                      <h3 className="font-bold text-sm text-gray-200 leading-tight line-clamp-2">
                        {match.team2}
                      </h3>
                    </div>
                  </div>

                  {/* Footer: Action & Status */}
                  <div className="px-4 pb-4">
                    <div className={`
                      rounded-xl py-3 px-4 flex flex-col items-center justify-center font-mono text-xs font-bold tracking-wider transition-all
                      ${isLive ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-black/20 border border-white/5"}
                    `}>
                       <span className={color}>{label}</span>
                       
                       {/* Channel Name */}
                       {!isEnded && (
                           <span className="text-[10px] text-gray-500 mt-1 font-sans font-normal normal-case">
                               Playing on: <span className="text-gray-300">{match.channelName}</span>
                           </span>
                       )}
                    </div>

                    {!isEnded && (
                        <Link href={`${match.channelName}`} className="block mt-3">
                          <button className="w-full bg-white text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5">
                            <Icons.Play />
                            Watch Live
                          </button>
                        </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* --- INSTRUCTIONS --- */}
        <section className="mt-12 border-t border-gray-800 pt-8">
            <div className="flex items-center gap-2 mb-4">
                <Icons.Info />
                <h2 className="text-lg font-bold text-white">কিভাবে দেখবেন?</h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-400 list-disc pl-5">
                <li>যেকোনো ম্যাচের <strong>"WATCH LIVE"</strong> বাটনে ক্লিক করুন।</li>
                <li>ম্যাচ শুরু হওয়ার অন্তত ৫ মিনিট আগে পেজে প্রবেশ করুন।</li>
                <li>যদি লোড হতে সমস্যা হয়, তবে আপনার ইন্টারনেট কানেকশন চেক করুন অথবা পেজ রিফ্রেশ দিন।</li>
                <li>আমরা থার্ড পার্টি সার্ভার ব্যবহার করি, তাই মাঝে মাঝে বাফারিং হতে পারে।</li>
            </ul>
        </section>

      </div>
    </main>
  );
}
