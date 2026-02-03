"use client";
import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";

// --- ICONS (SVG) ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  Matches: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Channels: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Ads: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Notification: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Menu: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>,
};

export default function EnhancedAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data States
  const [channels, setChannels] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState({
    noticeText: "স্বাগতম! নিরবিচ্ছিন্নভাবে খেলা দেখুন।",
    maintenanceMode: false,
    liveTvPlaylistUrl: "https://sm-live-tv-auto-update-playlist.pages.dev/Combined_Live_TV.m3u",
    arabicTvPlaylistUrl: "https://raw.githubusercontent.com/byte-capsule/skytv/main/arabictv.m3u",
    bdPlaylistUrl: "https://raw.githubusercontent.com/byte-capsule/skytv/main/bd.m3u",
    kidsPlaylistUrl: "https://raw.githubusercontent.com/byte-capsule/skytv/main/kidstv.m3u",
    malaysiaPlaylistUrl: "https://raw.githubusercontent.com/byte-capsule/skytv/main/malaysia.m3u",
    fancodePlaylistUrl: "https://raw.githubusercontent.com/byte-capsule/skytv/main/fancode.m3u",
    pushNotification: {
      show: true,
      title: "Match Live Now!",
      message: "Watch India vs Pakistan live on ToffeePro.",
      link: "/livetv"
    },
    adConfig: {
      showPopAds: true,
      showBannerAds: true,
      popAdLink: "https://www.profitablecpmrate.com/v1h0s768?key=414d0f666f81e289f8166c0853488277",
      bannerAdTop: "",
      bannerAdBottom: "",
      popunderScript: "<script>(function(s){s.dataset.zone='10282293',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>"
    }
  });

  // Form States
  const [matchForm, setMatchForm] = useState({ team1: "", team2: "", status: "UPCOMING", channelName: "" });

  // --- ডাটা কানেকশন (Real-time) ---
  useEffect(() => {
    if (isAuthenticated) {
      const unsubMatches = onSnapshot(collection(db, "hotMatches"), (snap) => {
        setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubChannels = onSnapshot(collection(db, "channels"), (snap) => {
        setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubConfig = onSnapshot(doc(db, "settings", "config"), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSiteConfig(prev => ({ ...prev, ...data }));
        }
      });
      return () => { unsubMatches(); unsubChannels(); unsubConfig(); };
    }
  }, [isAuthenticated]);

  // --- ফাংশন লজিক (CRUD) ---
  const saveMatch = async () => {
    if (!matchForm.team1 || !matchForm.channelName) return alert("সব ফিল্ড পূরণ করুন!");
    setLoading(true);
    try {
      if (editingId) await updateDoc(doc(db, "hotMatches", editingId), matchForm);
      else await addDoc(collection(db, "hotMatches"), matchForm);
      setMatchForm({ team1: "", team2: "", status: "UPCOMING", channelName: "" });
      setEditingId(null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const deleteItem = async (col: string, id: string) => {
    if (confirm("আপনি কি নিশ্চিত?")) {
      await deleteDoc(doc(db, col, id));
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "config"), siteConfig);
      alert("সেটিংস সেভ হয়েছে!");
    } catch (e) {
      console.error(e);
      alert("এরর হয়েছে!");
    }
    setLoading(false);
  };

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex overflow-hidden">
      {/* Side Navigation */}
      <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-72'} bg-[#0a0a0c] border-r border-white/5 flex flex-col h-screen transition-all duration-300`}>
        <div className="p-8 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
              Toffee<span className="text-emerald-500">PRO</span>
            </h2>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <Icons.Menu />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={<Icons.Dashboard />}
            label="Dashboard"
            collapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "matches"}
            onClick={() => setActiveTab("matches")}
            icon={<Icons.Matches />}
            label="Live Matches"
            collapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "playlists"}
            onClick={() => setActiveTab("playlists")}
            icon={<Icons.Channels />}
            label="Playlists"
            collapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
            icon={<Icons.Notification />}
            label="Push Alerts"
            collapsed={isSidebarCollapsed}
          />
          <TabButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            icon={<Icons.Settings />}
            label="Site Config"
            collapsed={isSidebarCollapsed}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">
            {activeTab} <span className="text-emerald-500">Control</span>
          </h1>
          <button onClick={saveConfig} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
            {loading ? "Saving..." : "Push Changes"}
          </button>
        </header>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Matches" value={matches.length} color="emerald" />
            <StatCard title="Active Streams" value={matches.filter(m => m.status === 'LIVE').length} color="blue" />
            <StatCard title="System Status" value="Online" color="emerald" />
          </div>
        )}

        {/* Matches */}
        {activeTab === "matches" && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4 glass p-8 rounded-[2.5rem] border-white/5 h-fit">
              <h3 className="text-white font-black uppercase text-sm italic mb-6">Create Match</h3>
              <div className="space-y-4">
                <AdminInput label="Team 1 Name" value={matchForm.team1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatchForm({...matchForm, team1: e.target.value})} />
                <AdminInput label="Team 2 Name" value={matchForm.team2} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatchForm({...matchForm, team2: e.target.value})} />
                <AdminInput label="Stream URL / ID" value={matchForm.channelName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatchForm({...matchForm, channelName: e.target.value})} />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Status</label>
                   <select className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-bold text-xs" value={matchForm.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMatchForm({...matchForm, status: e.target.value})}>
                     <option value="LIVE">LIVE</option>
                     <option value="UPCOMING">UPCOMING</option>
                   </select>
                </div>
                <button onClick={saveMatch} className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-[0.2em]">Add Match</button>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map(m => (
                <div key={m.id} className="glass p-6 rounded-[2rem] border-white/5 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                  <div>
                    <h4 className="font-black text-white italic uppercase tracking-tighter">{m.team1} <span className="text-emerald-500">VS</span> {m.team2}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${m.status === 'LIVE' ? 'text-red-500' : 'text-slate-500'}`}>{m.status}</span>
                  </div>
                  <button onClick={() => deleteItem("hotMatches", m.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Icons.Trash /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playlists */}
        {activeTab === "playlists" && (
          <div className="max-w-4xl glass p-10 rounded-[3rem] border-white/5 space-y-8">
            <h3 className="text-white font-black uppercase text-sm italic">Remote M3U Sources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminInput label="Live TV M3U" value={siteConfig.liveTvPlaylistUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, liveTvPlaylistUrl: e.target.value})} />
              <AdminInput label="Arabic TV M3U" value={siteConfig.arabicTvPlaylistUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, arabicTvPlaylistUrl: e.target.value})} />
              <AdminInput label="BD Channels M3U" value={siteConfig.bdPlaylistUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, bdPlaylistUrl: e.target.value})} />
              <AdminInput label="Kids Content M3U" value={siteConfig.kidsPlaylistUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, kidsPlaylistUrl: e.target.value})} />
              <AdminInput label="Malaysia Channels M3U" value={siteConfig.malaysiaPlaylistUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, malaysiaPlaylistUrl: e.target.value})} />
              <AdminInput label="FanCode / Special M3U" value={siteConfig.fancodePlaylistUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, fancodePlaylistUrl: e.target.value})} />
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <div className="max-w-2xl glass p-10 rounded-[3rem] border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black uppercase text-sm italic">Push Notification Alert</h3>
              <Toggle active={siteConfig.pushNotification.show} onClick={() => setSiteConfig({...siteConfig, pushNotification: {...siteConfig.pushNotification, show: !siteConfig.pushNotification.show}})} />
            </div>
            <div className="space-y-6">
              <AdminInput label="Alert Title" value={siteConfig.pushNotification.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, pushNotification: {...siteConfig.pushNotification, title: e.target.value}})} />
              <AdminInput label="Alert Message" value={siteConfig.pushNotification.message} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, pushNotification: {...siteConfig.pushNotification, message: e.target.value}})} />
              <AdminInput label="Target Link (e.g. /livetv)" value={siteConfig.pushNotification.link} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, pushNotification: {...siteConfig.pushNotification, link: e.target.value}})} />
            </div>
          </div>
        )}

        {/* General Settings & Ads */}
        {activeTab === "settings" && (
          <div className="max-w-4xl space-y-8">
             <div className="glass p-10 rounded-[3rem] border-white/5 space-y-6">
                <h3 className="text-white font-black uppercase text-sm italic">Site Configuration</h3>
                <AdminInput label="Marquee Notice Text" value={siteConfig.noticeText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, noticeText: e.target.value})} />
                <div className="flex items-center gap-12">
                   <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maintenance Mode</span>
                      <Toggle active={siteConfig.maintenanceMode} onClick={() => setSiteConfig({...siteConfig, maintenanceMode: !siteConfig.maintenanceMode})} />
                   </div>
                   <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Banner Ads</span>
                      <Toggle active={siteConfig.adConfig.showBannerAds} onClick={() => setSiteConfig({...siteConfig, adConfig: {...siteConfig.adConfig, showBannerAds: !siteConfig.adConfig.showBannerAds}})} />
                   </div>
                   <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Popunder Ads</span>
                      <Toggle active={siteConfig.adConfig.showPopAds} onClick={() => setSiteConfig({...siteConfig, adConfig: {...siteConfig.adConfig, showPopAds: !siteConfig.adConfig.showPopAds}})} />
                   </div>
                </div>
             </div>

             <div className="glass p-10 rounded-[3rem] border-white/5 space-y-8">
                <h3 className="text-white font-black uppercase text-sm italic">Advertisement Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Banner Ad Top (HTML/Script)</label>
                    <textarea
                      className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all min-h-[100px]"
                      value={siteConfig.adConfig.bannerAdTop}
                      onChange={(e) => setSiteConfig({...siteConfig, adConfig: {...siteConfig.adConfig, bannerAdTop: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Banner Ad Bottom (HTML/Script)</label>
                    <textarea
                      className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all min-h-[100px]"
                      value={siteConfig.adConfig.bannerAdBottom}
                      onChange={(e) => setSiteConfig({...siteConfig, adConfig: {...siteConfig.adConfig, bannerAdBottom: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Popunder Ad Script (Integrate with layout)</label>
                  <textarea
                    className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all min-h-[80px]"
                    value={siteConfig.adConfig.popunderScript}
                    onChange={(e) => setSiteConfig({...siteConfig, adConfig: {...siteConfig.adConfig, popunderScript: e.target.value}})}
                  />
                </div>
                <AdminInput label="Popunder Direct Link (Fallback)" value={siteConfig.adConfig.popAdLink} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteConfig({...siteConfig, adConfig: {...siteConfig.adConfig, popAdLink: e.target.value}})} />
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---
const TabButton = ({ active, onClick, icon, label, collapsed }: any) => (
  <button
    onClick={onClick}
    title={collapsed ? label : ""}
    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-4 px-6'} py-4 rounded-2xl transition-all font-bold text-sm ${
      active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-white"
    }`}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);

