"use client";
import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../src/app/firebase";

interface BannerAdProps {
  location: "top" | "bottom";
}

export default function GlobalBannerAd({ location }: BannerAdProps) {
  const [adHtml, setAdHtml] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data();
        setIsEnabled(config.adConfig?.showBannerAds || false);
        setAdHtml(location === "top" ? config.adConfig?.bannerAdTop : config.adConfig?.bannerAdBottom);
      }
    });
    return () => unsub();
  }, [location]);

  if (!isEnabled || !adHtml) return null;

  return (
    <div className="w-full flex justify-center my-8 px-4 overflow-hidden">
      <div
        className="max-w-7xl w-full flex justify-center items-center rounded-2xl overflow-hidden min-h-[90px] bg-white/5 border border-white/5 shadow-2xl"
        dangerouslySetInnerHTML={{ __html: adHtml }}
      />
    </div>
  );
}
