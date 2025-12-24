"use client";
import React, { useState, useEffect, useRef } from "react";
// 1. Firebase imports
import { 
  collection, onSnapshot, addDoc, doc, 
  query, orderBy 
} from "firebase/firestore";
// নোট: যদি আপনার firebase.js ফাইলটি app ফোল্ডারের বাইরে থাকে, তবে '../firebase' ব্যবহার করুন
import { db } from "./firebase"; 
import Link from "next/link";

// 2. Dynamic Imports (SSR Fix)
import dynamic from "next/dynamic";

// প্লেয়ার লোডিং কম্পোনেন্ট
const LoadingPlayer = () => (
  <div className="w-full h-full bg-black flex items-center justify-center text-gray-500 animate-pulse">  
    Loading Stream...  
  </div>  
);

// প্লেয়ারগুলোকে সার্ভার সাইড রেন্ডারিং (SSR) বন্ধ করে ইমপোর্ট করা হচ্ছে
const HLSPlayer = dynamic(() => import("../../components/HLSPlayer"), {
  ssr: false,
  loading: () => <LoadingPlayer />
});

const ShakaPlayer = dynamic(() => import("../../components/ShakaPlayer"), {
  ssr: false,
  loading: () => <LoadingPlayer />
});

const IframePlayer = dynamic(() => import("../../components/IframePlayer"), {
  ssr: false
});

