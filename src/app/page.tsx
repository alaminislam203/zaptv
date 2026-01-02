"use client";
import React, { useState, useEffect, useRef } from "react";
// 1. Firebase imports
import { 
  collection, onSnapshot, addDoc, doc, 
  query, orderBy, runTransaction 
} from "firebase/firestore";
import { 
  ref, onValue, off, set, onDisconnect, serverTimestamp 
} from "firebase/database";
// নোট: আপনার firebase ফাইলটি কোথায় আছে তা নিশ্চিত করুন (সাধারণত ../firebase হয়)
import { db, rtdb } from "./firebase"; 
import Link from "next/link";

// 2. Dynamic Imports
import dynamic from "next/dynamic";

const LoadingPlayer = () => (
  <div className="w-full h-full bg-black flex items-center justify-center text-gray-500 animate-pulse flex-col gap-2">
    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs">Loading Stream...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { 
  ssr: false, loading: () => <LoadingPlayer /> 
});
const VideoJSPlayer = dynamic(() => import("../../components/VideoJSPlayer"), { 
  ssr: false, loading: () => <LoadingPlayer /> 
});
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { 
  ssr: false, loading: () => <LoadingPlayer /> 
});
const ShakaPlayer = dynamic(() => import("../../components/ShakaPlayer"), { 
  ssr: false, loading: () => <LoadingPlayer /> 
});
const IframePlayer = dynamic(() => import("../../components/IframePlayer"), { 
  ssr: false 
});
// PlayerJS ইমপোর্ট করা হলো
const PlayerJSPlayer = dynamic(() => import("../../components/PlayerJSPlayer"), { 
  ssr: false, loading: () => <LoadingPlayer /> 
});

