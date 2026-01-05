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

  // SVG Icons Components
  const Icons = {
    Tv: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    Fire: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
    Trophy: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172V9.406c0-4.135-3.375-5.283-7.5-5.283-4.125 0-7.5 1.148-7.5 5.283v3.047c0 1.118-.342 2.164-.982 3.172" />
      </svg>
    ),
    Bolt: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    PlayCircle: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
      </svg>
    ),
    FaceSmile: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm6 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" />
      </svg>
    ),
    Moon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    ),
    ShieldCheck: () => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    Heart: () => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    ),
    Alert: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500/50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
    ),
    Scale: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499.106 1.028.589 1.202a5.989 5.989 0 0 0 2.031.352 5.989 5.989 0 0 0 2.031-.352c.483-.174.711-.703.59-1.202L5.25 4.971Z" />
        </svg>
    ),
    Book: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
    )
  };

  const playlists = [
    {
      id: 1,
      title: `Today's Hot Matches`,
      sub: currentDate,
      desc: "আজকের সমস্ত হাই-ভোল্টেজ ফুটবল এবং ক্রিকেট ম্যাচ।",
      icon: <Icons.Fire />,
      link: "/tdmatch", 
      color: "from-orange-600 to-red-600",
      badge: "Live"
    },
    {
      id: 2,
      title: "Sports Server 1",
      sub: "Daily Update",
      desc: "সনি নেটওয়ার্ক, টি-স্পোর্টস এবং পিটিভি স্পোর্টস।",
      icon: <Icons.Trophy />,
      link: "/livesports",
      color: "from-blue-600 to-indigo-600",
      badge: "HD"
    },
    {
      id: 3,
      title: "Sports Server 2",
      sub: "Backup Stream",
      desc: "স্টার স্পোর্টস সিলেক্ট এবং টেন স্পোর্টস নেটওয়ার্ক।",
      icon: <Icons.Bolt />,
      link: "/livesports2",
      color: "from-cyan-600 to-teal-600",
      badge: "Fast"
    },
    {
      id: 4,
      title: "Bangladeshi TV",
      sub: "News & Entertainment",
      desc: "বাংলাদেশের সব খবর, নাটক এবং বিনোদনমূলক চ্যানেল।",
      icon: <Icons.Tv />,
      link: "/livetv",
      color: "from-emerald-600 to-green-600",
      badge: "24/7"
    },
    {
      id: 5,
      title: "Kids Zone",
      sub: "Cartoons",
      desc: "নিক, সনি ইয়ে এবং কার্টুন নেটওয়ার্ক।",
      icon: <Icons.FaceSmile />,
      link: "/kidstv",
      color: "from-pink-500 to-rose-500",
      badge: "Fun"
    },
    {
      id: 6,
      title: "Arabic & Islamic",
      sub: "Middle East",
      desc: "মক্কা লাইভ, মদিনা লাইভ এবং বেইন স্পোর্টস।",
      icon: <Icons.Moon />,
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
          <div className="flex items-center gap-2 text-cyan-400">
            <Icons.Tv />
            <span className="font-extrabold text-xl tracking-tight text-white">
              Toffee<span className="text-cyan-400">Pro</span>
            </span>
          </div>
          <Link href="/support">
            <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs md:text-sm font-bold py-2 px-4 rounded-full shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105">
              <Icons.Heart />
              Support / Remove Ads
            </button>
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Live Streaming Now
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
            বিনোদনের সেরা ঠিকানা <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              Toffee Pro Live
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            কোনো সাবস্ক্রিপশন ছাড়াই উপভোগ করুন বাফারিং-মুক্ত লাইভ খেলা, খবর এবং বিনোদন।
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-16">

        {/* --- ⚠️ IMPORTANT WARNING (GAMBLING) --- */}
        <section className="bg-red-950/20 border border-red-500/40 rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-20 rotate-12">
                <Icons.Alert />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-red-500/20 text-red-500 p-2 rounded-lg border border-red-500/30">
                        <Icons.ShieldCheck />
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-red-100">জুয়া ও বেটিং থেকে দূরে থাকুন</h2>
                </div>
                <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed">
                    <p>
                        লাইভ খেলা দেখার সময় বিভিন্ন স্ট্রিম সোর্সে অনাকাঙ্ক্ষিতভাবে <strong>বেটিং (Betting), জুয়া বা প্রেডিকশন অ্যাপের বিজ্ঞাপন</strong> আসতে পারে। 
                        <span className="text-red-400 font-bold"> আমাদের সাইট কোনোভাবেই এসব জুয়ার অ্যাপ বা সাইটকে প্রমোট করে না।</span>
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-black/40 p-4 rounded-xl border-l-4 border-red-500 flex items-start gap-3">
                            <Icons.Book />
                            <div>
                                <strong className="block text-red-400 mb-1 text-sm">ধর্মীয় সতর্কতা:</strong>
                                <span className="text-xs text-gray-400">ইসলাম ধর্মে জুয়া খেলা বা এর প্রচার করা সম্পূর্ণ <strong>হারাম</strong>। এটি মানুষের ঈমান ও সম্পদ ধ্বংস করে।</span>
                            </div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border-l-4 border-orange-500 flex items-start gap-3">
                            <Icons.Scale />
                            <div>
                                <strong className="block text-orange-400 mb-1 text-sm">আইনি সতর্কতা:</strong>
                                <span className="text-xs text-gray-400">বাংলাদেশের প্রচলিত আইন অনুযায়ী জুয়া বা অনলাইনে বাজি ধরা <strong>দণ্ডনীয় অপরাধ</strong>।</span>
                            </div>
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
                                <div className="text-white bg-white/5 w-14 h-14 flex items-center justify-center rounded-2xl backdrop-blur-sm shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
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
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950 to-blue-950 border border-indigo-500/30 text-center md:text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]"></div>
            
            <div className="grid md:grid-cols-3 items-center relative z-10 p-8 md:p-12 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        বিরক্তিকর বিজ্ঞাপন <br/>
                        <span className="text-cyan-300">বন্ধ করতে চান?</span>
                    </h2>
                    <p className="text-indigo-200 text-sm md:text-base leading-relaxed max-w-xl">
                        আমরা জানি বিজ্ঞাপন আপনার দেখার অভিজ্ঞতা নষ্ট করে। কিন্তু হাই-স্পিড সার্ভার সচল রাখতে আমাদের অর্থের প্রয়োজন হয়। 
                        আপনি যদি আমাদের সাপোর্ট করেন, আমরা আপনার জন্য একটি <strong>প্রিমিয়াম এবং ক্লিন</strong> ইন্টারফেস বজায় রাখতে পারবো।
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Link href="/support">
                            <button className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-blue-900 font-bold py-3 px-8 rounded-xl hover:bg-cyan-50 transition shadow-xl">
                                <Icons.Heart /> Donate Now
                            </button>
                        </Link>
                        <Link href="/contact">
                            <button className="w-full sm:w-auto bg-blue-800/30 text-white border border-blue-400/30 font-medium py-3 px-8 rounded-xl hover:bg-blue-800/50 transition">
                                Contact Us
                            </button>
                        </Link>
                    </div>
                </div>
                {/* Visual Icon Area */}
                <div className="hidden md:flex justify-center items-center">
                    <div className="p-8 bg-white/5 rounded-full ring-1 ring-white/10 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 text-cyan-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                        </svg>
                    </div>
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
                            className="w-full text-left p-5 flex justify-between items-center text-gray-200 font-medium hover:bg-gray-800/50 transition"
                        >
                            {faq.q}
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${openFaqIndex === index ? "rotate-45" : ""}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
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
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-4">Disclaimer & Copyright</h3>
            <p className="text-[11px] text-gray-600 max-w-3xl mx-auto leading-relaxed text-justify md:text-center px-4">
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
