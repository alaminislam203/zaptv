"use client";
import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- ICONS (SVG) ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  Matches: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Ads: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Notification: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
};

export default function EnhancedAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Data States
  const [channels, setChannels] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState({
    noticeText: "স্বাগতম! নিরবিচ্ছিন্নভাবে খেলা দেখুন।",
    showPopAds: true,
    showBannerAds: true,
    notification: { show: true, title: "Live Match", msg: "ম্যাচ শুরু হয়েছে!" }
  });

  // Form States
  const [matchForm, setMatchForm] = useState({ team1: "", team2: "", status: "UPCOMING", channelName: "" });
  const [channelForm, setChannelForm] = useState({ name: "", category: "Sports", url: "" });

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
        if (snap.exists()) setSiteConfig(snap.data() as any);
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

  const saveChannel = async () => {
    if (!channelForm.name || !channelForm.url) return alert("চ্যানেল তথ্য দিন!");
    setLoading(true);
    try {
      await addDoc(collection(db, "channels"), channelForm);
      setChannelForm({ name: "", category: "Sports", url: "" });
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
    await setDoc(doc(db, "settings", "config"), siteConfig);
    setLoading(false);
    alert("সেটিংস সেভ হয়েছে!");
  };

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex overflow-hidden">
      {/* সাইডবার */}
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/5 flex flex-col h-screen">
        <div className="p-8"><h2 className="text-2xl font-black text-white italic">Admin<span className="text-red-600">X</span></h2></div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl ${activeTab === "dashboard" ? "bg-red-600 text-white" : "text-zinc-500"}`}><Icons.Dashboard /> Dashboard</button>
          <button onClick={() => setActiveTab("matches")} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl ${activeTab === "matches" ? "bg-red-600 text-white" : "text-zinc-500"}`}><Icons.Matches /> Live Matches</button>
          <button onClick={() => setActiveTab("channels")} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl ${activeTab === "channels" ? "bg-red-600 text-white" : "text-zinc-500"}`}><Icons.Matches /> TV Channels</button>
          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl ${activeTab === "settings" ? "bg-red-600 text-white" : "text-zinc-500"}`}><Icons.Notification /> Notice & Ads</button>
        </nav>
      </aside>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-3xl font-black text-white uppercase mb-10 tracking-tight italic">Management <span className="text-red-600">{activeTab}</span></h1>

        {/* ড্যাশবোর্ড ট্যাব */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-4 gap-6">
            <StatCard title="Total Channels" value={channels.length} />
            <StatCard title="Live Matches" value={matches.filter(m => m.status === 'LIVE').length} />
          </div>
        )}

        {/* ম্যাচ ম্যানেজমেন্ট ট্যাব */}
        {activeTab === "matches" && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4 bg-[#0a0a0c] p-6 rounded-3xl border border-white/5 h-fit">
              <h3 className="text-white font-bold mb-4">Add/Edit Match</h3>
              <div className="space-y-4">
                <input className="w-full bg-black border border-white/5 p-3 rounded-xl text-white" placeholder="Team 1" value={matchForm.team1} onChange={e => setMatchForm({ ...matchForm, team1: e.target.value })} />
                <input className="w-full bg-black border border-white/5 p-3 rounded-xl text-white" placeholder="Team 2" value={matchForm.team2} onChange={e => setMatchForm({ ...matchForm, team2: e.target.value })} />
                <input className="w-full bg-black border border-white/5 p-3 rounded-xl text-white font-mono text-xs" placeholder="M3U8 URL / ID" value={matchForm.channelName} onChange={e => setMatchForm({ ...matchForm, channelName: e.target.value })} />
                <select className="w-full bg-black border border-white/5 p-3 rounded-xl text-white" value={matchForm.status} onChange={e => setMatchForm({ ...matchForm, status: e.target.value })}>
                  <option value="LIVE">LIVE</option>
                  <option value="UPCOMING">UPCOMING</option>
                </select>
                <button onClick={saveMatch} className="w-full bg-red-600 py-3 rounded-xl font-bold text-white">{loading ? "Saving..." : "Save Match"}</button>
              </div>
            </div>
            <div className="col-span-8 grid grid-cols-2 gap-4">
              {matches.map(m => (
                <div key={m.id} className="bg-[#0a0a0c] border border-white/5 p-6 rounded-3xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white">{m.team1} vs {m.team2}</h4>
                    <span className="text-[10px] text-red-500 font-bold">{m.status}</span>
                  </div>
                  <button onClick={() => deleteItem("hotMatches", m.id)} className="text-zinc-600 hover:text-red-500"><Icons.Trash /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* সেটিংস এবং এডস ট্যাব */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-[#0a0a0c] p-10 rounded-[3rem] border border-white/5 space-y-6">
            <div>
              <label className="text-xs text-zinc-600 font-bold mb-2 block">Marquee Notice</label>
              <textarea className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white outline-none" rows={3} value={siteConfig.noticeText} onChange={e => setSiteConfig({ ...siteConfig, noticeText: e.target.value })} />
            </div>
            <div className="flex gap-6">
              <Toggle label="Popunder Ads" active={siteConfig.showPopAds} onClick={() => setSiteConfig({ ...siteConfig, showPopAds: !siteConfig.showPopAds })} />
              <Toggle label="Banner Ads" active={siteConfig.showBannerAds} onClick={() => setSiteConfig({ ...siteConfig, showBannerAds: !siteConfig.showBannerAds })} />
            </div>
            <button onClick={saveConfig} className="w-full bg-red-600 py-4 rounded-2xl font-black text-white">SAVE ALL CONFIG</button>
          </div>
        )}
      </main>
    </div>
  );
}

// --- হেল্পার কম্পোনেন্টস ---
const StatCard = ({ title, value }: any) => (
  <div className="bg-[#0a0a0c] p-8 rounded-[2.5rem] border border-white/5">
    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">{title}</p>
    <p className="text-4xl font-black text-white italic">{value}</p>
  </div>
);

const Toggle = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className="flex items-center gap-3">
    <div className={`w-10 h-5 rounded-full relative transition-all ${active ? 'bg-red-600' : 'bg-zinc-800'}`}>
      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
    <span className="text-[10px] font-black text-zinc-500 uppercase">{label}</span>
  </button>
);

const LoginScreen = ({ onLogin }: any) => {
  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="bg-[#0a0a0c] p-12 rounded-[3rem] border border-white/5 w-full max-w-md text-center shadow-2xl">
        <h1 className="text-2xl font-black text-white italic mb-8 decoration-red-600">Admin Access</h1>
        <div className="space-y-4">
          <input className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white outline-none" placeholder="Username" onChange={e => setUser(e.target.value)} />
          <input className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white outline-none" type="password" placeholder="PIN" onChange={e => setPin(e.target.value)} />
          <button onClick={() => { if (user === "admin" && pin === "sajid@1234") onLogin(); }} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl">LOGIN</button>
        </div>
      </div>
    </div>
  );
};
