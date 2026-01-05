"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const playlists = [
    {
      id: 1,
      title: `Today's Hot Matches`,
      sub: currentDate,
      desc: "আজকের সমস্ত হাই-ভোল্টেজ ফুটবল এবং ক্রিকেট ম্যাচ।",
      icon: "🔥",
      link: "/tdmatch", 
      color: "from-orange-600 to-red-600",
      badge: "Live"
    },
    {
      id: 2,
      title: "Sports Server 1",
      sub: "Daily Update",
      desc: "সনি নেটওয়ার্ক, টি-স্পোর্টস এবং পিটিভি স্পোর্টস।",
      icon: "🏆",
      link: "/livesports",
      color: "from-blue-600 to-indigo-600",
      badge: "HD"
    },
    {
      id: 3,
      title: "Sports Server 2",
      sub: "Backup Stream",
      desc: "স্টার স্পোর্টস সিলেক্ট এবং টেন স্পোর্টস নেটওয়ার্ক।",
      icon: "⚡",
      link: "/livesports2",
      color: "from-cyan-600 to-teal-600",
      badge: "Fast"
    },
    {
      id: 4,
      title: "Bangladeshi TV",
      sub: "News & Entertainment",
      desc: "বাংলাদেশের সব খবর, নাটক এবং বিনোদনমূলক চ্যানেল।",
      icon: "🇧🇩",
      link: "/livetv",
      color: "from-emerald-600 to-green-600",
      badge: "24/7"
    },
    {
      id: 5,
      title: "Kids Zone",
      sub: "Cartoons",
      desc: "নিক, সনি ইয়ে এবং কার্টুন নেটওয়ার্ক।",
      icon: "🦄",
      link: "/kidstv",
      color: "from-pink-500 to-rose-500",
      badge: "Fun"
    },
    {
      id: 6,
      title: "Arabic & Islamic",
      sub: "Middle East",
      desc: "মক্কা লাইভ, মদিনা লাইভ এবং বেইন স্পোর্টস।",
      icon: "🕌",
      link: "/arabictv",
      color: "from-amber-500 to-orange-500",
      badge: "Live"
    }
  ];

  const faqs = [
    {
      q: "স্ট্রিম কি বাফারিং করছে?",
      a: "ইন্টারনেট কানেকশন চেক করুন। যদি সমস্যা থাকে, তবে প্লেয়ারের নিচে থাকা 'Server' বাটন পরিবর্তন করুন। আমরা অটো-বিটরেট টেকনোলজি ব্যবহার করি যা স্লো নেটেও ভালো চলে।"
    },
    {
      q: "এড ছাড়া কিভাবে দেখবো?",
      a: "এই সাইটটি চালাতে আমাদের সার্ভার খরচ হয়। তাই কিছু এড দেখানো হয়। আপনি যদি সম্পূর্ণ এড-ফ্রি অভিজ্ঞতা চান, তবে আমাদের 'Support Us' বাটনে ক্লিক করে সামান্য ডোনেট করতে পারেন।"
    },
    {
      q: "মোবাইলে ফুল স্ক্রিন হচ্ছে না কেন?",
      a: "ভিডিও প্লেয়ারের উপর ডাবল ট্যাপ করুন অথবা প্লেয়ারের কোণায় থাকা ফুল-স্ক্রিন আইকনে ক্লিক করুন। রোটেট মোড অন রাখুন।"
    }
  ];

  return (
    <main className="min-h-screen bg-[#050b14] text-gray-200 font-sans selection:bg-cyan-500/30">
      
      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-50 bg-[#050b14]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📺</span>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Toffee<span className="text-cyan-400">Pro</span>
            </span>
          </div>
          <Link href="/support">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs md:text-sm font-bold py-2 px-4 rounded-full shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105">
              ☕ Support / Remove Ads
            </button>
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-10 text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
            🔴 Live Streaming Now
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
            বিনোদনের সেরা ঠিকানা <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              Toffee Pro Live
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            কোনো সাবস্ক্রিপশন ছাড়াই উপভোগ করুন বাফারিং-মুক্ত লাইভ খেলা, খবর এবং বিনোদন। আপনার পছন্দের চ্যানেল, হাতের মুঠোয়।
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-16">

        {/* --- ⚠️ IMPORTANT WARNING (GAMBLING) --- */}
        <section className="bg-red-950/30 border border-red-500/50 rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-9xl">🚫</span>
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-red-500 text-white p-2 rounded-lg text-xl font-bold">সতর্কবার্তা</span>
                    <h2 className="text-xl md:text-2xl font-bold text-red-200">জুয়া ও বেটিং থেকে দূরে থাকুন</h2>
                </div>
                <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed">
                    <p>
                        লাইভ খেলা দেখার সময় বিভিন্ন স্ট্রিম সোর্সে অনাকাঙ্ক্ষিতভাবে <strong>বেটিং (Betting), জুয়া বা প্রেডিকশন অ্যাপের বিজ্ঞাপন</strong> আসতে পারে। 
                        <span className="text-red-400 font-bold"> আমাদের সাইট কোনোভাবেই এসব জুয়ার অ্যাপ বা সাইটকে প্রমোট করে না।</span>
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                        <div className="bg-black/20 p-4 rounded-lg border-l-4 border-red-500">
                            <strong className="block text-red-400 mb-1">ধর্মীয় সতর্কতা:</strong>
                            ইসলাম ধর্মে জুয়া খেলা বা এর প্রচার করা সম্পূর্ণ <strong>হারাম</strong>। এটি মানুষের ঈমান ও সম্পদ ধ্বংস করে।
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg border-l-4 border-orange-500">
                            <strong className="block text-orange-400 mb-1">আইনি সতর্কতা:</strong>
                            বাংলাদেশের প্রচলিত আইন অনুযায়ী জুয়া বা অনলাইনে বাজি ধরা <strong>দণ্ডনীয় অপরাধ</strong>।
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        *আমরা থার্ড পার্টি লিংক ব্যবহার করি, তাই এডের ওপর আমাদের পূর্ণ নিয়ন্ত্রণ নেই। দয়া করে এসব এডে ক্লিক করা থেকে বিরত থাকুন।
                    </p>
                </div>
            </div>
        </section>

        {/* --- PLAYLISTS GRID --- */}
        <section>
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">জনপ্রিয় ক্যাটাগরি</h2>
                    <p className="text-gray-400 text-sm">আপনার পছন্দের বিনোদন বেছে নিন</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {playlists.map((item) => (
                    <Link href={item.link} key={item.id} className="group relative overflow-hidden rounded-2xl bg-[#0f172a] border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:-translate-y-2 shadow-lg hover:shadow-cyan-500/10">
                        {/* Hover Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                        
                        <div className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-4xl bg-white/5 w-14 h-14 flex items-center justify-center rounded-2xl backdrop-blur-sm shadow-inner">
                                    {item.icon}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white border border-white/10 ${item.badge === 'Live' ? 'animate-pulse text-red-400 border-red-500/30' : ''}`}>
                                    {item.badge}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-xs font-medium text-cyan-200/70 mb-3 uppercase tracking-wide">
                                {item.sub}
                            </p>
                            <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                {item.desc}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>

        {/* --- SUPPORT / AD-FREE CTA --- */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 to-blue-900 border border-indigo-500/30 text-center md:text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]"></div>
            
            <div className="grid md:grid-cols-2 items-center relative z-10">
                <div className="p-8 md:p-12 space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        বিরক্তিকর বিজ্ঞাপন <br/>
                        <span className="text-cyan-300">বন্ধ করতে চান?</span>
                    </h2>
                    <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
                        আমরা জানি বিজ্ঞাপন আপনার দেখার অভিজ্ঞতা নষ্ট করে। কিন্তু হাই-স্পিড সার্ভার সচল রাখতে আমাদের অর্থের প্রয়োজন হয়। 
                        আপনি যদি আমাদের সাপোর্ট করেন, আমরা আপনার জন্য একটি <strong>প্রিমিয়াম এবং ক্লিন</strong> ইন্টারফেস বজায় রাখতে পারবো।
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Link href="/support">
                            <button className="w-full sm:w-auto bg-white text-blue-900 font-bold py-3 px-8 rounded-xl hover:bg-cyan-50 transition shadow-xl">
                                ❤️ Donate Now
                            </button>
                        </Link>
                        <Link href="/contact">
                            <button className="w-full sm:w-auto bg-blue-800/50 text-white border border-blue-400/30 font-medium py-3 px-8 rounded-xl hover:bg-blue-800 transition">
                                Contact Us
                            </button>
                        </Link>
                    </div>
                </div>
                {/* Decorative Illustration Area */}
                <div className="hidden md:flex justify-center items-center p-8 bg-black/10 h-full">
                    <div className="text-[10rem] drop-shadow-2xl filter saturate-150">🎁</div>
                </div>
            </div>
        </section>

        {/* --- FAQ SECTION --- */}
        <section className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-white mb-8">সচরাচর জিজ্ঞাসিত প্রশ্নাবলী</h2>
            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="bg-[#0f172a] border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-600">
                        <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full text-left p-5 flex justify-between items-center text-gray-200 font-medium"
                        >
                            {faq.q}
                            <span className={`text-cyan-400 text-2xl transition-transform duration-300 ${openFaqIndex === index ? "rotate-45" : ""}`}>
                                +
                            </span>
                        </button>
                        <div className={`px-5 text-sm text-gray-400 bg-black/20 transition-all duration-300 overflow-hidden ${openFaqIndex === index ? "max-h-40 py-4 opacity-100" : "max-h-0 py-0 opacity-0"}`}>
                            {faq.a}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* --- LEGAL DISCLAIMER --- */}
        <footer className="border-t border-gray-800 pt-10 text-center">
            <h3 className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-4">Disclaimer & Copyright</h3>
            <p className="text-[11px] text-gray-600 max-w-3xl mx-auto leading-relaxed text-justify md:text-center">
                <strong>ToffeePro</strong> does not host any files on its servers. We act as a search engine for content that is already available on the internet. All content is provided by non-affiliated third parties. We do not accept responsibility for content hosted on third-party websites. If you believe any content infringes your copyright, please contact the respective hosting platforms directly.
            </p>
            <div className="mt-8 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} ToffeePro Streaming. Built for Sports Lovers.
            </div>
        </footer>

      </div>
    </main>
  );
}
