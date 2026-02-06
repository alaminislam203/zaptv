"use client";
import React, { useState, useEffect, Suspense } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { db, rtdb } from "../firebase"; 
import dynamic from "next/dynamic";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import GlobalBannerAd from "../../../components/GlobalBannerAd";
import EPG from "../../../components/EPG";
import LiveChat from "../../../components/LiveChat";
import { Play, Activity, Search, Shield, Trophy, Users, Tv, Star, ChevronRight, Maximize2 } from "lucide-react";

// --- DYNAMIC IMPORTS ---
const ShakaPlayer = dynamic(() => import("../../../components/ShakaPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Warming up...</p>
    </div>
  )
});

function LiveSportsContent() {
  const [channels, setChannels] = useState<any[]>([]);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentChannel, setCurrentChannel] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);

  useEffect(() => {
    const checkAdBlock = async () => {
      try {
        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD", mode: "no-cors", cache: "no-store",
        });
      } catch {
        setIsAdBlockActive(true);
      }
    };
    checkAdBlock();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "channels"), (snap) => {
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    onSnapshot(doc(db, "settings", "config"), (d) => d.exists() && setSiteConfig(d.data()));
    return () => unsub();
  }, []);

  useEffect(() => {
    const statusRef = ref(rtdb, 'status');
    const myRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    set(myRef, { online: true });
    onDisconnect(myRef).remove();
    onValue(statusRef, (snap) => setOnlineUsers(snap.size));
  }, []);

  const filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isAdBlockActive) {
    return (
      <div className="fixed inset-0 z-[500] bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-[3rem] max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">Ad-Blocker Detected</h2>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">Please disable your ad-blocker to support our free sports streaming service.</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />
      <GlobalBannerAd location="top" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <Trophy className="w-6 h-6 text-emerald-500" />
              <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em]">Premium Arena</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
              Live <span className="text-gradient">Sports</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="glass px-8 py-6 rounded-3xl text-center">
              <p className="text-3xl font-black text-white italic leading-none mb-1">{onlineUsers}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Watching Live</p>
            </div>
            <div className="glass px-8 py-6 rounded-3xl text-center border-emerald-500/20">
              <p className="text-3xl font-black text-emerald-500 italic leading-none mb-1">{channels.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pro Channels</p>
            </div>
          </div>
        </div>

        {/* Player Layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 transition-all duration-700 ${isCinemaMode ? 'lg:gap-0' : 'gap-12'}`}>

          <div className={`${isCinemaMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-8`}>
            <div className={`glass rounded-[3rem] overflow-hidden relative border-white/5 shadow-2xl transition-all duration-700 ${isCinemaMode ? 'aspect-[21/9]' : 'aspect-video'}`}>
              {currentChannel ? (
                <ShakaPlayer src={currentChannel.sources[0].url} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-900/50">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-white uppercase tracking-[0.3em] mb-2">Arena is Empty</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Select a channel from the grid to enter</p>
                  </div>
                </div>
              )}
            </div>

            {currentChannel && (
              <div className="glass p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-black rounded-3xl border border-white/5 p-2 overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={currentChannel.logo} className="w-full h-full object-contain" alt="" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium Source</span>
                  </div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">{currentChannel.name}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      Ultra HD
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Lag Streaming</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCinemaMode(!isCinemaMode)}
                    className={`p-4 rounded-2xl border transition-all ${isCinemaMode ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-900 border-white/5 text-slate-500 hover:text-white"}`}
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* EPG & Chat */}
            {!isCinemaMode && currentChannel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[400px]"><EPG channelName={currentChannel.name} /></div>
                <div className="h-[400px]"><LiveChat channelId={currentChannel.id} /></div>
              </div>
            )}
          </div>

          <div className={`${isCinemaMode ? 'hidden' : 'lg:col-span-4'} space-y-8`}>
            <div className="glass p-10 rounded-[3rem] h-[600px] flex flex-col">
              <div className="mb-8">
                <h3 className="text-xs font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-3">
                  <Play className="w-4 h-4 text-emerald-500 fill-current" />
                  Sports Grid
                </h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-emerald-500/50"
                    placeholder="Search channel..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {filteredChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChannel(ch);
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                      currentChannel?.id === ch.id
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/20'
                        : 'bg-slate-950 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl object-contain bg-black p-1 border border-white/10 overflow-hidden flex shrink-0 items-center justify-center">
                      <img src={ch.logo} className="w-full h-full object-contain" alt="" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest truncate text-left flex-1 ${
                      currentChannel?.id === ch.id ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}>
                      {ch.name}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${currentChannel?.id === ch.id ? 'text-white opacity-100' : 'text-slate-800 opacity-0 group-hover:opacity-100'} transition-all`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Section */}
        <div className="mt-20 glass p-10 rounded-[3rem] border-red-500/10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center shrink-0 border border-red-500/20">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h4 className="text-red-500 font-black uppercase italic tracking-tighter text-xl mb-2">Betting Prohibited</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase tracking-wide">
              ToffeePro does not promote or endorse any gambling or betting platforms. We are a pure sports streaming destination. Be responsible. Enjoy the spirit of the game.
            </p>
          </div>
        </div>
      </main>

      <GlobalBannerAd location="bottom" />
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="bg-slate-950 min-h-screen" />}>
      <LiveSportsContent />
    </Suspense>
  );
}
