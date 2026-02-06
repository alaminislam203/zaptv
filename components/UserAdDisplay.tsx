"use client";
import React, { useEffect, useState, useRef } from "react";
import { db } from "../src/app/firebase"; // পাথ চেক করুন
import { collection, query, where, getDocs, updateDoc, doc, increment } from "firebase/firestore";

interface AdProps {
  location: "top" | "middle" | "bottom";
}

export default function UserAdDisplay({ location }: AdProps) {
  const [ad, setAd] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const hasRecordedView = useRef(false);

  // --- DEVICE DETECTION ---
  const getDeviceType = () => {
    if (typeof navigator === "undefined") return "Desktop";
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Mobile";
    return "Desktop";
  };

  // --- FETCH & RANDOMIZE ADS ---
  const fetchAd = async () => {
    try {
      // ১. শুধুমাত্র Active অ্যাডগুলো আনবে
      const q = query(collection(db, "campaigns"), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      
      const userDevice = getDeviceType();

      // ২. ফিল্টারিং (বাজেট + ডিভাইস টার্গেটিং)
      let validAds = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(ad => {
           const spent = Number(ad.spent_amount || 0);
           const budget = Number(ad.total_budget || 0);
           const hasBudget = spent < budget;
           
           const targetDevices = ad.targeting?.devices || ["All"];
           const isDeviceMatch = targetDevices.includes("All") || targetDevices.includes(userDevice);
           
           return hasBudget && isDeviceMatch;
        });

      if (validAds.length > 0) {
        // 🔥 পরিবর্তন: র‍্যানডম সিলেকশন (Weighted Random)
        // লজিক: বিড রেট বেশি হলে লিস্টে একাধিকবার যোগ হবে, ফলে আসার সম্ভাবনা বাড়বে
        let weightedPool: any[] = [];
        
        validAds.forEach(ad => {
            const weight = Math.ceil(Number(ad.bid_rate)); // বিড রেট অনুযায়ী গুরুত্ব
            for(let i=0; i<weight; i++) {
                weightedPool.push(ad);
            }
        });

        // পুল থেকে পুরোপুরি র‍্যানডম একটা সিলেক্ট করা
        const randomAd = weightedPool[Math.floor(Math.random() * weightedPool.length)];
        
        setAd(randomAd);
        hasRecordedView.current = false; // নতুন এডের জন্য ভিউ রিসেট
      }
    } catch (e) { console.error("Ad Load Error:", e); }
  };

  // প্রথম লোড এবং অটো রিফ্রেশ (৩০ সেকেন্ড পর পর)
  useEffect(() => {
    fetchAd();
    const interval = setInterval(fetchAd, 30000); // 30s Auto Refresh
    return () => clearInterval(interval);
  }, [location]);

  // --- RECORD VIEW (SMART LOGIC) ---
  useEffect(() => {
    if (ad && !hasRecordedView.current) {
        hasRecordedView.current = true;
        
        const recordView = async () => {
            try {
                // PPV হলে টাকা কাটবে
                const cost = ad.ad_model === "PPV" ? Number(ad.bid_rate) : 0;
                const adRef = doc(db, "campaigns", ad.id);
                
                await updateDoc(adRef, {
                    "analytics.views": increment(1),
                    spent_amount: increment(cost)
                });
            } catch (e) { console.error("Stats Error:", e); }
        };
        recordView();
    }
  }, [ad]);

  // --- RECORD CLICK ---
  const handleClick = async () => {
    if (!ad) return;
    try {
        // CPC হলে টাকা কাটবে
        const cost = ad.ad_model === "CPC" ? Number(ad.bid_rate) : 0;
        const adRef = doc(db, "campaigns", ad.id);
        
        await updateDoc(adRef, {
            "analytics.clicks": increment(1),
            spent_amount: increment(cost)
        });
        
        // নতুন ট্যাবে ওপেন
        window.open(ad.target_url, "_blank");
    } catch (e) { console.error("Click Error:", e); }
  };

  if (!ad || !isVisible) return null;

  return (
    <div className="w-full my-6 relative group animate-fadeIn mx-auto max-w-5xl z-0 px-2 md:px-0">
       
       {/* Glassmorphism Badge */}
       <div className="absolute top-2 right-2 md:right-0 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] px-2 py-1 text-white z-10 rounded-lg flex items-center gap-2 shadow-lg">
         <span className="font-bold tracking-wider text-cyan-400">Ads by ToffePro</span>
         <button onClick={(e)=>{e.stopPropagation(); setIsVisible(false);}} className="text-white/60 hover:text-red-400 font-bold text-sm transition">✕</button>
       </div>

       {/* Main Ad Container */}
       <div onClick={handleClick} className="cursor-pointer overflow-hidden rounded-2xl border border-gray-800 relative bg-[#0a0f1c] shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300">
          
          {/* Image */}
          <div className="relative aspect-[16/5] md:aspect-[21/4] w-full flex items-center justify-center bg-gradient-to-r from-gray-900 to-black">
             <img 
               src={ad.banner_url} 
               alt={ad.title} 
               className="w-full h-full object-cover md:object-contain transition-transform duration-700 group-hover:scale-105" 
             />
          </div>
          
          {/* Bottom Info Bar (Only visible on hover or mobile) */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-3 md:p-4 flex justify-between items-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
              <div>
                  <h3 className="text-white text-sm md:text-lg font-bold drop-shadow-md">{ad.title}</h3>
                  <p className="text-[10px] md:text-xs text-gray-300 line-clamp-1">{ad.target_url}</p>
              </div>
              <button className="bg-cyan-600 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg hover:bg-cyan-500 transition-colors transform translate-y-0 md:translate-y-2 md:group-hover:translate-y-0">
                  Visit Site ➔
              </button>
          </div>
       </div>
    </div>
  );
}