// --- Interfaces ---
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
  // Data States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [activeDirectLink, setActiveDirectLink] = useState<{url: string, label: string} | null>(null);

  // Player & User States
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  // প্লেয়ার টাইপে 'playerjs' যুক্ত করা হলো
  const [playerType, setPlayerType] = useState<"plyr" | "videojs" | "native" | "playerjs">("plyr");
  const [isClient, setIsClient] = useState(false);
  const scriptsLoaded = useRef(false);

  // --- ALL HOOKS ---

  // Random Direct Link Logic
  useEffect(() => {
    if (siteConfig?.directLinks && Array.isArray(siteConfig.directLinks) && siteConfig.directLinks.length > 0) {
        const randomIndex = Math.floor(Math.random() * siteConfig.directLinks.length);
        setActiveDirectLink(siteConfig.directLinks[randomIndex]);
    }
  }, [siteConfig]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setPlayerType("plyr");
    setActiveSourceIndex(0);
    if(currentChannel) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      checkIfFavorite(currentChannel.id);
    }
  }, [currentChannel]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I") || (e.ctrlKey && e.key === "u")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const unsubChannels = onSnapshot(collection(db, "channels"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Channel[];
      setChannels(list);
      setLoading(false);
    });
    const unsubMatches = onSnapshot(collection(db, "hotMatches"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as HotMatch[];
      setMatches(list);
    });
    const unsubAds = onSnapshot(collection(db, "ads"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as AdData[];
      setAds(list);
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSiteConfig(docSnap.data());
    });
    return () => { unsubChannels(); unsubMatches(); unsubAds(); unsubSettings(); };
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const counterRef = doc(db, 'counters', 'visitors');
    const incrementTotalVisitors = async () => {
        if (!sessionStorage.getItem('visitedThisSession')) {
            sessionStorage.setItem('visitedThisSession', 'true');
            try {
                await runTransaction(db, async (transaction) => {
                    const docSnap = await transaction.get(counterRef);
                    if (!docSnap.exists()) {
                        transaction.set(counterRef, { total: 1 });
                        setTotalVisitors(1);
                    } else {
                        const newTotal = docSnap.data().total + 1;
                        transaction.update(counterRef, { total: newTotal });
                        setTotalVisitors(newTotal);
                    }
                });
            } catch (e) { console.error("Failed to increment visitor count:", e); }
        }
    };
    const unsub = onSnapshot(counterRef, (doc) => {
        if (doc.exists()) setTotalVisitors(doc.data().total);
    });
    incrementTotalVisitors();
    
    const myConnectionsRef = ref(rtdb, 'status/' + Math.random().toString(36).substr(2, 9));
    const connectedRef = ref(rtdb, '.info/connected');
    const statusRef = ref(rtdb, 'status');
    const unsubscribe = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            set(myConnectionsRef, { timestamp: serverTimestamp() });
            onDisconnect(myConnectionsRef).remove();
        }
    });
    const unsubscribeStatus = onValue(statusRef, (snap) => setOnlineUsers(snap.size));
    return () => {
        unsub();
        off(connectedRef);
        off(statusRef);
        onDisconnect(myConnectionsRef).cancel();
        set(myConnectionsRef, null);
    };
  }, [isClient]);

  useEffect(() => {
    if (!scriptsLoaded.current) {
      const detectAdBlock = async () => {
          let adBlockEnabled = false;
          try { await fetch(new Request("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", { method: 'HEAD', mode: 'no-cors' })); } catch (e) { adBlockEnabled = true; }
          if (adBlockEnabled) {
              const modal = document.createElement('div');
              modal.innerHTML = `<div style='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:99999;display:flex;justify-content:center;align-items:center;flex-direction:column;backdrop-filter:blur(5px);color:#fff;text-align:center;'><h2 style='color:#ef4444;margin-bottom:10px;font-size:24px;font-weight:bold;'>Adblock Detected!</h2><p style='font-size:16px;'>Please disable your adblocker to keep our site free.</p><button onclick='location.reload()' style='background:#ef4444;color:white;border:none;padding:10px 20px;margin-top:15px;cursor:pointer;border-radius:5px;font-weight:bold;'>Refresh Page</button></div>`;
              document.body.appendChild(modal);
          }
      };
      setTimeout(detectAdBlock, 2000);
    }
    if (siteConfig?.enablePopunder === true) {
        const existingScript = document.querySelector('script[data-zone="10282293"]');
        if (!existingScript) {
            const adScript = document.createElement('script');
            adScript.dataset.zone = '10282293';
            adScript.src = 'https://al5sm.com/tag.min.js';
            document.documentElement.appendChild(adScript);
        }
    }
    scriptsLoaded.current = true;
  }, [siteConfig]);

  const checkIfFavorite = (id: string) => setIsFavorite(JSON.parse(localStorage.getItem("favorites") || '[]').some((c: Channel) => c.id === id));
  const toggleFavorite = () => {
    if (!currentChannel) return;
    let favs = JSON.parse(localStorage.getItem("favorites") || '[]');
    if (isFavorite) favs = favs.filter((c: Channel) => c.id !== currentChannel.id);
    else favs.push(currentChannel);
    localStorage.setItem("favorites", JSON.stringify(favs));
    checkIfFavorite(currentChannel.id);
    alert(isFavorite ? "Removed from Favorites" : "Added to Favorites ❤️");
  };

  const handleReport = async () => {
    if (!currentChannel) return;
    if (confirm(`Report "${currentChannel.name}"?`)) {
      try {
        await addDoc(collection(db, "reports"), { channelName: currentChannel.name, channelId: currentChannel.id, sourceLabel: currentChannel.sources[activeSourceIndex]?.label || "Default", timestamp: new Date(), status: "pending", issue: "Stream not working" });
        alert("Report submitted successfully!");
      } catch (e) { console.error("Error reporting:", e); }
    }
  };

  const filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleMatchClick = (name: string) => {
    const chan = channels.find(c => c.name.toLowerCase() === name.toLowerCase() || c.id === name);
    if (chan) setCurrentChannel(chan);
    else alert("Channel not found!");
  };

  const getAd = (loc: "top" | "middle") => ads.find(ad => ad.location === loc);
  const topAd = getAd("top");
  const middleAd = getAd("middle");

  const renderPlayer = () => {
    if (!isClient) return <LoadingPlayer />;
    if (!currentChannel) return <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-black"><p className="text-xl font-bold tracking-widest animate-pulse">SELECT A CHANNEL</p></div>;
    if (!currentChannel.sources?.length) return <div className="text-white flex justify-center items-center h-full">No Source Available</div>;

    const activeSource = currentChannel.sources[activeSourceIndex];
    const { url, drm } = activeSource;
    
    if (currentChannel.is_embed) return <IframePlayer src={url} />;
    if (url.includes(".mpd") || drm) return <ShakaPlayer src={url} drm={drm} />;
    
    if (url.includes(".m3u8")) {
      const sourceProps = { src: url, drm: drm };
      switch (playerType) {
          case "videojs": return <VideoJSPlayer src={url} />;
          case "native": return <NativePlayer src={url} />;
          // PlayerJS লজিক যোগ করা হলো
          case "playerjs": return <PlayerJSPlayer src={url} />;
      }
    }
    return <IframePlayer src={url} />;
  };

  if (siteConfig?.maintenanceMode === true) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center p-6 text-white">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Site Under Maintenance 🛠️</h1>
        <p className="text-lg text-gray-400">We are improving our site. Please check back later.</p>
        <div className="mt-8 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-gray-200 font-sans pb-10 select-none">
      <header className="bg-[#0f172a] border-b border-gray-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentChannel(null)}>
            <div className="text-2xl font-bold"><span className="bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">ToffeeLiveToday</span></div>
          </div>
          <div className="flex items-center gap-3">
             <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold animate-pulse">● LIVE</span>
             <Link href="/admin"><button className="text-sm bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition text-white">Login</button></Link>
          </div>
        </div>
        <div className="bg-[#1e293b] h-8 flex items-center overflow-hidden relative border-b border-gray-800"><div className="whitespace-pre animate-marquee text-xs text-white-400 pl-4 font-mono">{siteConfig.marqueeText || "Welcome to ToffeePro! Please disable adblocker to keep our site free."}</div></div>
      </header>

      <div className="max-w-4xl mx-auto px-2 md:px-4 mt-4 space-y-4">
        {topAd && (
          <div className="w-full min-h-[50px] bg-[#1e293b] rounded flex flex-col items-center justify-center overflow-hidden border border-gray-800 relative group">
            <span className="absolute top-0 right-0 bg-gray-700 text-[8px] px-1 text-white">Ad</span>
            {topAd.imageUrl ? <a href={topAd.link || "#"} target="_blank" className="w-full"><img src={topAd.imageUrl} alt="Ad" className="w-full h-auto object-cover max-h-32" /></a> : <div className="text-center p-2 text-cyan-500 font-bold">{topAd.text}</div>}
          </div>
        )}

        <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
          <div className="aspect-video w-full bg-black relative"><div key={`${currentChannel?.id}-${activeSourceIndex}-${playerType}`} className="w-full h-full">{renderPlayer()}</div></div>
          <div className="bg-[#0f172a] p-2 flex flex-wrap items-center justify-between text-xs border-t border-gray-800 gap-2">
            {currentChannel?.sources[activeSourceIndex]?.url.includes(".m3u8") && !currentChannel.is_embed && (
                <div className="flex gap-2 items-center">
                    <span className="text-gray-500 hidden sm:block">Engine:</span>
                    <button onClick={() => setPlayerType("plyr")} className={`px-3 py-1 rounded border transition ${playerType === "plyr" ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 text-gray-400"}`}>Player-1</button>
                    <button onClick={() => setPlayerType("videojs")} className={`px-3 py-1 rounded border transition ${playerType === "videojs" ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 text-gray-400"}`}>Player-2</button>
                    <button onClick={() => setPlayerType("native")} className={`px-3 py-1 rounded border transition ${playerType === "native" ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 text-gray-400"}`}>Player-3</button>
                    {/* PlayerJS Button Added */}
                    <button onClick={() => setPlayerType("playerjs")} className={`px-3 py-1 rounded border transition ${playerType === "playerjs" ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 text-gray-400"}`}>Player-4</button>
                </div>
            )}
            <div className="flex gap-2 ml-auto">
                <button onClick={() => document.querySelector("video")?.requestPictureInPicture()} className="flex items-center gap-1 hover:text-cyan-400 px-3 py-1 bg-gray-800/50 rounded"><span className="text-lg">⛶</span></button>
                <button onClick={toggleFavorite} className={`flex items-center gap-1 px-3 py-1 bg-gray-800/50 rounded transition ${isFavorite ? "text-pink-500" : "text-gray-300"}`}><span className="text-lg">{isFavorite ? "♥" : "♡"}</span></button>
                <button onClick={handleReport} className="flex items-center gap-1 text-red-400 bg-red-900/20 px-3 py-1 rounded border border-red-500/20">⚠ Report</button>
            </div>
          </div>
        </div>

        {activeDirectLink && (
            <div className="flex justify-center animate-bounce mt-4">
                <a 
                href={activeDirectLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-green-600 to-emerald-800 text-white font-bold py-3 px-8 rounded-full shadow-lg border-2 border-green-400 hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer z-10"
                >
                <span className="text-xl"></span> {activeDirectLink.label}
                </a>
            </div>
        )}

        <div className="bg-[#1e293b] p-4 rounded-lg border border-gray-700 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-black border border-gray-600 overflow-hidden flex-shrink-0">{currentChannel?.logo ? <img src={currentChannel.logo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📡</div>}</div>
           <div className="flex-1">
             <h2 className="text-lg font-bold text-white">{currentChannel?.name || "Select a Channel"}</h2>
             <p className="text-xs text-green-400">{currentChannel ? "● Playing Now" : "Please select from below"}</p>
           </div>
           {currentChannel && currentChannel.sources.length > 1 && (
             <div className="flex gap-2 flex-wrap justify-end">
               {currentChannel.sources.map((src, idx) => <button key={idx} onClick={() => setActiveSourceIndex(idx)} className={`text-xs px-3 py-1.5 rounded font-bold border transition-all ${activeSourceIndex === idx ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300"}`}>{src.label || `Server ${idx+1}`}</button>)}
             </div>
           )}
        </div>

        {middleAd && <div className="w-full min-h-[40px] bg-[#1e293b] rounded flex flex-col items-center justify-center overflow-hidden border border-gray-800 relative mt-2"><span className="absolute top-0 right-0 bg-gray-700 text-[8px] px-1 text-white">Ad</span>{middleAd.imageUrl ? <a href={middleAd.link || "#"} target="_blank" className="w-full"><img src={middleAd.imageUrl} alt="Ad" className="w-full h-auto object-cover max-h-24" /></a> : <div className="text-center p-2 text-gray-300 text-xs">{middleAd.text}</div>}</div>}

        {matches.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm px-1"><span className="animate-pulse">🔥</span> HOT MATCHES</div>
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
              {matches.map((match) => <div key={match.id} onClick={() => handleMatchClick(match.channelName)} className="min-w-[240px] bg-[#1e293b] p-3 rounded-lg border border-gray-700 relative flex-shrink-0 cursor-pointer hover:border-orange-500 transition-all group"><span className="absolute top-2 right-2 bg-red-600 text-[9px] px-2 py-0.5 rounded text-white font-bold shadow-lg animate-pulse">LIVE</span><div className="mt-4 flex justify-between items-center text-sm font-bold text-gray-200"><span className="truncate max-w-[45%]">{match.team1}</span><span className="text-gray-500 text-xs">VS</span><span className="truncate max-w-[45%] text-right">{match.team2}</span></div><div className="mt-3 flex justify-between items-center border-t border-gray-700 pt-2"><span className="text-[10px] text-cyan-400 font-medium">{match.info}</span><span className="text-[10px] text-gray-400 flex items-center gap-1">🕒 {match.matchTime}</span></div></div>)}
            </div>
          </div>
        )}

        <div className="bg-[#111827] p-4 rounded-xl border border-gray-800">
          <div className="mb-4 relative"><input type="text" placeholder="Search for a channel..." className="w-full bg-[#1f2937] text-white text-sm px-4 py-2.5 pl-10 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /><span className="absolute left-3 top-2.5 text-gray-500">🔍</span></div>
          {loading ? <div className="text-center text-gray-500 py-10 animate-pulse">Loading Channels...</div> : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredChannels.map(ch => <div key={ch.id} onClick={() => setCurrentChannel(ch)} className={`group relative flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg transition-all ${currentChannel?.id === ch.id ? "bg-gray-800 ring-1 ring-cyan-500" : "bg-[#1f2937] hover:bg-gray-800"}`}><div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded p-1 overflow-hidden shadow-lg relative border border-gray-700">{ch.logo ? <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">TV</div>}</div><span className={`text-[10px] sm:text-xs text-center font-medium line-clamp-1 w-full ${currentChannel?.id === ch.id ? "text-cyan-400" : "text-gray-400 group-hover:text-gray-200"}`}>{ch.name}</span></div>)}
            </div>
          )}
        </div>

        <div className="bg-[#1e293b] rounded-lg p-3 border border-gray-800 flex flex-col items-center justify-center mb-8 space-y-2">
            <div className="flex items-center space-x-6 text-xs text-gray-400">
                <div className="text-center"><p className="font-bold text-lg text-green-400">{onlineUsers}</p><p className="text-gray-500">Online</p></div>
                <div className="border-l border-gray-600 h-8"></div>
                <div className="text-center"><p className="font-bold text-lg text-cyan-400">{totalVisitors}</p><p className="text-gray-500">Visitors</p></div>
            </div>
            <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-700 w-full mt-2">&copy; 2025 ToffeePro Streaming. All rights reserved.</div>
        </div>
      </div>
    </main>
  );
}
