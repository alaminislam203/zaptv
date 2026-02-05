"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import SettingsModal from "./SettingsModal";
import { Play, Menu, Search, User, X, Home, Tv, Trophy, Baby, Info, Sun, Moon, LogIn, LogOut, Globe, Settings2 } from "lucide-react";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, login, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { href: "/livetv", label: "Live TV", icon: <Tv className="w-4 h-4" /> },
    { href: "/livesports", label: "Sports", icon: <Trophy className="w-4 h-4" /> },
    { href: "/kidstv", label: "Kids", icon: <Baby className="w-4 h-4" /> },
    { href: "/support", label: "Support", icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-[100] bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">
                    Toffee<span className="text-emerald-500 underline decoration-teal-500/50 decoration-4 underline-offset-4">Pro</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Streaming Hub</span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center ml-10 gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-black text-slate-400 hover:text-emerald-400 transition-all uppercase tracking-widest"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => setLanguage(language === "en" ? "bn" : "en")}
                className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Globe className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
              </button>

              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all"
              >
                <Settings2 className="w-5 h-5" />
              </button>

              <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>
              {user ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => logout()}
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 transition-all uppercase tracking-widest"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                  <Link href="/admin" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-[10px] font-black text-slate-300 transition-all uppercase tracking-widest">
                    <User className="w-4 h-4 text-emerald-500" />
                    Admin
                  </Link>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/20">
                    <img src={user.photoURL || "https://ui-avatars.com/api/?name=" + user.displayName} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => login()}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300"></div>
          <nav className="relative h-full flex flex-col p-8 pt-24 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/5 text-xl font-black text-white italic uppercase tracking-tight hover:bg-emerald-500 hover:text-white transition-all group"
              >
                <div className="text-emerald-500 group-hover:text-white transition-colors">{link.icon}</div>
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="mt-auto space-y-4">
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-6 p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-xl font-black text-emerald-500 italic uppercase tracking-tight"
                >
                  <User className="w-6 h-6" />
                  Admin Portal
                </Link>
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-6 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-xl font-black text-red-500 italic uppercase tracking-tight"
                >
                  <LogOut className="w-6 h-6" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { login(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-6 p-6 rounded-3xl bg-emerald-500 text-white text-xl font-black italic uppercase tracking-tight mt-auto"
              >
                <LogIn className="w-6 h-6" />
                Login Now
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsSearchOpen(false)}
          ></div>
          <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-300">
            <div className="glass p-8 rounded-[3rem] border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-white uppercase italic tracking-[0.2em]">Global Search</h3>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
                <input
                  type="text"
                  placeholder="Search channels, sports, or movies..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-white/5 rounded-3xl py-6 pl-16 pr-8 text-lg font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <p className="mt-6 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">
                Press Esc to close
              </p>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
