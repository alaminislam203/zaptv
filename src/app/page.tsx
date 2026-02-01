"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// --- DYNAMIC IMPORTS ---
const LoadingPlayer = () => (
  <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 shadow-2xl">
    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[10px] text-red-500 font-black animate-pulse tracking-[0.3em] uppercase">Securing Stream...</span>
  </div>
);

const PlyrPlayer = dynamic(() => import("../../components/PlyrPlayer"), { ssr: false, loading: () => <LoadingPlayer /> });
const NativePlayer = dynamic(() => import("../../components/NativePlayer"), { ssr: false, loading: () => <LoadingPlayer /> });

export default function UltimateLivePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "plyr">("native");
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // --- ADMIN CONTROL STATES ---
  const [adminSettings, setAdminSettings] = useState({
    noticeText: "স্বাগতম! আমাদের সাইটে কোনো প্রকার জুয়া বা বেটিং বিজ্ঞাপন প্রচার করা হয় না।",
    showPopAds: true,
    showBannerAds: true,
    activeNotification: {
      show: true,
      title: "লাইভ আপডেট",
      msg: "ভারত বনাম পাকিস্তান ম্যাচটি শুরু হয়েছে! এখনই জয়েন করুন।"
    }
  });

  const fallbackImage = "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image";

  // ১. ডিজিটাল ঘড়ি লজিক
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  // ২. অ্যাড স্ক্রিপ্ট ইনজেকশন (ফিক্সড ভার্সন)
  useEffect(() => {
    // স্ক্রিপ্ট ১ (টাইপ সেফ)
    (function(s: any) {
      s.dataset.zone = '10282293';
      s.src = 'https://al5sm.com/tag.min.js';
      
      const target = [document.documentElement, document.body].filter(Boolean).pop();
      if (target) {
        target.appendChild(s);
      }
    })(document.createElement('script'));

    // স্ক্রিপ্ট ২ (আগের মতোই)
    const script2 = document.createElement("script");
    script2.src = "https://3nbf4.com/act/files/tag.min.js?z=10282294";
    script2.dataset.cfasync = "false";
    script2.async = true;
    document.body.appendChild(script2);

    return () => {
      if (document.body.contains(script2)) document.body.removeChild(script2);
    };
  }, []);


  // ৩. এন্টি অ্যাড-ব্লকার লজিক
  useEffect(() => {
    const checkAdBlock = async () => {
      try {
        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD", mode: "no-cors", cache: "no-store",
        });
        setIsAdBlockActive(false);
      } catch (error) {
        setIsAdBlockActive(true);
      }
    };

    const backupCheck = () => {
      const fakeAd = document.createElement("div");
      fakeAd.className = "adsbox ad-unit ad-zone ads-google public_ads";
      fakeAd.style.position = "absolute"; fakeAd.style.left = "-999px";
      document.body.appendChild(fakeAd);
      setTimeout(() => {
        if (fakeAd.offsetHeight === 0) setIsAdBlockActive(true);
        document.body.removeChild(fakeAd);
      }, 100);
    };

    checkAdBlock();
    backupCheck();
  }, []);

  // ৪. ডেটা ফেচিং
  useEffect(() => {
    const savedRegion = localStorage.getItem("fc_region");
    if (savedRegion) setUserRegion(savedRegion);
    else setShowRegionModal(true);

    const fetchData = async () => {
      try {
        const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json");
        const data = await res.json();
        setMatches(data.matches || []);
        if (adminSettings.activeNotification.show) {
          setTimeout(() => setShowNotification(true), 3000);
        }
      } catch (err) { console.error("Load failed"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [adminSettings.activeNotification.show]);

  const handleSetRegion = (region: string) => {
    setUserRegion(region);
    localStorage.setItem("fc_region", region);
    setShowRegionModal(false);
  };

  const getStreamUrl = (match: any) => {
    let url = match.adfree_url || match.dai_url || "";
    return userRegion === "BD" ? url.replace("https://in", "https://bd") : url;
  };

  const filteredMatches = selectedCategory === "All" ? matches : matches.filter(m => m.event_category === selectedCategory);
  const categories = ["All", ...Array.from(new Set(matches.map(m => m.event_category || "Others")))];

  // অ্যাড-ব্লকার সতর্কবার্তা রেন্ডার
  if (isAdBlockActive) {
    return (
      <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
        <div className="bg-[#0a0a0c] border border-red-600/30 p-10 rounded-[2.5rem] max-w-md shadow-2xl">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Ad-Blocker Detected!</h2>
          <p className="text-zinc-500 text-xs mt-3 leading-relaxed">আমাদের ফ্রি সার্ভিসটি সচল রাখতে দয়া করে আপনার অ্যাড-ব্লকারটি বন্ধ করুন।</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 transition-all">Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-200 font-sans selection:bg-red-600/30">
      
      {/* ১. রিজিয়ন মডাল */}
      {showRegionModal && (
        <div className="fixed inset-0 z-[200] bg-black/98 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#0f0f11] border border-white/10 p-10 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">সার্ভার নির্বাচন করুন</h2>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => handleSetRegion("BD")} className="bg-white text-black font-black py-4 rounded-2xl hover:bg-green-500 transition-colors uppercase">🇧🇩 Bangladesh</button>
              <button onClick={() => handleSetRegion("IN")} className="bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-colors uppercase">🇮🇳 Global</button>
            </div>
          </div>
        </div>
      )}

      {/* ২. পুশ নোটিফিকেশন */}
      {showNotification && (
        <div className="fixed top-24 right-5 z-[300] bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] shadow-2xl animate-in slide-in-from-right duration-500 max-w-sm">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-2xl text-white italic font-black">!</div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{adminSettings.activeNotification.title}</p>
              <p className="text-sm font-bold text-white/90 leading-tight">{adminSettings.activeNotification.msg}</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-zinc-600 hover:text-white transition-colors text-lg">✕</button>
          </div>
        </div>
      )}

      {/* ৩. নোটিশ বার */}
      <div className="bg-gradient-to-r from-red-900/20 via-black to-red-900/20 border-b border-white/5 py-2.5 relative overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[11px] font-black text-zinc-400 px-10 uppercase tracking-widest">{adminSettings.noticeText}</span>
          <span className="text-[11px] font-black text-zinc-400 px-10 uppercase tracking-widest">{adminSettings.noticeText}</span>
        </div>
      </div>

      {/* ৪. নেভিবার */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center font-black italic text-white shadow-2xl">F</div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">FAN<span className="text-red-600">CODE</span></h1>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden lg:block text-right border-r border-white/10 pr-8">
              <p className="text-[9px] text-zinc-600 font-black tracking-widest uppercase italic">Dhaka Time</p>
              <p className="text-lg font-mono text-white font-black">{currentTime}</p>
            </div>
            <button onClick={() => setShowRegionModal(true)} className="bg-zinc-900/50 border border-white/10 px-5 py-2.5 rounded-2xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest">
              🌐 {userRegion || 'Server'}
            </button>
          </div>
        </div>
      </header>

      {/* ৫. সতর্কবার্তা */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-[#0d0d0d] border border-white/5 p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-orange-500 rounded-3xl flex items-center justify-center text-4xl">🔞</div>
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Warning: জুয়া বা বেটিং নিষিদ্ধ!</h3>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">বিজ্ঞাপনের আয় দিয়েই আমরা সার্ভার খরচ চালাই। জুয়া থেকে দূরে থাকুন।</p>
          </div>
        </div>
      </div>

      {/* ৬. ভিডিও প্লেয়ার লেআউট */}
      {activeMatch && (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col lg:flex-row">
          <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
            <button onClick={() => setActiveMatch(null)} className="absolute top-8 left-8 z-[110] bg-white/5 hover:bg-red-600 p-4 rounded-3xl backdrop-blur-3xl transition-all border border-white/10 text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="w-full h-full">
              {playerType === "native" ? <NativePlayer src={getStreamUrl(activeMatch)} /> : <PlyrPlayer src={getStreamUrl(activeMatch)} />}
            </div>
          </div>
          <div className="w-full lg:w-[400px] bg-[#080808] border-l border-white/5 p-8 flex flex-col overflow-y-auto">
            <Badge color="red">{activeMatch.event_category}</Badge>
            <h2 className="text-3xl font-black text-white mt-4 uppercase italic tracking-tighter">{activeMatch.match_name}</h2>
            <div className="mt-10">
              <p className="text-[10px] text-zinc-600 font-black uppercase mb-4 tracking-widest">Player Switch</p>
              <div className="flex bg-zinc-900/30 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setPlayerType("native")} className={`flex-1 py-4 text-[11px] font-black rounded-xl transition-all ${playerType === 'native' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-600'}`}>NATIVE</button>
                <button onClick={() => setPlayerType("plyr")} className={`flex-1 py-4 text-[11px] font-black rounded-xl transition-all ${playerType === 'plyr' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-600'}`}>PLYR V3</button>
              </div>
            </div>

            {/* প্লেয়ার অ্যাড */}
            {adminSettings.showBannerAds && (
              <div className="mt-12 p-6 bg-zinc-900/50 rounded-3xl border border-white/5 flex flex-col items-center">
                <p className="text-[9px] text-zinc-700 font-black uppercase mb-4 tracking-widest">Sponsored</p>
                <div className="w-[300px] h-[250px] overflow-hidden rounded-xl bg-black border border-white/10">
                  <iframe src="about:blank" style={{ width: '300px', height: '250px', border: 'none' }} onMouseEnter={(e) => {
                    const doc = e.currentTarget.contentWindow?.document;
                    if (doc && doc.body.innerHTML === "") {
                      doc.open(); doc.write(`
                        <script type="text/javascript">
                          atOptions = { 'key' : 'f2f17f2fb72b5519eee3147ed075d1fb', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };
                        </script>
                        <script type="text/javascript" src="https://www.highperformanceformat.com/f2f17f2fb72b5519eee3147ed075d1fb/invoke.js"></script>
                      `); doc.close();
                    }
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ৭. ম্যাচ লিস্ট গ্রিড */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 mb-12">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedCategory === cat ? "bg-red-600 border-red-600 text-white" : "bg-transparent border-white/10 text-zinc-500 hover:border-white/40"}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-zinc-900/50 rounded-[3rem] animate-pulse"></div>)
          ) : filteredMatches.map((match) => (
            <div key={match.match_id} onClick={() => setActiveMatch(match)} className="group cursor-pointer bg-[#0d0d0d] border border-white/5 rounded-[3rem] overflow-hidden hover:border-red-600/40 transition-all duration-700 hover:-translate-y-3 shadow-2xl">
              <div className="relative aspect-video overflow-hidden">
                <Image src={match.src || fallbackImage} alt={match.match_name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                {match.status === "LIVE" && (
                  <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 px-5 py-2 rounded-full text-[10px] font-black animate-pulse shadow-xl">LIVE</div>
                )}
              </div>
              <div className="p-10 pt-4">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{match.event_category}</span>
                <h3 className="text-xl font-black text-white line-clamp-2 uppercase italic tracking-tighter mt-2">{match.match_name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}

const Badge = ({ children, color }: any) => (
  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${color === 'red' ? 'bg-red-600/10 text-red-500 border border-red-600/20' : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}>
    {children}
  </span>
);
