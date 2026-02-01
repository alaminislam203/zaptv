"use client";
import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';

// --- PREMIUM ICONS (SVG) ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  Matches: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Notification: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Ads: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
};

// --- MAIN ADMIN PANEL ---
export default function EnhancedAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [channels, setChannels] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  // --- অ্যাডমিন সেটিংস (হোম পেজ কন্ট্রোল করার জন্য) ---
  const [siteConfig, setSiteConfig] = useState({
    noticeText: "স্বাগতম! নিরবিচ্ছিন্নভাবে খেলা দেখুন।",
    showPopAds: true,
    showBannerAds: true,
    notification: {
      show: true,
      title: "Live Match",
      msg: "ম্যাচ শুরু হয়েছে, এখনই জয়েন করুন!"
    }
  });

  // --- ডাটা ফেচিং এবং রিয়েল-টাইম কানেকশন ---
  useEffect(() => {
    if (isAuthenticated) {
      onSnapshot(collection(db, "channels"), (snap) => setChannels(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
      onSnapshot(collection(db, "hotMatches"), (snap) => setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
      onSnapshot(doc(db, "settings", "config"), (snap) => { if(snap.exists()) setSiteConfig(snap.data() as any); });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex overflow-hidden">
      
      {/* ১. আল্ট্রা-মডার্ন সাইডবার */}
      <aside className="w-72 bg-[#0a0a0c] border-r border-white/5 flex flex-col h-screen sticky top-0">
        <div className="p-8">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                Admin<span className="text-red-600">X</span>
            </h2>
            <p className="text-[10px] text-zinc-600 font-bold tracking-[0.3em] mt-1">STREAMING SYSTEM</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
            {[
                { id: "dashboard", label: "Dashboard", icon: <Icons.Dashboard /> },
                { id: "matches", label: "Live Matches", icon: <Icons.Matches /> },
                { id: "channels", label: "TV Channels", icon: <Icons.Matches /> },
                { id: "ads", label: "Ads Manager", icon: <Icons.Ads /> },
                { id: "settings", label: "Notice & Push", icon: <Icons.Notification /> },
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${
                        activeTab === item.id 
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20 translate-x-2" 
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                >
                    {item.icon} {item.label}
                </button>
            ))}
        </nav>

        <div className="p-6 border-t border-white/5">
            <button onClick={() => setIsAuthenticated(false)} className="w-full py-4 rounded-2xl bg-zinc-900 font-black text-xs text-red-500 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Logout</button>
        </div>
      </aside>

      {/* ২. মেইন কন্টেন্ট এরিয়া */}
      <main className="flex-1 p-10 overflow-y-auto h-screen custom-scrollbar">
        
        {/* টপ বার */}
        <div className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">Management <span className="text-red-600">{activeTab}</span></h1>
                <p className="text-xs text-zinc-500 font-medium mt-1">Welcome back, Sajid. Controlling the grid...</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-[#111] border border-white/5 px-6 py-2 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Online</span>
                </div>
            </div>
        </div>

        {/* ৩. ড্যাশবোর্ড ওভারভিউ (Charts) */}
        {activeTab === "dashboard" && (
            <div className="space-y-10 animate-fadeIn">
                <div className="grid grid-cols-4 gap-6">
                    <StatCard title="Total Channels" value={channels.length} color="indigo" />
                    <StatCard title="Live Matches" value={matches.length} color="red" />
                    <StatCard title="System Load" value="12%" color="green" />
                    <StatCard title="Ad Requests" value="1.2k" color="orange" />
                </div>

                <div className="grid grid-cols-2 gap-8 h-96">
                    <div className="bg-[#0a0a0c] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <h3 className="text-white font-black text-sm uppercase mb-6 tracking-widest italic text-zinc-500">Live Status Overview</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[ {name:'TV', v:channels.length}, {name:'Live', v:matches.length}, {name:'Ads', v:4} ]}>
                                <XAxis dataKey="name" stroke="#333" />
                                <Bar dataKey="v" fill="#dc2626" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-[#0a0a0c] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <h3 className="text-white font-black text-sm uppercase mb-6 tracking-widest italic text-zinc-500">Ad Revenue Graph</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{name: 'Pop', value: 40}, {name: 'Banner', value: 60}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                    <Cell fill="#dc2626" /> <Cell fill="#333" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* ৪. নোটিশ ও পুশ নোটিফিকেশন কন্ট্রোল (এডমিন স্পেশাল) */}
        {activeTab === "settings" && (
            <div className="max-w-4xl space-y-8 animate-fadeIn">
                <div className="bg-[#0a0a0c] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                    <h2 className="text-xl font-black text-white italic uppercase mb-8">Home Page Configuration</h2>
                    
                    <div className="space-y-8">
                        {/* নোটিশ টেক্সট */}
                        <div>
                            <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-3 block">Marquee Notice Text</label>
                            <textarea 
                                className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white text-sm outline-none focus:border-red-600/50 transition-all"
                                rows={3}
                                value={siteConfig.noticeText}
                                onChange={(e) => setSiteConfig({...siteConfig, noticeText: e.target.value})}
                            />
                        </div>

                        {/* পুশ নোটিফিকেশন */}
                        <div className="grid grid-cols-2 gap-8 p-6 bg-white/5 rounded-3xl border border-white/5">
                            <div>
                                <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2 block">Push Title</label>
                                <input className="w-full bg-black border border-white/5 p-3 rounded-xl text-white text-sm" value={siteConfig.notification.title} onChange={(e) => setSiteConfig({...siteConfig, notification: {...siteConfig.notification, title: e.target.value}})} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2 block">Notification Msg</label>
                                <input className="w-full bg-black border border-white/5 p-3 rounded-xl text-white text-sm" value={siteConfig.notification.msg} onChange={(e) => setSiteConfig({...siteConfig, notification: {...siteConfig.notification, msg: e.target.value}})} />
                            </div>
                        </div>

                        {/* অ্যাড সুইচ এবং সেভ বাটন */}
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex gap-6">
                                <Toggle label="Pop Ads" active={siteConfig.showPopAds} onClick={() => setSiteConfig({...siteConfig, showPopAds: !siteConfig.showPopAds})} />
                                <Toggle label="Banner Ads" active={siteConfig.showBannerAds} onClick={() => setSiteConfig({...siteConfig, showBannerAds: !siteConfig.showBannerAds})} />
                                <Toggle label="Push Popup" active={siteConfig.notification.show} onClick={() => setSiteConfig({...siteConfig, notification: {...siteConfig.notification, show: !siteConfig.notification.show}})} />
                            </div>
                            <button 
                                onClick={async () => {
                                    await setDoc(doc(db, "settings", "config"), siteConfig);
                                    alert("Settings Saved Successfully!");
                                }}
                                className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-red-600/30 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ৫. ম্যাচ এবং চ্যানেল লিস্ট (আপনার আগের লজিক ঠিক রাখা হয়েছে) */}
        {activeTab === "matches" && (
            <div className="grid grid-cols-12 gap-8 animate-fadeIn">
                <div className="col-span-12 bg-[#0a0a0c] p-8 rounded-[3rem] border border-white/5">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-white italic">Live Grid Control</h2>
                        <button className="bg-white text-black px-6 py-2 rounded-xl text-xs font-black uppercase">+ New Match</button>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        {matches.map(m => (
                            <div key={m.id} className="bg-black/50 border border-white/5 p-6 rounded-[2rem] group hover:border-red-600/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[9px] font-black text-red-500 uppercase">{m.status}</span>
                                    <button className="text-zinc-600 hover:text-white">✕</button>
                                </div>
                                <h4 className="font-black text-white italic uppercase tracking-tighter leading-none text-lg">{m.team1} vs {m.team2}</h4>
                                <p className="text-[10px] text-zinc-600 font-bold mt-2 truncate">{m.channelName}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

// --- হেল্পার কম্পোনেন্টস ---

const StatCard = ({ title, value, color }: any) => (
    <div className="bg-[#0a0a0c] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-red-600/30 transition-all">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-[50px] rounded-full`}></div>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">{title}</p>
        <p className="text-4xl font-black text-white tracking-tighter italic">{value}</p>
    </div>
);

const Toggle = ({ label, active, onClick }: any) => (
    <button onClick={onClick} className="flex items-center gap-3">
        <div className={`w-10 h-5 rounded-full relative transition-all ${active ? 'bg-red-600' : 'bg-zinc-800'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`}></div>
        </div>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
    </button>
);

const LoginScreen = ({ onLogin }: any) => {
    const [user, setUser] = useState("");
    const [pin, setPin] = useState("");
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="bg-[#0a0a0c] p-12 rounded-[3rem] border border-white/5 w-full max-w-md text-center shadow-2xl">
                <div className="w-20 h-20 bg-red-600 rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-white text-3xl font-black italic shadow-2xl shadow-red-600/40">X</div>
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tight mb-8 underline underline-offset-8 decoration-red-600">Access Restricted</h1>
                <div className="space-y-4">
                    <input className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-red-600/50 transition-all" placeholder="Username" onChange={e => setUser(e.target.value)} />
                    <input className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-red-600/50 transition-all" type="password" placeholder="System PIN" onChange={e => setPin(e.target.value)} />
                    <button onClick={() => { if(user === "admin" && pin === "sajid@1234") onLogin(); }} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-600/20 hover:scale-[1.02] transition-all">INITIATE SYSTEM</button>
                </div>
            </div>
        </div>
    );
};