const StatCard = ({ title, value, color }: any) => (
  <div className="glass p-8 rounded-[2.5rem] border-white/5">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{title}</p>
    <p className={`text-4xl font-black italic ${color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`}>{value}</p>
  </div>
);

const AdminInput = ({ label, value, onChange }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">{label}</label>
    <input
      className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-white font-bold text-xs outline-none focus:border-emerald-500/50 transition-all"
      value={value}
      onChange={onChange}
    />
  </div>
);

const Toggle = ({ active, onClick }: any) => (
  <button onClick={onClick} className="w-12 h-6 rounded-full relative transition-all bg-slate-950 border border-white/10">
    <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all ${active ? 'bg-emerald-500 left-7 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700 left-1'}`}></div>
  </button>
);

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="glass p-12 rounded-[3.5rem] border-white/5 w-full max-w-md text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        <h1 className="text-3xl font-black text-white italic mb-10 tracking-tighter">Admin <span className="text-emerald-500">Access</span></h1>
        <div className="space-y-4">
          <input className="w-full bg-slate-950 border border-white/5 p-5 rounded-[2rem] text-white outline-none font-bold text-sm text-center" placeholder="Username" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUser(e.target.value)} />
          <input className="w-full bg-slate-950 border border-white/5 p-5 rounded-[2rem] text-white outline-none font-bold text-sm text-center" type="password" placeholder="Secret PIN" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value)} />
          <button onClick={() => { if (user === "admin" && pin === "sajid@1234") onLogin(); }} className="w-full bg-emerald-500 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-emerald-400 transition-all uppercase tracking-widest text-xs mt-4">Initialize Session</button>
        </div>
      </div>
    </div>
  );
};
