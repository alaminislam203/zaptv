"use client";
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase"; // ফায়ারবেজ পাথ ঠিক আছে কিনা চেক করুন
import Link from "next/link";
import Image from "next/image";

// --- ইন্টারফেস (Interface) ---
// ফায়ারবেজে এই ফিল্ডগুলো থাকতে হবে: team1, team2, team1Logo, team2Logo, info, matchTime, channelName
interface HotMatch {
  id: string;
  team1: string;
  team2: string;
  team1Logo?: string; // নতুন ফিল্ড: লোগো URL
  team2Logo?: string; // নতুন ফিল্ড: লোগো URL
  info: string;
  matchTime: string; // ISO String format (e.g., "2024-02-20T19:30:00")
  channelName: string;
}

export default function MatchPage() {
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // --- ১. ডেটা ফেচিং ---
  useEffect(() => {
    // ফায়ারবেজ থেকে রিয়েলটাইম ডেটা আনা হচ্ছে
    const q = query(collection(db, "hotMatches")); // চাইলে orderBy('matchTime') দিতে পারেন
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HotMatch[];
      
      // সময় অনুযায়ী সর্ট করা (আগের ম্যাচ আগে দেখাবে)
      list.sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());
      
      setMatches(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- ২. টাইমার লজিক (প্রতি সেকেন্ডে আপডেট) ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- ৩. স্ট্যাটাস এবং কাউন্টডাউন ক্যালকুলেশন ---
  const getMatchStatus = (matchTimeStr: string) => {
    const start = new Date(matchTimeStr).getTime();
    const end = start + (3 * 60 * 60 * 1000); // ম্যাচ শুরুর ৩ ঘণ্টা পর শেষ হবে ধরা হলো
    
    if (currentTime < start) {
      // ম্যাচ শুরু হতে বাকি
      const diff = start - currentTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { 
        status: "upcoming", 
        label: `${days > 0 ? days + "d " : ""}${hours}h : ${minutes}m : ${seconds}s` 
      };
    } else if (currentTime >= start && currentTime < end) {
      // ম্যাচ চলছে
      return { status: "live", label: "LIVE NOW" };
    } else {
      // ম্যাচ শেষ
      return { status: "ended", label: "Match Ended" };
    }
  };

  // --- ৪. ফরম্যাটেড ডেট (যেমন: 12 Jan, 07:30 PM) ---
  const formatNiceTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric', hour12: true 
    });
  };

  return (
    <main className="min-h-screen bg-[#0b1120] text-gray-200 font-sans pb-10">
      
      {/* --- হেডার --- */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/livetv" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
             <span className="text-xl">⬅</span> <span className="text-sm font-bold">Back to TV</span>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-600 text-transparent bg-clip-text">
            Match Center
          </h1>
          <div className="w-8"></div> {/* Spacer for center alignment */}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* --- হিরো সেকশন / ব্যানার --- */}
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Upcoming & Live Matches
          </h2>
          <p className="text-gray-400 text-sm">
            ফুটবল, ক্রিকেট এবং অন্যান্য খেলার লাইভ আপডেট এবং স্ট্রিমিং লিঙ্ক
          </p>
        </div>

        {/* --- লোডিং স্টেট --- */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-40 bg-[#1e293b] rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-[#1e293b] rounded-2xl border border-gray-800">
            <p className="text-gray-500 text-lg">No matches scheduled right now.</p>
          </div>
        ) : (
          /* --- ম্যাচ গ্রিড --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {matches.map((match) => {
              const { status, label } = getMatchStatus(match.matchTime);
              const isEnded = status === "ended";
              const isLive = status === "live";

              return (
                <div 
                  key={match.id} 
                  className={`relative group overflow-hidden rounded-2xl border transition-all duration-300
                    ${isEnded 
                      ? "bg-gray-900/50 border-gray-800 grayscale opacity-70" 
                      : "bg-[#1e293b] border-gray-700 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-900/20"
                    }
                  `}
                >
                  {/* Background Glow Effect */}
                  {!isEnded && (
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition"></div>
                  )}

                  {/* --- কার্ড হেডার (টুর্নামেন্ট ইনফো) --- */}
                  <div className="px-5 py-3 border-b border-gray-700/50 flex justify-between items-center bg-black/20">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                      {match.info}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {formatNiceTime(match.matchTime)}
                    </span>
                  </div>

                  {/* --- মেইন বডি (টিম ও লোগো) --- */}
                  <div className="p-6 flex items-center justify-between relative z-10">
                    
                    {/* Team 1 */}
                    <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#0f172a] border border-gray-600 p-2 shadow-lg flex items-center justify-center">
                         {match.team1Logo ? (
                           <img src={match.team1Logo} alt={match.team1} className="w-full h-full object-contain" />
                         ) : (
                           <span className="text-2xl">🛡️</span>
                         )}
                      </div>
                      <h3 className="font-bold text-sm md:text-base text-gray-200 leading-tight">
                        {match.team1}
                      </h3>
                    </div>

                    {/* VS Badge */}
                    <div className="flex flex-col items-center justify-center w-1/3">
                       <span className="text-2xl font-black text-gray-700 italic opacity-50">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#0f172a] border border-gray-600 p-2 shadow-lg flex items-center justify-center">
                         {match.team2Logo ? (
                           <img src={match.team2Logo} alt={match.team2} className="w-full h-full object-contain" />
                         ) : (
                           <span className="text-2xl">🛡️</span>
                         )}
                      </div>
                      <h3 className="font-bold text-sm md:text-base text-gray-200 leading-tight">
                        {match.team2}
                      </h3>
                    </div>
                  </div>

                  {/* --- ফুটার (টাইমার / অ্যাকশন) --- */}
                  <div className="px-4 pb-4">
                    {/* Status Bar */}
                    <div className={`
                      rounded-lg py-3 flex items-center justify-center font-mono text-sm font-bold tracking-wider transition-all
                      ${isLive ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-900/40" : ""}
                      ${status === "upcoming" ? "bg-black/40 text-cyan-400 border border-cyan-500/20" : ""}
                      ${isEnded ? "bg-gray-800 text-gray-500" : ""}
                    `}>
                      {isLive && <span className="mr-2 text-lg">•</span>}
                      {label}
                    </div>

                    {/* Watch Button (Only if not ended) */}
                    {!isEnded && (
                       <Link href={`/livetv`}> 
                       {/* আপনি চাইলে স্পেসিফিক চ্যানেলে নেওয়ার জন্য href={`/livesports?play=${match.channelName}`} ব্যবহার করতে পারেন যদি আপনার মেইন পেজ কোয়েরি প্যারাম সাপোর্ট করে */}
                         <button className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition flex items-center justify-center gap-2 group-hover:bg-cyan-700">
                           <span>📺</span> Watch Stream
                         </button>
                       </Link>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
