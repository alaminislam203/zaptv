"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Play, Clock, Star, TrendingUp } from "lucide-react";

interface ShortcutDashboardProps {
  channels: any[];
  onSelect: (channel: any) => void;
}

export default function ShortcutDashboard({ channels, onSelect }: ShortcutDashboardProps) {
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [popularChannels, setPopularChannels] = useState<any[]>([]);

  useEffect(() => {
    // Load recently viewed from localStorage
    const history = JSON.parse(localStorage.getItem("watch_history") || "[]");
    setRecentlyViewed(history.slice(0, 4));

    // For "Popular", we'll just take some random ones for now or first few
    if (channels.length > 0) {
      setPopularChannels(channels.slice(0, 8));
    }
  }, [channels]);

  if (recentlyViewed.length === 0 && popularChannels.length === 0) return null;

  return (
    <div className="space-y-12 mb-16">
      {recentlyViewed.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Recently Viewed</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentlyViewed.map((ch, idx) => (
              <button
                key={`${ch.id}-${idx}`}
                onClick={() => onSelect(ch)}
                className="group relative aspect-video rounded-2xl overflow-hidden glass border-white/5 hover:border-emerald-500/30 transition-all"
              >
                {ch.logo ? (
                  <Image src={ch.logo} alt={ch.name} fill className="object-contain p-4 group-hover:scale-110 transition-transform" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 font-black uppercase text-xs tracking-widest">No Logo</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <p className="text-[10px] font-black text-white uppercase truncate">{ch.name}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Popular Right Now</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {popularChannels.map((ch, idx) => (
            <button
              key={`${ch.id}-${idx}`}
              onClick={() => onSelect(ch)}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl glass border-white/5 hover:border-emerald-500/30 transition-all"
            >
              <div className="w-12 h-12 relative">
                {ch.logo ? (
                  <Image src={ch.logo} alt={ch.name} fill className="object-contain group-hover:rotate-12 transition-transform" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-full text-[10px] font-black">TV</div>
                )}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase truncate w-full text-center group-hover:text-white transition-colors">{ch.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
