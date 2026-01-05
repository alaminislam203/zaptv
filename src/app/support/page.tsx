"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

// --- SVG ICONS ---
const Icons = {
  Heart: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Telegram: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Mail: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Back: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Gift: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
  External: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
};

export default function SupportPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);

  // Load Click Count from LocalStorage
  useEffect(() => {
    const storedClicks = localStorage.getItem("userSupportClicks");
    if (storedClicks) {
      setClickCount(parseInt(storedClicks));
    }
  }, []);

  // --- AD LINK HANDLER ---
  const handleAdClick = () => {
    // 1. কাউন্টার আপডেট
    const newCount = clickCount + 1;
    setClickCount(newCount);
    localStorage.setItem("userSupportClicks", newCount.toString());

    // 2. আপনার ডিরেক্ট লিংক (Adsterra/Monetag Link এখানে বসাবেন)
    const AD_LINK = "https://www.google.com"; // <-- আপনার আসল ডিরেক্ট লিংক দিন
    
    // 3. নতুন ট্যাবে ওপেন
    window.open(AD_LINK, "_blank");
  };

  const paymentMethods = [
    {
      id: "bkash",
      name: "bKash",
      type: "Personal",
      number: "01xxxxxxxxx", 
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      id: "nagad",
      name: "Nagad",
      type: "Personal",
      number: "01xxxxxxxxx", 
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      id: "binance",
      name: "Binance Pay",
      type: "ID / USDT",
      number: "123456789", 
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-indigo-500/30">
      
      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-zinc-400 hover:text-white transition">
            <Icons.Back />
            <span className="font-bold text-sm">Back to Home</span>
          </Link>
          <div className="font-black text-xl tracking-tight text-white">
            Zap<span className="text-indigo-500">TV</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* --- HERO --- */}
        <section className="text-center space-y-6">
          <div className="inline-block p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 animate-pulse">
            <div className="text-indigo-400"><Icons.Heart /></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">
            Support <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Our Mission</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Zap TV সম্পূর্ণ ফ্রি। সার্ভার খরচ চালাতে আমাদের আপনার সাহায্যের প্রয়োজন। 
            আপনি ডোনেট করতে না পারলে সমস্যা নেই, নিচের বাটনে ক্লিক করে অ্যাড দেখেও আমাদের সাপোর্ট করতে পারেন।
          </p>
        </section>

        {/* --- 🔥 FREE SUPPORT ZONE (NEW FEATURE) --- */}
        <section className="bg-gradient-to-r from-yellow-900/10 via-amber-900/10 to-yellow-900/10 border border-yellow-500/30 rounded-3xl p-8 relative overflow-hidden text-center md:text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="space-y-3">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-yellow-400">
                        <Icons.Gift />
                        <h2 className="text-2xl font-bold text-white">ফ্রি-তে সাপোর্ট করুন</h2>
                    </div>
                    <p className="text-zinc-400 text-sm max-w-md">
                        আপনার কাছে ডোনেট করার মতো টাকা নেই? কোনো সমস্যা নেই! নিচের বাটনে ক্লিক করুন। এটি আমাদের সার্ভার খরচ চালাতে সাহায্য করবে।
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-yellow-500/80 bg-yellow-500/5 px-3 py-1 rounded-full w-fit mx-auto md:mx-0 border border-yellow-500/10">
                        <span>🎉 You helped us: </span>
                        <strong className="text-yellow-400">{clickCount} times</strong>
                    </div>
                </div>

                <button 
                    onClick={handleAdClick}
                    className="group relative px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-xl font-bold text-white shadow-lg shadow-amber-900/30 hover:shadow-amber-500/20 hover:scale-105 transition-all duration-300 w-full md:w-auto"
                >
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out overflow-hidden rounded-xl"></div>
                    <span className="flex items-center justify-center gap-2 relative">
                        Click to Support (Free) <Icons.External />
                    </span>
                </button>
            </div>
        </section>

        {/* --- DONATION CARDS --- */}
        <section>
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6 text-center md:text-left">Direct Donation Methods</h3>
            <div className="grid md:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
                <div key={method.id} className={`group relative bg-[#18181b] border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-24 h-24 ${method.bg} blur-3xl rounded-full opacity-0 group-hover:opacity-50 transition`}></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${method.bg} ${method.color}`}>
                        <Icons.Wallet />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                        {method.type}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{method.name}</h3>
                    <p className="text-zinc-500 text-xs mb-6">Tap number to copy</p>
                    </div>
                    <div 
                    onClick={() => handleCopy(method.number, method.id)}
                    className={`cursor-pointer bg-black/50 border border-zinc-700 rounded-xl p-3 flex items-center justify-between group-hover:border-zinc-500 transition active:scale-95`}
                    >
                    <span className="font-mono text-sm md:text-lg font-bold text-zinc-300 tracking-wider">
                        {method.number}
                    </span>
                    <span className={`${copied === method.id ? "text-green-500" : "text-zinc-500 group-hover:text-white"}`}>
                        {copied === method.id ? <Icons.Check /> : <Icons.Copy />}
                    </span>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </section>

        {/* --- CONTACT BUTTONS --- */}
        <section className="grid md:grid-cols-2 gap-4">
            <Link href="https://t.me/zaptv_official" target="_blank" className="bg-[#18181b] p-5 rounded-2xl border border-zinc-800 flex items-center gap-4 hover:border-blue-500/50 transition group">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full group-hover:bg-blue-500 group-hover:text-white transition">
                    <Icons.Telegram />
                </div>
                <div>
                    <h4 className="text-white font-bold">Join Telegram</h4>
                    <p className="text-xs text-zinc-500">Request channels & updates</p>
                </div>
                <span className="ml-auto text-zinc-600 group-hover:text-white transition">➔</span>
            </Link>

            <a href="mailto:support@zaptv.com" className="bg-[#18181b] p-5 rounded-2xl border border-zinc-800 flex items-center gap-4 hover:border-green-500/50 transition group">
                <div className="p-3 bg-green-500/10 text-green-400 rounded-full group-hover:bg-green-500 group-hover:text-white transition">
                    <Icons.Mail />
                </div>
                <div>
                    <h4 className="text-white font-bold">Email Support</h4>
                    <p className="text-xs text-zinc-500">Report bugs or issues</p>
                </div>
                <span className="ml-auto text-zinc-600 group-hover:text-white transition">➔</span>
            </a>
        </section>

        <footer className="text-center border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-xs">
            &copy; {new Date().getFullYear()} Zap TV. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  );
}
