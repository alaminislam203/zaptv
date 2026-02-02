"use client";
import React from "react";
import Link from "next/link";
import { Play, Facebook, Twitter, Instagram, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                Toffee<span className="text-emerald-500">Pro</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Experience the best live streaming for sports, news, and entertainment. High-quality streams, anywhere, anytime.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                <Send className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Categories</h4>
            <ul className="space-y-4">
              <li><Link href="/livesports" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">Live Sports</Link></li>
              <li><Link href="/livetv" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">TV Channels</Link></li>
              <li><Link href="/kidstv" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">Kids Content</Link></li>
              <li><Link href="/arabictv" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">Arabic TV</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/support" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">Help Center</Link></li>
              <li><Link href="/advertise" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">Advertise</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Newsletter</h4>
            <p className="text-sm text-slate-500 mb-4">Stay updated with the latest matches and events.</p>
            <div className="relative">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button className="absolute right-2 top-1.5 bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} ToffeePro Streaming. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
