"use client";
import React, { useState, useEffect, Suspense } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { db, rtdb } from "../firebase"; 
import Link from "next/link";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const ShakaPlayer = dynamic(() => import("../../../components/ShakaPlayer"), { ssr: false });

const Icons = {
    Tv: () => <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
};

function LiveTVContent() {
  const [channels, setChannels] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentChannel, setCurrentChannel] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const unsub = onSnapshot(collection(db, "channels"), (snap) => {
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(doc(db, "settings", "config"), (d) => d.exists() && setSiteConfig(d.data()));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const statusRef = ref(rtdb, 'status');
    const myRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    set(myRef, { online: true });
    onDisconnect(myRef).remove();
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));
  }, [isClient]);

  const filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#020617] text-gray-200 flex flex-col overflow-x-hidden">
      
      {/* --- HEADER (Fully Responsive) --- */}
      <header className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
            <div onClick={() => setCurrentChannel(null)} className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/20">
                    <Icons.Tv />
                </div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tighter uppercase italic">Toffee<span className="text-cyan-500">Pro</span></h1>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20 hidden xs:flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-500">{onlineUsers}</span>
                </div>
                <Link href="/admin" className="text-[10px] font-black uppercase px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">Admin</Link>
            </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-8 space-y-6">
        
        {/* --- MAIN GRID LAYOUT --- */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
            
            {/* LEFT: PLAYER SEKCTION (Top on Mobile) */}
            <div className="lg:col-span-8 space-y-6 order-1">
                <div className="bg-black rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-video relative group">
                    {currentChannel ? (
                        <ShakaPlayer src={currentChannel.sources[0].url} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0a0a0c]">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-900 rounded-full flex items-center justify-center animate-pulse text-zinc-700">
                                <Icons.Tv />
                            </div>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Select a channel</p>
                        </div>
                    )}
                </div>

                {/* --- CHANNEL INFO (Mobile Optimized) --- */}
                {currentChannel && (
                    <div className="bg-white/5 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/5 flex items-center gap-4 sm:gap-6">
                        <img src={currentChannel.logo} className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl object-contain bg-black p-1 border border-white/10" alt="" />
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black text-white italic uppercase tracking-tight">{currentChannel.name}</h2>
                            <p className="text-[10px] sm:text-xs text-cyan-500 font-bold uppercase tracking-widest mt-1">Live Streaming Now</p>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: CHANNEL LIST (Bottom on Mobile) */}
            <div className="lg:col-span-4 space-y-6 order-2 lg:order-2">
                <div className="bg-[#0a0a0c] p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/5 h-[400px] sm:h-[550px] flex flex-col shadow-2xl">
                    <div className="mb-4">
                        <h3 className="text-white font-black text-xs sm:text-sm uppercase italic mb-3">Live Grid</h3>
                        <input 
                            className="w-full bg-black border border-white/5 p-3 rounded-xl text-xs text-white outline-none focus:border-cyan-600/50" 
                            placeholder="Search..." 
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {filteredChannels.map((ch) => (
                            <button 
                                key={ch.id} 
                                onClick={() => {
                                  setCurrentChannel(ch);
                                  window.scrollTo({top: 0, behavior: 'smooth'}); // মোবাইলে ক্লিক করলে প্লেয়ারে নিয়ে যাবে
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${currentChannel?.id === ch.id ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                                <img src={ch.logo} className="w-8 h-8 rounded-lg object-contain bg-black p-0.5" alt="" />
                                <span className="text-[10px] font-black uppercase tracking-tighter truncate text-left flex-1">{ch.name}</span>
                                {currentChannel?.id === ch.id && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- FOOTER STATS (Responsive Grid) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-12 pt-6 border-t border-white/5">
            {[
                { label: "Active Users", value: onlineUsers, color: "text-green-500" },
                { label: "Channels", value: channels.length, color: "text-cyan-500" },
                { label: "Quality", value: "4K/HD", color: "text-purple-500" },
                { label: "Status", value: "Online", color: "text-blue-500" }
            ].map((stat, i) => (
                <div key={i} className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/5 text-center">
                    <p className={`text-xl sm:text-3xl font-black ${stat.color} italic tracking-tighter`}>{stat.value}</p>
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
            ))}
        </div>

        {/* --- ANTI-BETTING WARNING --- */}
        <div className="bg-red-600/5 border border-red-600/10 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-4 sm:gap-8 shadow-xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0">🔞</div>
            <div className="text-center sm:text-left">
                <h4 className="text-red-500 font-black uppercase italic tracking-tighter text-sm sm:text-xl">Warning: Gambling Prohibited</h4>
                <p className="text-[9px] sm:text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-2xl font-medium">আমরা কোনো প্রকার জুয়া বা বেটিং প্রমোট করি না। খেলার মাঝে আসা কোনো বিজ্ঞাপনের জন্য কর্তৃপক্ষ দায়ী নয়।</p>
            </div>
        </div>
      </div>

      <footer className="mt-auto bg-black border-t border-white/5 py-8 text-center">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">&copy; {new Date().getFullYear()} ToffeePro Inc. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        @media (max-width: 640px) {
            .animate-marquee { animation: marquee 15s linear infinite; }
        }
      `}</style>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <LiveTVContent />
    </Suspense>
  );
}