// --- ইন্টারফেস ---
interface DrmConfig {
  type: "clearkey" | "widevine";
  keyId?: string;
  key?: string;
  licenseUrl?: string;
}
interface Source {
  label: string;
  url: string;
  drm?: DrmConfig;
}
interface Channel {
  id: string;
  name: string;
  logo: string;
  is_embed: boolean | string;
  category?: string;
  sources: Source[];
}
interface HotMatch {
  id: string;
  team1: string;
  team2: string;
  info: string;
  matchTime: string;
  channelName: string;
}
interface AdData {
  id: string;
  location: "top" | "middle";
  imageUrl?: string;
  text?: string;
  link?: string;
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);

  // সাইট কনফিগারেশন স্টেট
  const [siteConfig, setSiteConfig] = useState<any>({});

  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // 3. Client Side Check (Double Protection against SSR Error)
  const [isClient, setIsClient] = useState(false);

  const scriptsLoaded = useRef(false);
  const counterRef = useRef<HTMLDivElement>(null);

  // ব্রাউজার চেক
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ১. ফায়ারস্টোর ডাটা আনা
  useEffect(() => {
    const channelsRef = collection(db, "channels");
    const unsubChannels = onSnapshot(channelsRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Channel[];
      setChannels(list);
      setLoading(false);
    });

    const matchesRef = collection(db, "hotMatches");  
    const unsubMatches = onSnapshot(matchesRef, (snapshot) => {  
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as HotMatch[];  
      setMatches(list);  
    });  

    const adsRef = collection(db, "ads");  
    const unsubAds = onSnapshot(adsRef, (snapshot) => {  
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AdData[];  
      setAds(list);  
    });  

    const settingsRef = doc(db, "settings", "config");  
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {  
      if (docSnap.exists()) {  
        setSiteConfig(docSnap.data());  
      }  
    });  

    return () => {  
      unsubChannels();  
      unsubMatches();  
      unsubAds();  
      unsubSettings();  
    };
  }, []);

  // ২. স্ক্রিপ্ট লোড (AdBlock, Ads, Counter)
  useEffect(() => {
    if (scriptsLoaded.current) return;
    scriptsLoaded.current = true;

    // AdBlock Detection  
    const warningText = "আমাদের সাইটটি ফ্রি রাখতে অনুগ্রহ করে অ্যাড ব্লকার বন্ধ করুন।";  
    const modalID = 'ab-warning-modal';  
    const detectAdBlock = async () => {  
        let adBlockEnabled = false;  
        try {   
            await fetch(new Request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors' }));   
        } catch (e) {   
            adBlockEnabled = true;   
        }  
        if (adBlockEnabled && !document.getElementById(modalID)) {  
            const modal = document.createElement('div');  
            modal.id = modalID;  
            modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 99999; display: flex; justify-content: center; align-items: center; flex-direction: column; backdrop-filter: blur(5px); color: #fff; text-align: center;`;  
            modal.innerHTML = `<h2 style="color:#ef4444;margin-bottom:10px;font-size:24px;font-weight:bold;">Adblock Detected!</h2><p style="font-size:16px;">${warningText}</p><button onclick="location.reload()" style="background:#ef4444;color:white;border:none;padding:10px 20px;margin-top:15px;cursor:pointer;border-radius:5px;font-weight:bold;">Refresh Page</button>`;  
            document.body.appendChild(modal);  
        }  
    };  
    setTimeout(detectAdBlock, 2000);  

    // Ad Script  
    try {  
        const adScript = document.createElement('script');  
        adScript.dataset.zone = '10282293';  
        adScript.src = 'https://al5sm.com/tag.min.js';  
        const target = [document.documentElement, document.body].filter(Boolean).pop();  
        if(target) target.appendChild(adScript);  
    } catch (e) { console.error("Ad script error:", e); }  

    // Visitor Counter  
    if (counterRef.current) {  
        const link = document.createElement("a");  
        link.href = "https://www.counters-free.net/";  
        link.innerText = "free html Counter";  
        link.style.fontSize = "10px";  
        link.style.color = "#4b5563";  
        link.target = "_blank";  
          
        const scriptAuth = document.createElement("script");  
        scriptAuth.src = "https://www.freevisitorcounters.com/auth.php?id=7c710f7fb8209c5e825d802ae1abdfabd9e2a367";  
        scriptAuth.async = true;  

        const scriptCount = document.createElement("script");  
        scriptCount.src = "https://www.freevisitorcounters.com/en/home/counter/1465822/t/1";  
        scriptCount.async = true;  

        counterRef.current.innerHTML = "";  
        counterRef.current.appendChild(link);  
        counterRef.current.appendChild(scriptAuth);  
        counterRef.current.appendChild(scriptCount);  
    }
  }, []);

  // ৩. চ্যানেল লজিক
  useEffect(() => {
    setActiveSourceIndex(0);
    if(currentChannel) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      checkIfFavorite(currentChannel.id);
    }
  }, [currentChannel]);

  const checkIfFavorite = (channelId: string) => {
    const savedFavs = localStorage.getItem("favorites");
    if (savedFavs) {
      const favArray = JSON.parse(savedFavs);
      setIsFavorite(favArray.some((ch: Channel) => ch.id === channelId));
    } else { setIsFavorite(false); }
  };

  const toggleFavorite = () => {
    if (!currentChannel) return;
    const savedFavs = localStorage.getItem("favorites");
    let favArray = savedFavs ? JSON.parse(savedFavs) : [];

    if (isFavorite) {  
      favArray = favArray.filter((ch: Channel) => ch.id !== currentChannel.id);  
      setIsFavorite(false);  
      alert("Removed from Favorites");  
    } else {  
      favArray.push(currentChannel);  
      setIsFavorite(true);  
      alert("Added to Favorites ❤️");  
    }  
    localStorage.setItem("favorites", JSON.stringify(favArray));
  };

  const handleReport = async () => {
    if (!currentChannel) return;
    // --- FIX: Syntax corrected here ---
    if (window.confirm(`Report "${currentChannel.name}"?`)) {
      try {
        await addDoc(collection(db, "reports"), {
          channelName: currentChannel.name,
          channelId: currentChannel.id,
          sourceLabel: currentChannel.sources[activeSourceIndex]?.label || "Default",
          timestamp: new Date(),
          status: "pending",
          issue: "Stream not working"
        });
        alert("Report submitted successfully!");
      } catch (error) { console.error("Error reporting:", error); }
    }
  };

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMatchClick = (channelName: string) => {
    const targetChannel = channels.find(ch =>
      ch.name.toLowerCase() === channelName.toLowerCase() || ch.id === channelName
    );
    if (targetChannel) setCurrentChannel(targetChannel);
    else alert("Channel not found!");
  };

  const getAd = (location: "top" | "middle") => ads.find(ad => ad.location === location);
  const topAd = getAd("top");
  const middleAd = getAd("middle");

  const renderPlayer = () => {
    // 4. Client Side Check: যদি সার্ভার হয়, তবে কিছুই দেখাবে না
    if (!isClient) return <LoadingPlayer />;

    if (!currentChannel) {  
      return (  
        <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-black">  
          <p className="text-xl font-bold tracking-widest animate-pulse">SELECT A CHANNEL</p>  
        </div>  
      );  
    }  
    if (!currentChannel.sources || currentChannel.sources.length === 0) {  
      return <div className="text-white flex justify-center items-center h-full">No Source Available</div>;  
    }  

    const activeSource = currentChannel.sources[activeSourceIndex];  
    if (!activeSource) return <div className="text-red-500">Source Error</div>;  
    const url = activeSource.url;  

    const isEmbedFlag = currentChannel.is_embed === true || String(currentChannel.is_embed) === "true";  
    if (isEmbedFlag) return <IframePlayer src={url} />;  

    const hasDrm = activeSource.drm && Object.keys(activeSource.drm).length > 0;  
    if (url.includes(".mpd") || hasDrm) return <ShakaPlayer src={url} drm={activeSource.drm} />;  

    if (url.includes(".m3u8")) return <HLSPlayer src={url} />;  

    return <IframePlayer src={url} />;
  };

  return (
    <main className="min-h-screen bg-[#0b1120] text-gray-200 font-sans pb-10">
      
      {/* HEADER */}  
      <header className="bg-[#0f172a] border-b border-gray-800 sticky top-0 z-50 shadow-lg">  
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">  
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentChannel(null)}>  
            <div className="text-2xl font-bold">  
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">  
                ToffeePro  
              </span>  
            </div>  
          </div>  
          <div className="flex items-center gap-3">  
             <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold animate-pulse">  
               ● LIVE  
             </span>  
             <Link href="/admin">  
               <button className="text-sm bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition text-white">  
                 Login  
               </button>  
             </Link>  
          </div>  
        </div>  
          
        {/* Dynamic Marquee Section */}  
        <div className="bg-[#1e293b] h-8 flex items-center overflow-hidden relative border-b border-gray-800">  
          <div className="whitespace-nowrap animate-marquee text-xs text-white-400 pl-4 font-mono">  
             {siteConfig.marqueeText || "সাইটের বিভিন্ন সমস্যাগুলোর সমাধান করা হচ্ছে এবং চ্যানেল গুলো ফিক্স করা হচ্ছে। সাময়িক অসুবিধার জন্য আমরা দুঃখিত..."}  
          </div>  
        </div>  
      </header>  

      <div className="max-w-4xl mx-auto px-2 md:px-4 mt-4 space-y-4">  

        {/* Top Ad */}  
        {topAd && (  
          <div className="w-full min-h-[50px] bg-[#1e293b] rounded flex flex-col items-center justify-center overflow-hidden border border-gray-800 relative group">  
            <span className="absolute top-0 right-0 bg-gray-700 text-[8px] px-1 text-white">Ad</span>  
            {topAd.imageUrl ? (  
               <a href={topAd.link || "#"} target="_blank" className="w-full">  
                 <img src={topAd.imageUrl} alt="Ad" className="w-full h-auto object-cover max-h-32" />  
               </a>  
            ) : (  
               <div className="text-center p-2 text-cyan-500 font-bold">{topAd.text}</div>  
            )}  
          </div>  
        )}  

        {/* PLAYER */}  
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">  
          <div className="aspect-video w-full bg-black relative">  
             <div key={`${currentChannel?.id}-${activeSourceIndex}`} className="w-full h-full">  
               {/* 5. Render Player with Client Check */}  
               {isClient ? renderPlayer() : <LoadingPlayer />}  
             </div>  
          </div>  
          <div className="bg-[#0f172a] p-2 flex items-center justify-between text-xs border-t border-gray-800">  
            <button onClick={() => document.querySelector("video")?.requestPictureInPicture()} className="flex items-center gap-1 hover:text-cyan-400 px-3 py-1 bg-gray-800/50 rounded"><span className="text-lg">⛶</span> PiP</button>  
            <button onClick={toggleFavorite} className={`flex items-center gap-1 px-3 py-1 bg-gray-800/50 rounded transition ${isFavorite ? "text-pink-500" : "text-gray-300"}`}><span className="text-lg">{isFavorite ? "♥" : "♡"}</span> Fav</button>  
            <button onClick={handleReport} className="flex items-center gap-1 text-red-400 bg-red-900/20 px-3 py-1 rounded border border-red-500/20">⚠ Report</button>  
          </div>  
        </div>  

        {/* INFO */}  
        <div className="bg-[#1e293b] p-4 rounded-lg border border-gray-700 flex items-center gap-4">  
           <div className="w-12 h-12 rounded-full bg-black border border-gray-600 overflow-hidden flex-shrink-0">  
              {currentChannel?.logo ? <img src={currentChannel.logo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📡</div>}  
           </div>  
           <div className="flex-1">  
             <h2 className="text-lg font-bold text-white">{currentChannel?.name || "Select a Channel"}</h2>  
             <p className="text-xs text-green-400">{currentChannel ? "● Playing Now" : "Please select from below"}</p>  
           </div>  
           {currentChannel && currentChannel.sources.length > 1 && (  
             <div className="flex gap-2 flex-wrap justify-end">  
               {currentChannel.sources.map((src, idx) => (  
                 <button key={idx} onClick={() => setActiveSourceIndex(idx)} className={`text-xs px-3 py-1.5 rounded font-bold border transition-all ${activeSourceIndex === idx ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300"}`}>{src.label || `S-${idx+1}`}</button>  
               ))}  
             </div>  
           )}  
        </div>  

        {/* Middle Ad */}  
        {middleAd && (  
          <div className="w-full min-h-[40px] bg-[#1e293b] rounded flex flex-col items-center justify-center overflow-hidden border border-gray-800 relative mt-2">  
            <span className="absolute top-0 right-0 bg-gray-700 text-[8px] px-1 text-white">Ad</span>  
             {middleAd.imageUrl ? <a href={middleAd.link || "#"} target="_blank" className="w-full"><img src={middleAd.imageUrl} alt="Ad" className="w-full h-auto object-cover max-h-24" /></a> : <div className="text-center p-2 text-gray-300 text-xs">{middleAd.text}</div>}  
          </div>  
        )}  

        {/* HOT MATCHES */}  
        {matches.length > 0 && (  
          <div className="space-y-2 mt-4">  
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm px-1">  
              <span className="animate-pulse">🔥</span> HOT MATCHES  
            </div>  
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">  
              {matches.map((match) => (  
                <div key={match.id} onClick={() => handleMatchClick(match.channelName)} className="min-w-[240px] bg-[#1e293b] p-3 rounded-lg border border-gray-700 relative flex-shrink-0 cursor-pointer hover:border-orange-500 transition-all group">  
                  <span className="absolute top-2 right-2 bg-red-600 text-[9px] px-2 py-0.5 rounded text-white font-bold shadow-lg animate-pulse">LIVE</span>  
                  <div className="mt-4 flex justify-between items-center text-sm font-bold text-gray-200"><span className="truncate max-w-[45%]">{match.team1}</span><span className="text-gray-500 text-xs">VS</span><span className="truncate max-w-[45%] text-right">{match.team2}</span></div>  
                  <div className="mt-3 flex justify-between items-center border-t border-gray-700 pt-2"><span className="text-[10px] text-cyan-400 font-medium">{match.info}</span><span className="text-[10px] text-gray-400 flex items-center gap-1">🕒 {match.matchTime}</span></div>  
                </div>  
              ))}  
            </div>  
          </div>  
        )}  

        {/* GRID */}  
        <div className="bg-[#111827] p-4 rounded-xl border border-gray-800">  
          <div className="mb-4 relative">  
             <input type="text" placeholder="চ্যানেল খুঁজুন..." className="w-full bg-[#1f2937] text-white text-sm px-4 py-2.5 pl-10 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />  
             <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>  
          </div>  
          {loading ? <div className="text-center text-gray-500 py-10 animate-pulse">Loading Channels...</div> : (  
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">  
              {filteredChannels.map((channel) => (  
                <div key={channel.id} onClick={() => setCurrentChannel(channel)} className={`group relative flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg transition-all ${currentChannel?.id === channel.id ? "bg-gray-800 ring-1 ring-cyan-500" : "bg-[#1f2937] hover:bg-gray-800"}`}>  
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded p-1 overflow-hidden shadow-lg relative border border-gray-700">  
                    {channel.logo ? <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">TV</div>}  
                  </div>  
                  <span className={`text-[10px] sm:text-xs text-center font-medium line-clamp-1 w-full ${currentChannel?.id === channel.id ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-200"}`}>{channel.name}</span>  
                </div>  
              ))}  
            </div>  
          )}  
        </div>  

        {/* FOOTER & VISITOR COUNTER */}  
        <div className="bg-[#1e293b] rounded-lg p-3 border border-gray-800 flex flex-col items-center justify-center mb-8 space-y-2">  
            <div className="flex flex-col items-center justify-center gap-1">  
               <div className="text-xs text-gray-500"></div>  
            </div>  
            
            <div className="text-[10px] text-gray-400 text-center">  
              &copy; 2025 ToffeePro Streaming. All rights reserved.  
            </div>  
        </div>  

      </div>  
    </main>
  );
}
