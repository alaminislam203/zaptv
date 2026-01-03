"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function GuidePage() {
  const [currentDate, setCurrentDate] = useState("");
  // FAQ টগল করার জন্য স্টেট
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
      title: `Today's Matches (${currentDate})`,
      desc: "আজকের সমস্ত ফুটবল এবং ক্রিকেট ম্যাচের লাইভ চ্যানেল।",
      icon: "⚽",
      link: "/tdmatch", 
      color: "from-orange-500 to-red-600"
    },
    {
      id: 2,
      title: "Sports Channels (Server 1)",
      desc: "সনি, স্টার স্পোর্টস, এবং টি-স্পোর্টস এর সব চ্যানেল।",
      icon: "🏆",
      link: "/livesports",
      color: "from-blue-500 to-cyan-500"
    },{
      id: 2,
      title: "Sports Channels (Server 2)",
      desc: "সনি, স্টার স্পোর্টস, এবং টি-স্পোর্টস এর সব চ্যানেল।",
      icon: "🏆",
      link: "/livesports2",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 3,
      title: "Bangladeshi Channels",
      desc: "বাংলাদেশের সব খবর এবং বিনোদনমূলক চ্যানেল।",
      icon: "🇧🇩",
      link: "/livetv",
      color: "from-green-600 to-teal-600"
    },
    {
      id: 4,
      title: "Kids & Cartoons",
      desc: "নিক, সনি ইয়ে এবং কার্টুন নেটওয়ার্ক।",
      icon: "🧸",
      link: "/kidstv",
      color: "from-pink-500 to-rose-500"
    }
  ];

  // নতুন FAQ ডেটা
  const faqs = [
    {
      q: "এই সাইটটি কি সম্পূর্ণ ফ্রি?",
      a: "হ্যাঁ, ToffeePro সম্পূর্ণ ফ্রি। আপনাকে কোনো সাবস্ক্রিপশন বা টাকা দিতে হবে না।"
    },
    {
      q: "ভিডিও বাফারিং করছে, কি করবো?",
      a: "প্রথমে আপনার ইন্টারনেট স্পিড চেক করুন। যদি ইন্টারনেট ঠিক থাকে, তবে প্লেয়ারের নিচে থাকা বাটন থেকে সার্ভার (Engine) পরিবর্তন করে দেখুন।"
    },
    {
      q: "কোন অ্যাপ আছে কি?",
      a: "বর্তমানে আমাদের কোনো অফিসিয়াল অ্যাপ নেই। তবে আপনি ক্রোম ব্রাউজারের মেনু থেকে 'Add to Home Screen' করে এটিকে অ্যাপের মতো ব্যবহার করতে পারেন।"
    },
    {
      q: "আমার পছন্দের চ্যানেল নেই, কি করবো?",
      a: "আমাদের টেলিগ্রাম গ্রুপে জয়েন করে চ্যানেলের নাম রিকোয়েস্ট করুন। আমরা দ্রুত সেটি অ্যাড করার চেষ্টা করবো।"
    }
  ];

  return (
    <main className="min-h-screen bg-[#0b1120] text-gray-200 font-sans selection:bg-cyan-500/30 pb-10">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="https://toffeetvlive.vercel.app/livesports" className="flex items-center gap-2 group">
            <span className="text-xl">⬅️</span>
            <span className="font-bold text-gray-300 group-hover:text-cyan-400 transition">Back to Live TV</span>
          </Link>
          <div className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">
            Guide & Info
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">

        {/* --- 1. ABOUT US --- */}
        <section className="text-center space-y-4 animate-fadeIn">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                স্বাগতম <span className="text-cyan-400">ToffeePro</span>-তে
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                আমরা একটি ফ্রি এবং ওপেন-সোর্স স্ট্রিমিং প্ল্যাটফর্ম। আমাদের লক্ষ্য হলো বাফারিং ছাড়া হাই-কোয়ালিটি লাইভ টিভি চ্যানেল সবার কাছে পৌঁছে দেওয়া।
            </p>
        </section>

        {/* --- 2. HOW TO WATCH --- */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-cyan-500/10 text-cyan-400 p-2 rounded-lg text-xl">📺</span>
                <h2 className="text-2xl font-bold text-white">কিভাবে চ্যানেল চালাবেন?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition">
                    <h3 className="text-xl font-bold text-green-400 mb-4">📱 মোবাইলে</h3>
                    <ul className="space-y-3 text-sm text-gray-300 list-disc pl-4">
                        <li>সেরা অভিজ্ঞতার জন্য <strong>Google Chrome</strong> ব্যবহার করুন।</li>
                        <li>ফুল স্ক্রিন করতে ভিডিওর ওপর ডাবল ট্যাপ করুন।</li>
                        <li>সমস্যা হলে <strong>Engine</strong> বাটন পাল্টে দেখুন।</li>
                    </ul>
                </div>
                <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition">
                    <h3 className="text-xl font-bold text-blue-400 mb-4">💻 পিসিতে</h3>
                    <ul className="space-y-3 text-sm text-gray-300 list-disc pl-4">
                        <li>যেকোনো মডার্ন ব্রাউজার (Chrome/Edge) ব্যবহার করুন।</li>
                        <li><strong>Adblock</strong> থাকলে সেটি পজ করে রাখুন।</li>
                        <li>ইন্টারনেট কানেকশন স্টেবল রাখুন।</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* --- 3. TROUBLESHOOTING (NEW SECTION) --- */}
        <section className="bg-orange-900/10 border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-orange-400 text-xl">🛠️</span>
                <h2 className="text-xl font-bold text-orange-200">ভিডিও চলছে না? সমাধান দেখুন</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
                <div className="bg-black/20 p-3 rounded">
                    <strong className="text-white block mb-1">১. ক্যাশ ক্লিয়ার করুন</strong>
                    ব্রাউজারের হিস্ট্রি এবং ক্যাশ ডিলিট করে রিফ্রেশ দিন।
                </div>
                <div className="bg-black/20 p-3 rounded">
                    <strong className="text-white block mb-1">২. DNS চেঞ্জ করুন</strong>
                    সম্ভব হলে Google DNS (8.8.8.8) ব্যবহার করুন।
                </div>
                <div className="bg-black/20 p-3 rounded">
                    <strong className="text-white block mb-1">৩. ভিপিএন (VPN)</strong>
                    বাংলাদেশি চ্যানেল বাদে অন্য চ্যানেলের জন্য VPN ব্যবহার করে দেখতে পারেন।
                </div>
            </div>
        </section>

        {/* --- 4. PLAYLISTS LIST --- */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-purple-500/10 text-purple-400 p-2 rounded-lg text-xl">📑</span>
                <h2 className="text-2xl font-bold text-white">জনপ্রিয় প্লেলিস্ট</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playlists.map((item) => (
                    <Link href={item.link} key={item.id} className="group relative overflow-hidden rounded-xl bg-[#1e293b] border border-gray-700 hover:border-gray-500 transition-all hover:-translate-y-1">
                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color}`}></div>
                        <div className="p-4 flex items-center gap-4">
                            <div className="text-2xl bg-black/30 w-10 h-10 flex items-center justify-center rounded-full">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-100 group-hover:text-cyan-400 transition">{item.title}</h3>
                                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>

        {/* --- 5. FAQ SECTION (NEW SECTION) --- */}
        <section>
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-teal-500/10 text-teal-400 p-2 rounded-lg text-xl">❓</span>
                <h2 className="text-2xl font-bold text-white">সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)</h2>
            </div>
            <div className="space-y-3">
                {faqs.map((faq, index) => (
                    <div key={index} className="bg-[#1e293b] border border-gray-700 rounded-lg overflow-hidden">
                        <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full text-left p-4 flex justify-between items-center text-gray-200 font-medium hover:bg-gray-800 transition"
                        >
                            {faq.q}
                            <span className="text-cyan-400 text-xl">{openFaqIndex === index ? "−" : "+"}</span>
                        </button>
                        {openFaqIndex === index && (
                            <div className="p-4 pt-0 text-sm text-gray-400 border-t border-gray-700/50 bg-black/10">
                                {faq.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>

        {/* --- 6. COMMUNITY & CONTACT --- */}
        <section className="grid md:grid-cols-2 gap-6">
             {/* Telegram */}
             <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-2xl p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">চ্যানেল রিকোয়েস্ট</h2>
                <p className="text-gray-300 text-xs mb-4">
                    নতুন চ্যানেল বা মুভি রিকোয়েস্ট করতে আমাদের টেলিগ্রামে জয়েন করুন।
                </p>
                <Link href="https://t.me/toffeepro" target="_blank">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-6 rounded-full transition">
                        Join Telegram 🚀
                    </button>
                </Link>
            </div>

            {/* Contact / DMCA */}
            <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">যোগাযোগ / DMCA</h2>
                <p className="text-gray-300 text-xs mb-4">
                    কপিরাইট ইস্যু বা ব্যবসায়িক প্রয়োজনে আমাদের ইমেইল করুন।
                </p>
                <a href="mailto:support@toffeepro.com" className="text-cyan-400 font-mono text-sm hover:underline">
                    support@toffeepro.com
                </a>
            </div>
        </section>

        {/* --- 7. LEGAL DISCLAIMER --- */}
        <section className="border-t border-gray-800 pt-8 mt-4">
             <h2 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Legal Disclaimer</h2>
            <p className="text-[10px] text-gray-500 leading-relaxed text-justify">
                <strong>ToffeeLiveToday</strong> does not host any files on its servers. All content is provided by non-affiliated third parties. We do not accept responsibility for content hosted on third-party websites and do not have any involvement in the downloading/uploading of movies. We only post links available on the internet. If you think any content infringes your copyright, please contact the respective hosting platforms or email us to remove the link.
            </p>
        </section>

        <footer className="text-center text-gray-600 text-xs py-6">
            &copy; 2026 ToffeePro Streaming. All rights reserved.
        </footer>

      </div>
    </main>
  );
}
