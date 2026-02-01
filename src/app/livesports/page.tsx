"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { collection, onSnapshot, addDoc, doc, runTransaction } from "firebase/firestore";
import { ref, onValue, off, set, onDisconnect, serverTimestamp } from "firebase/database";
import { db, rtdb } from "../firebase"; 
import Link from "next/link";
import { useSearchParams } from "next/navigation"; 
import dynamic from "next/dynamic";
import Image from "next/image";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-[#050b14] flex items-center justify-center flex-col gap-3 relative overflow-hidden rounded-3xl">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent animate-shimmer"></div>
    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin z-10"></div>
    <span className="text-[10px] text-cyan-400 font-mono animate-pulse z-10 uppercase tracking-widest">Initializing Secure Stream...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const ShakaPlayer = dynamic(() => import("../../../components/ShakaPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const IframePlayer = dynamic(() => import("../../../components/IframePlayer"), { ssr: false });

// --- ICONS ---
const Icons = {
    Tv: () => <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Shield: () => <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    Heart: ({ filled }: any) => <svg className={`w-5 h-5 ${filled ? "fill-red-500 text-red-500" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
};

function LiveTVContent() {
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentChannel, setCurrentChannel] = useState<any | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // ১. এন্টি অ্যাড-ব্লকার এবং অ্যাড ইনজেকশন
  useEffect(() => {
    setIsClient(true);
    // অ্যাড স্ক্রিপ্ট ইনজেকশন
    (function(s: any) {
      s.dataset.zone = '10282293';
      s.src = 'https://al5sm.com/tag.min.js';
      const target = document.body || document.documentElement;
      target?.appendChild(s);
    })(document.createElement('script'));

    // অ্যাড ব্লকার চেক
    const checkAdBlock = async () => {
      try {
        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: "HEAD", mode: "no-cors" });
      } catch (e) { setIsAdBlockActive(true); }
    };
    checkAdBlock();
  }, []);

  // ২. রিয়েল-টাইম ডাটা কানেকশন
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "channels"), (snap) => {
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(doc(db, "settings", "config"), (d) => d.exists() && setSiteConfig(d.data()));
    return () => unsub();
  }, []);

  // ৩. ইউজার কাউন্টার লজিক (RTDB)
  useEffect(() => {
    if (!isClient) return;
    const statusRef = ref(rtdb, 'status');
    const myRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    set(myRef, { online: true });
    onDisconnect(myRef).remove();
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));
  }, [isClient]);

  const filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isAdBlockActive) {
    return (
      <div className="fixed inset-0 z-[600] bg-black flex items-center justify-center p-6 text-center backdrop-blur-3xl">
        <div className="bg-[#0f172a] border border-red-500/20 p-10 rounded-[2.5rem] max-w-sm shadow-2xl">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-black text-white italic uppercase">Ad-Blocker Detected</h2>
          <p className="text-zinc-500 text-xs mt-3 leading-relaxed">আমাদের ফ্রি সার্ভিসটি সচল রাখতে দয়া করে আপনার অ্যাড-ব্লকারটি বন্ধ করুন।</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase">Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-gray-200 flex flex-col">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-600/20 group-hover:rotate-12 transition-transform">
                    <Icons.Tv />
                </div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic">Toffee<span className="text-cyan-500">Pro</span></h1>
            </Link>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-4">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Status</span>
                    <span className="text-sm font-mono text-green-500 font-bold">{onlineUsers} Online</span>
                </div>
                <Link href="/admin" className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase border border-white/5 transition-all">Console</Link>
            </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 flex-grow pb-32 pt-8 space-y-8">
        
        {/* --- MARQUEE NOTICE --- */}
        <div className="bg-cyan-600/5 border border-cyan-500/10 rounded-2xl p-4 overflow-hidden relative">
            <div className="flex whitespace-nowrap animate-marquee items-center gap-4">
                <span className="text-[11px] font-black text-cyan-500 uppercase tracking-widest">[NOTICE]</span>
                <span className="text-xs font-bold text-zinc-400">{siteConfig.marqueeText || "Welcome to ToffeePro! Enjoy HD quality buffer-free streaming."}</span>
            </div>
        </div>

        {/* --- PLAYER SECTION --- */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
                <div className="bg-[#0a0a0c] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-video relative group">
                    <div className="w-full h-full bg-black">
                        {currentChannel ? (
                            <ShakaPlayer src={currentChannel.sources[activeSourceIndex].url} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center animate-pulse">
                                    <Icons.Tv />
                                </div>
                                <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">Select a channel to play</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CHANNEL INFO CARD --- */}
                {currentChannel && (
                    <div className="bg-[#0f172a]/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center gap-8 animate-fadeIn">
                        <div className="w-24 h-24 rounded-3xl bg-black p-2 border border-white/10 shadow-xl overflow-hidden shrink-0">
                            <img src={currentChannel.logo} className="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">{currentChannel.name}</h2>
                            <p className="text-xs text-cyan-500 font-bold mt-2 uppercase tracking-widest">{currentChannel.category || "Streaming Live"}</p>
                            <div className="flex gap-2 mt-6 justify-center md:justify-start">
                                {currentChannel.sources.map((s: any, i: number) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setActiveSourceIndex(i)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${activeSourceIndex === i ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
                                    >
                                        Server {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- SIDEBAR CHANNELS --- */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#0a0a0c] p-6 rounded-[2.5rem] border border-white/5 h-[600px] flex flex-col shadow-2xl">
                    <div className="mb-6">
                        <h3 className="text-white font-black text-sm uppercase italic mb-4">Channel Grid</h3>
                        <input 
                            className="w-full bg-black border border-white/5 p-4 rounded-2xl text-xs text-white outline-none focus:border-cyan-600/50" 
                            placeholder="Search channel..." 
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {filteredChannels.map((ch) => (
                            <button 
                                key={ch.id} 
                                onClick={() => setCurrentChannel(ch)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${currentChannel?.id === ch.id ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}
                            >
                                <img src={ch.logo} className="w-10 h-10 rounded-xl object-contain bg-black p-1" alt="" />
                                <span className="text-[11px] font-black uppercase tracking-tighter truncate">{ch.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- ANTI-GAMBLING WARNING --- */}
        <div className="bg-red-600/5 border border-red-600/10 p-8 rounded-[3rem] flex items-center gap-8 shadow-xl">
            <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-red-600/20 shrink-0">🔞</div>
            <div>
                <h4 className="text-red-500 font-black uppercase italic tracking-tighter text-xl">Warning: জুয়া বা বেটিং নিষিদ্ধ!</h4>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed max-w-2xl font-medium">আমরা কোনো প্রকার জুয়া বা বেটিং প্রমোট করি না। খেলার মাঝে জুয়ার বিজ্ঞাপন আসলে তাতে ক্লিক করবেন না। এগুলোর জন্য কর্তৃপক্ষ দায়ী নয়।</p>
            </div>
        </div>
      </div>

      {/* --- FOOTER WITH FLOATING STATS --- */}
      <footer className="mt-auto bg-[#050505] border-t border-white/5 pt-32 pb-10 relative">
        <div className="max-w-7xl mx-auto px-6 relative">
            
            {/* Floating Stats - Fixed Positioning */}
            <div className="absolute -top-20 left-6 right-6 grid grid-cols-3 gap-6">
                <StatBox label="Active Now" value={onlineUsers} color="text-green-500" />
                <StatBox label="Live Channels" value={channels.length} color="text-cyan-500" />
                <StatBox label="Global Server" value="100%" color="text-purple-500" />
            </div>

            <div className="grid md:grid-cols-3 gap-16 mb-16">
                <div>
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Toffee<span className="text-cyan-600 text-3xl">.</span></h2>
                    <p className="text-xs text-zinc-500 mt-4 leading-relaxed font-medium">আপনার প্রিয় স্পোর্টস এবং টিভি চ্যানেলগুলো বাফারলেস উপভোগ করুন সরাসরি অনলাইনে। সবার জন্য ফ্রি।</p>
                </div>
                <div className="flex flex-col gap-3">
                    <h3 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-2">Legal Links</h3>
                    <Link href="/dmca" className="text-xs text-zinc-500 hover:text-cyan-500 transition-colors font-bold">DMCA Policy</Link>
                    <Link href="/privacy" className="text-xs text-zinc-500 hover:text-cyan-500 transition-colors font-bold">Privacy Policy</Link>
                    <Link href="/terms" className="text-xs text-zinc-500 hover:text-cyan-500 transition-colors font-bold">Terms of Service</Link>
                </div>
                <div className="flex flex-col gap-6">
                    <h3 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-2">Community</h3>
                    <div className="flex gap-4">
                        <Link href="https://t.me/toffeepro" className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center hover:bg-cyan-600 transition-all border border-white/5"><Icons.Tv /></Link>
                        <Link href="#" className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center hover:bg-cyan-600 transition-all border border-white/5"><Icons.Shield /></Link>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                <p>&copy; {new Date().getFullYear()} ToffeePro Inc. High-End Streaming.</p>
                <div className="flex items-center gap-2">
                    <span>Made for fans</span>
                    <Icons.Heart filled={true} />
                </div>
            </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .animate-shimmer { background-size: 200% 100%; animation: shimmer 2s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </main>
  );
}

const StatBox = ({ label, value, color }: any) => (
    <div className="bg-[#0a0a0c] border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl transition-all hover:-translate-y-2">
        <span className={`text-3xl font-black ${color} tracking-tighter italic`}>{value}</span>
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-2">{label}</span>
    </div>
);

export default function Home() {
  return (
    <Suspense fallback={<LoadingPlayer />}>
      <LiveTVContent />
    </Suspense>
  );
}
