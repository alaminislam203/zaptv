"use client";
import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../src/app/firebase";
import { X, Bell, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Notifications() {
  const [notification, setNotification] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data();
        if (config.pushNotification?.show && !closed) {
          setNotification(config.pushNotification);
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    });
    return () => unsub();
  }, [closed]);

  if (!visible || !notification) return null;

  return (
    <div className="fixed bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-96 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="glass p-6 rounded-[2rem] border-emerald-500/20 shadow-2xl shadow-emerald-500/10 relative overflow-hidden group">
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-full group-hover:opacity-5 transition-all duration-500"></div>

        <button
          onClick={() => { setVisible(false); setClosed(true); }}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 flex-shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-white uppercase italic tracking-tight mb-1">{notification.title}</h4>
            <p className="text-[10px] font-medium text-slate-400 leading-relaxed mb-4">{notification.message}</p>

            {notification.link && (
              <Link
                href={notification.link}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                Watch Now
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
