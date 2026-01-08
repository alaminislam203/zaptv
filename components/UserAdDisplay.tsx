"use client";
import React, { useEffect, useState, useRef } from "react";
import { db } from "../src/app/firebase"; // পাথ ঠিক আছে কিনা চেক করবেন
import { 
  collection, query, where, getDocs, updateDoc, doc, increment 
} from "firebase/firestore";

interface AdProps {
  location: "top" | "middle" | "popup";
}

export default function UserAdDisplay({ location }: AdProps) {
  const [ad, setAd] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const hasViewed = useRef(false);

  // --- 1. DEVICE DETECTION ---
  const getDeviceType = () => {
    if (typeof navigator === "undefined") return "Desktop";
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Mobile";
    return "Desktop";
  };

  // --- 2. FETCH & FILTER ADS ---
  useEffect(() => {
    const fetchAd = async () => {
      try {
        // ১. শুধুমাত্র Active অ্যাডগুলো আনবে
        const q = query(collection(db, "campaigns"), where("status", "==", "active"));
        const snapshot = await getDocs(q);
        
        const userDevice = getDeviceType();
        
        // ২. অ্যাডভান্সড ফিল্টারিং (বাজেট + টার্গেটিং)
        const validAds = snapshot.docs
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
          // ৩. র‍্যানডম সিলেকশন (যাতে সব অ্যাড সুযোগ পায়)
          const randomAd = validAds[Math.floor(Math.random() * validAds.length)];
          setAd(randomAd);
        }
      } catch (e) {
        console.error("Ad Load Error:", e);
      }
    };

    fetchAd();
  }, [location]);

  // --- 3. RECORD VIEW (PPV LOGIC) ---
  useEffect(() => {
    if (ad && !hasViewed.current) {
        const recordView = async () => {
            hasViewed.current = true;
            const adRef = doc(db, "campaigns", ad.id);
            
            // PPV হলে টাকা কাটবে, না হলে শুধু ভিউ কাউন্ট হবে
            const cost = ad.ad_model === "PPV" ? Number(ad.bid_rate) : 0;

            await updateDoc(adRef, {
                "analytics.views": increment(1),
                spent_amount: increment(cost)
            });
        };
        recordView();
    }
  }, [ad]);

  // --- 4. RECORD CLICK (CPC LOGIC) ---
  const handleClick = async () => {
    if (!ad) return;
    
    // CPC হলে টাকা কাটবে
    const cost = ad.ad_model === "CPC" ? Number(ad.bid_rate) : 0;
    const adRef = doc(db, "campaigns", ad.id);

    // ফায়ারবেসে আপডেট
    await updateDoc(adRef, {
        "analytics.clicks": increment(1),
        "analytics.ctr": "Calculating...", // আপনি চাইলে পরে ক্যালকুলেট করতে পারেন
        spent_amount: increment(cost)
    });

    // নতুন ট্যাবে লিংক ওপেন
    window.open(ad.target_url, "_blank");
  };

  if (!ad || !isVisible) return null;

  return (
    <div className="w-full my-4 relative group animate-fadeIn">
       {/* Ad Label */}
       <div className="absolute top-0 right-0 bg-gray-200/80 backdrop-blur text-[8px] px-1.5 py-0.5 text-black z-10 rounded-bl-lg font-bold flex items-center gap-1">
         Sponsored
         <button onClick={(e)=>{e.stopPropagation(); setIsVisible(false);}} className="hover:text-red-500 font-bold ml-1">×</button>
       </div>

       {/* Ad Image */}
       <div onClick={handleClick} className="cursor-pointer overflow-hidden rounded-xl border border-gray-800 relative">
          <img src={ad.banner_url} alt={ad.title} className="w-full h-auto max-h-[120px] object-contain bg-black transition-transform duration-500 group-hover:scale-105" />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
             <div>
                <p className="text-white text-xs font-bold">{ad.title}</p>
                <p className="text-[9px] text-cyan-400">Visit Site ➔</p>
             </div>
          </div>
       </div>
    </div>
  );
}
