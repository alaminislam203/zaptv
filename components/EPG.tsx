"use client";
import React from "react";
import { Clock } from "lucide-react";

interface EPGProps {
  channelName: string;
}

export default function EPG({ channelName }: EPGProps) {
  // Static placeholder programs for demonstration
  const programs = [
    { time: "09:00 AM", title: "Morning News Live", active: false },
    { time: "11:30 AM", title: "Morning Talk Show", active: false },
    { time: "01:00 PM", title: "Global Headlines", active: true },
    { time: "02:30 PM", title: "Documentary Special", active: false },
    { time: "04:00 PM", title: "Evening Sports Recap", active: false },
    { time: "06:00 PM", title: "Prime Time News", active: false },
  ];

  return (
    <div className="glass rounded-[2.5rem] p-8 border-white/5 h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          Schedule
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{channelName}</span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {programs.map((prog, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border transition-all ${
              prog.active
                ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20"
                : "bg-slate-950/50 border-white/5 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${prog.active ? "text-emerald-400" : "text-slate-500"}`}>
                {prog.time}
              </span>
              {prog.active && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                  <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">On Air</span>
                </span>
              )}
            </div>
            <h4 className={`text-xs font-bold uppercase tracking-wide truncate ${prog.active ? "text-white" : "text-slate-400"}`}>
              {prog.title}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
}
