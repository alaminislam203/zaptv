"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    home: "Home",
    livetv: "Live TV",
    livesports: "Sports",
    kidstv: "Kids",
    support: "Support",
    searchPlaceholder: "Search channels, sports, or movies...",
    featuredLive: "Featured Live",
    watchNow: "Watch Now",
    eventInfo: "Event Info",
    selectRegion: "Select Region",
    availableChannels: "Available Channels",
    liveEvents: "Live Events",
    onlineUsers: "Watching Live",
    report: "Report",
    favorite: "Favorite",
    cinemaMode: "Cinema Mode",
    login: "Login",
    logout: "Logout",
    welcome: "Welcome to ToffeePro",
  },
  bn: {
    home: "হোম",
    livetv: "লাইভ টিভি",
    livesports: "খেলাধুলা",
    kidstv: "বাচ্চাদের",
    support: "সাপোর্ট",
    searchPlaceholder: "চ্যানেল, খেলা বা মুভি খুঁজুন...",
    featuredLive: "ফিচার্ড লাইভ",
    watchNow: "এখন দেখুন",
    eventInfo: "তথ্য",
    selectRegion: "অঞ্চল নির্বাচন করুন",
    availableChannels: "উপলব্ধ চ্যানেল",
    liveEvents: "লাইভ ইভেন্ট",
    onlineUsers: "লাইভ দেখছেন",
    report: "রিপোর্ট",
    favorite: "ফেভারিট",
    cinemaMode: "সিনেমা মোড",
    login: "লগইন",
    logout: "লগআউট",
    welcome: "টফিপ্রো তে স্বাগতম",
  }
};

interface LanguageContextType {
  language: "en" | "bn";
  setLanguage: (lang: "en" | "bn") => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<"en" | "bn">("en");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_language") as "en" | "bn";
    if (saved) setLanguage(saved);
  }, []);

  const handleSetLanguage = (lang: "en" | "bn") => {
    setLanguage(lang);
    localStorage.setItem("preferred_language", lang);
  };

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
