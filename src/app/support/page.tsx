"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { Heart, Wallet, Copy, Check, MessageCircle, Mail, Gift, ExternalLink } from "lucide-react";

export default function SupportPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const storedClicks = localStorage.getItem("userSupportClicks");
    if (storedClicks) setClickCount(parseInt(storedClicks));
  }, []);

  const handleAdClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    localStorage.setItem("userSupportClicks", newCount.toString());
    window.open("https://www.profitablecpmrate.com/v1h0s768?key=414d0f666f81e289f8166c0853488277", "_blank");
  };

  const paymentMethods = [
    { id: "bkash", name: "bKash", type: "Personal", number: "017XXXXXXXX", color: "text-pink-500", bg: "bg-pink-500/10" },
    { id: "nagad", name: "Nagad", type: "Personal", number: "018XXXXXXXX", color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "binance", name: "Binance", type: "Pay ID", number: "876543210", color: "text-yellow-400", bg: "bg-yellow-500/10" }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">

        {/* Hero Section */}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="inline-flex p-5 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Heart className="w-8 h-8 text-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
            Support <span className="text-gradient">ToffeePro</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base font-medium leading-relaxed">
            Help us keep the servers running and the streams free. Every contribution, whether it&apos;s a donation or just clicking an ad, keeps us alive.
          </p>
        </section>

        {/* Free Support Zone */}
        <section className="glass p-12 rounded-[3.5rem] border-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 text-emerald-500">
                <Gift className="w-6 h-6" />
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">Free Support</h2>
              </div>
              <p className="text-slate-400 text-sm max-w-md font-medium">
                Don&apos;t have funds? You can still help by visiting our sponsor link. It directly supports our server costs.
              </p>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Global Support:</span>
                <strong className="text-white text-xs font-black">{clickCount} Contributions</strong>
              </div>
            </div>

            <button
              onClick={handleAdClick}
              className="w-full md:w-auto px-10 py-6 bg-emerald-500 text-white font-black rounded-3xl shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
            >
              Click to Support <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Donation Methods */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Direct Methods</h3>
            <p className="text-xl font-black text-white italic uppercase tracking-tighter">Choose Your Way</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <div key={method.id} className="glass p-8 rounded-[2.5rem] border-white/5 group hover:border-emerald-500/30 transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 rounded-2xl ${method.bg} ${method.color}`}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-3 py-1 rounded-lg">
                    {method.type}
                  </span>
                </div>
                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">{method.name}</h4>
                <div
                  onClick={() => handleCopy(method.number, method.id)}
                  className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-all active:scale-95"
                >
                  <span className="font-mono text-sm font-bold text-slate-300">{method.number}</span>
                  {copied === method.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-600 group-hover:text-emerald-500" />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Links */}
        <section className="grid md:grid-cols-2 gap-6 pb-20">
          <Link href="https://t.me/toffeepro" target="_blank" className="glass p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-blue-500/30 transition-all duration-500">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-3xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Telegram Hub</h4>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Join our community</p>
            </div>
          </Link>

          <a href="mailto:support@toffeepro.com" className="glass p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-emerald-500/30 transition-all duration-500">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Email Support</h4>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Report any issues</p>
            </div>
          </a>
        </section>

      </main>

      <Footer />
    </div>
  );
}
