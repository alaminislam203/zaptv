"use client";
import React, { useEffect, useState, useRef } from "react";
import { db } from "../app/firebase"; // পাথ ঠিক আছে কিনা চেক করুন
import { collection, query, where, getDocs, updateDoc, doc, increment } from "firebase/firestore";

interface AdProps {
  location: "top" | "middle" | "bottom";
}

export default function UserAdDisplay({ location }: AdProps) {
  const [ad, setAd] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const hasViewed = useRef(false);

  // --- DEVICE DETECTION ---
  const getDeviceType = () => {
    if (typeof navigator === "undefined") return "Desktop";
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Mobile";
    return "Desktop";
  };

  useEffect(() => {
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
             // বাজেট চেক
             const hasBudget = ad.spent_amount < ad.total_budget;
             // ডিভাইস টার্গেটিং চেক
             const targetDevices = ad.targeting?.devices || ["All"];
             const isDeviceMatch = targetDevices.includes("All") || targetDevices.includes(userDevice);
             
             return hasBudget && isDeviceMatch;
          });

        if (validAds.length > 0) {
          // 🔥 পরিবর্তন: র‍্যানডম বাদ দিয়ে হাইয়েস্ট বিড লজিক
          // যার bid_rate বেশি, সে সবার উপরে থাকবে
          validAds.sort((a, b) => Number(b.bid_rate) - Number(a.bid_rate));

          // সর্বোচ্চ বিডারকে সিলেক্ট করা
          setAd(validAds[0]);
        }
      } catch (e) { console.error("Ad Load Error:", e); }
    };
    fetchAd();
  }, [location]);

  // View Count (PPV Logic)
  useEffect(() => {
    if (ad && !hasViewed.current) {
        hasViewed.current = true;
        const recordView = async () => {
            const cost = ad.ad_model === "PPV" ? Number(ad.bid_rate) : 0;
            await updateDoc(doc(db, "campaigns", ad.id), {
                "analytics.views": increment(1),
                spent_amount: increment(cost)
            });
        };
        recordView();
    }
  }, [ad]);

  // Click Count (CPC Logic)
  const handleClick = async () => {
    if (!ad) return;
    const cost = ad.ad_model === "CPC" ? Number(ad.bid_rate) : 0;
    
    // ফায়ারবেস আপডেট
    await updateDoc(doc(db, "campaigns", ad.id), {
        "analytics.clicks": increment(1),
        spent_amount: increment(cost)
    });
    
    // লিংক ওপেন
    window.open(ad.target_url, "_blank");
  };

  if (!ad || !isVisible) return null;

  return (
    <div className="w-full my-4 relative group animate-fadeIn mx-auto max-w-4xl">
       {/* Ad Label */}
       <div className="absolute top-0 right-0 bg-gray-200/90 text-[9px] px-2 py-0.5 text-black z-10 rounded-bl-lg font-bold flex items-center gap-1 cursor-pointer shadow-sm">
         Sponsored <span onClick={(e)=>{e.stopPropagation(); setIsVisible(false);}} className="text-red-600 hover:text-red-800 ml-1 text-xs font-black">✕</span>
       </div>

       {/* Ad Image */}
       <div onClick={handleClick} className="cursor-pointer overflow-hidden rounded-xl border border-gray-800/50 relative bg-[#0f172a] shadow-lg hover:shadow-cyan-500/10 transition-all">
          <img src={ad.banner_url} alt={ad.title} className="w-full h-auto max-h-[150px] object-contain transition-transform duration-500 group-hover:scale-[1.02]" />
          
          {/* Hover Overlay Title */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs font-bold truncate">{ad.title}</p>
              <p className="text-[9px] text-cyan-400">Click to visit site ➔</p>
          </div>
       </div>
    </div>
  );
}
