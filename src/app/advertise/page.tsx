"use client";
import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { Megaphone, TrendingUp, Users, Target, CheckCircle2, Mail, ExternalLink } from "lucide-react";

export default function AdvertisePage() {
  const stats = [
    { label: "Daily Visitors", value: "50K+", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Monthly Impressions", value: "2M+", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Target Audience", value: "Bangladesh", icon: Target, color: "text-red-500", bg: "bg-red-500/10" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        
        {/* Hero Section */}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="inline-flex p-5 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Megaphone className="w-8 h-8 text-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
            Scale Your <span className="text-gradient">Business</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base font-medium leading-relaxed">
            Reach thousands of active sports fans and viewers in Bangladesh. We offer premium ad slots that guarantee high visibility and engagement.
          </p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center text-center group hover:border-emerald-500/30 transition-all duration-500">
              <div className={`p-4 rounded-3xl ${stat.bg} ${stat.color} mb-6`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <p className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">{stat.value}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Ad Slots Section */}
        <section className="glass p-12 rounded-[3.5rem] border-white/5 space-y-12">
          <div className="text-center space-y-2">
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Available Spaces</h3>
            <p className="text-2xl font-black text-white italic uppercase tracking-tighter">Premium Ad Inventory</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <AdSlotCard
              title="Popunder Ads"
              desc="High conversion ads that appear when users interact with the player."
              benefit="100% Viewability"
            />
            <AdSlotCard
              title="Banner Placements"
              desc="Fixed banners on top and bottom of the video player for constant exposure."
              benefit="High Brand Recall"
            />
            <AdSlotCard
              title="In-Stream Pre-roll"
              desc="Video ads that play before the stream starts. Maximum engagement."
              benefit="Active Listeners"
            />
            <AdSlotCard
              title="Category Sponsorship"
              desc="Own a specific category like 'Live Sports' or 'Kids TV'."
              benefit="Niche Targeting"
            />
          </div>
        </section>

        {/* Contact CTA */}
        <section className="text-center pb-20 space-y-10">
          <div className="glass p-12 rounded-[3.5rem] border-emerald-500/20 max-w-3xl mx-auto">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-4">Ready to Advertise?</h3>
            <p className="text-slate-400 text-sm font-medium mb-10">Contact our sales team for pricing and custom placement strategies.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:ads@toffeepro.com" className="w-full sm:w-auto px-10 py-5 bg-emerald-500 text-white font-black rounded-3xl shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all">
                <Mail className="w-4 h-4" /> Email Sales
              </a>
              <a href="https://t.me/toffeepro_ads" target="_blank" className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-3xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
                Telegram <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

function AdSlotCard({ title, desc, benefit }: any) {
  return (
    <div className="flex gap-6 p-6 rounded-[2rem] bg-slate-900/50 border border-white/5 group hover:border-emerald-500/20 transition-all">
      <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-black text-white italic uppercase tracking-tight mb-2">{title}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{desc}</p>
        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] px-2 py-1 bg-emerald-500/10 rounded-md">
          {benefit}
        </span>
      </div>
    </div>
  );
}
