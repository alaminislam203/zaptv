"use client";
import React from "react";
import Link from "next/link";
import { Play, Menu, Search, User } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                  Toffee<span className="text-emerald-500 underline decoration-teal-500/50 decoration-4 underline-offset-4">Pro</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Streaming Hub</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center ml-10 gap-8">
              <Link href="/livetv" className="text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-wider">Live TV</Link>
              <Link href="/livesports" className="text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-wider">Sports</Link>
              <Link href="/kidstv" className="text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-wider">Kids</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-slate-800 mx-2 hidden sm:block"></div>
            <Link href="/admin" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-black text-slate-300 transition-all uppercase tracking-widest">
              <User className="w-4 h-4 text-emerald-500" />
              Admin
            </Link>
            <button className="md:hidden p-2 text-slate-400">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
