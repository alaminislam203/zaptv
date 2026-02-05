"use client";
import React, { useState, useEffect } from "react";
import { X, Shield, Zap, Info, EyeOff } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [bandwidthSaver, setBandwidthSaver] = useState(false);
  const [parentalLock, setParentalLock] = useState(false);

  useEffect(() => {
    setBandwidthSaver(localStorage.getItem("bandwidth_saver") === "true");
    setParentalLock(localStorage.getItem("parental_lock") === "true");
  }, [isOpen]);

  const toggleBandwidth = () => {
    const newVal = !bandwidthSaver;
    setBandwidthSaver(newVal);
    localStorage.setItem("bandwidth_saver", newVal.toString());
  };

  const toggleParental = () => {
    const newVal = !parentalLock;
    setParentalLock(newVal);
    localStorage.setItem("parental_lock", newVal.toString());
    if (newVal) {
        const pin = prompt("Set a 4-digit Parental PIN:");
        if (pin) localStorage.setItem("parental_pin", pin);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg glass p-10 rounded-[3rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Preferences</h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">Bandwidth Saver</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-black mt-1">Force lower resolution to save data</p>
                    </div>
                </div>
                <button
                    onClick={toggleBandwidth}
                    className={`w-12 h-6 rounded-full relative transition-all ${bandwidthSaver ? 'bg-emerald-500' : 'bg-slate-800'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${bandwidthSaver ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">Parental Control</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-black mt-1">Lock adult content with a PIN</p>
                    </div>
                </div>
                <button
                    onClick={toggleParental}
                    className={`w-12 h-6 rounded-full relative transition-all ${parentalLock ? 'bg-red-500' : 'bg-slate-800'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${parentalLock ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>
        </div>

        <div className="mt-10 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-start gap-4">
            <Info className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-bold tracking-wide">
                These settings are saved locally to your device and sync across sessions. Bandwidth saver works best on mobile networks.
            </p>
        </div>
      </div>
    </div>
  );
}
