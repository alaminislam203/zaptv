"use client";
import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';

// --- ICONS (SVG) ---
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Matches: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Channels: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Ads: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Status: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Reports: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
};

// --- Interfaces ---
interface Source { label: string; url: string; drm?: { type: string, keyId?: string, key?: string }; status?: "online" | "offline" | "checking" | "unknown"; }
interface Channel { id?: string; name: string; logo: string; category: string; is_embed: boolean; sources: Source[]; }
interface HotMatch { id?: string; team1: string; team2: string; team1Logo: string; team2Logo: string; info: string; matchTime: string; channelName: string; status?: "LIVE" | "UPCOMING" | "ENDED"; }
interface AdData { id?: string; location: string; imageUrl: string; link: string; text: string; }
interface Report { id?: string; channelName: string; issue: string; timestamp: any; }
interface DirectLink { label: string; url: string; }
interface SiteSettings { marqueeText: string; maintenanceMode: boolean; enablePopunder: boolean; directLinks: DirectLink[]; }

// --- TOAST COMPONENT ---
const Toast = ({ msg, type, onClose }: { msg: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-slideIn z-[200] ${type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-100' : 'bg-red-900/90 border-red-500/50 text-red-100'}`}>
    <span>{type === 'success' ? '✅' : '⚠️'}</span>
    <div>
        <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-xs opacity-90">{msg}</p>
    </div>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100">✕</button>
  </div>
);

// --- ADMIN COMPONENT ---
export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Data State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteSettings>({ marqueeText: "", maintenanceMode: false, enablePopunder: true, directLinks: [] });
  const [tempLink, setTempLink] = useState<DirectLink>({ label: "", url: "" });

  // Forms
  const initialChannel: Channel = { name: "", logo: "", category: "Sports", is_embed: false, sources: [{ label: "HD", url: "", drm: {type: "none"} }] };
  const [channelForm, setChannelForm] = useState<Channel>(initialChannel);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Match Form
  const initialMatch: HotMatch = { team1: "", team2: "", team1Logo: "", team2Logo: "", info: "", matchTime: "", channelName: "", status: "UPCOMING" };
  const [matchForm, setMatchForm] = useState<HotMatch>(initialMatch);

  const initialAd: AdData = { location: "top", imageUrl: "", link: "", text: "" };
  const [adForm, setAdForm] = useState<AdData>(initialAd);

  // Login & Fetch
  const handleLogin = () => {
    if (username === "admin" && pinInput === "sajid@1234") {
      setIsAuthenticated(true);
      onSnapshot(collection(db, "channels"), (snap) => setChannels(snap.docs.map(d => ({ ...d.data(), id: d.id } as Channel))));
      onSnapshot(collection(db, "hotMatches"), (snap) => setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id } as HotMatch))));
      onSnapshot(collection(db, "ads"), (snap) => setAds(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdData))));
      onSnapshot(query(collection(db, "reports"), orderBy("timestamp", "desc")), (snap) => setReports(snap.docs.map(d => ({ ...d.data(), id: d.id } as Report))));
      onSnapshot(doc(db, "settings", "config"), (snap) => { if(snap.exists()) setSiteConfig(snap.data() as SiteSettings); });
    } else {
      showToast("Invalid Credentials!", "error");
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- ACTIONS ---
  const saveChannel = async () => {
    if (!channelForm.name) return showToast("Channel name required", "error");
    setLoading(true);
    try {
      const customId = channelForm.name.trim().replace(/\s+/g, '_').toLowerCase();
      if (editingId) await updateDoc(doc(db, "channels", editingId), channelForm as any);
      else await setDoc(doc(db, "channels", customId), { ...channelForm, id: customId });
      setChannelForm(initialChannel); setEditingId(null); showToast("Channel saved successfully!");
    } catch(e) { showToast("Failed to save channel", "error"); }
    setLoading(false);
  };

  const saveMatch = async () => {
    if (!matchForm.team1) return showToast("Team name required", "error");
    setLoading(true);
    try {
        if (editingId) await updateDoc(doc(db, "hotMatches", editingId), matchForm as any);
        else await addDoc(collection(db, "hotMatches"), matchForm);
        setMatchForm(initialMatch); setEditingId(null); showToast("Match updated!");
    } catch(e) { showToast("Error saving match", "error"); }
    setLoading(false);
  };

  const saveAd = async () => {
    setLoading(true);
    if (editingId) await updateDoc(doc(db, "ads", editingId), adForm as any);
    else await addDoc(collection(db, "ads"), adForm);
    setAdForm(initialAd); setEditingId(null); setLoading(false); showToast("Ad updated!");
  };

  const deleteItem = async (col: string, id: string) => {
    if (confirm("Delete this item permanently?")) {
      await deleteDoc(doc(db, col, id));
      showToast("Item deleted");
    }
  };

  const saveSettings = async (newConfig?: SiteSettings) => {
    setLoading(true);
    await setDoc(doc(db, "settings", "config"), newConfig || siteConfig);
    setLoading(false); showToast("Settings updated");
  };

  // ** FIXED MISSING FUNCTIONS **
  const addDirectLink = () => {
    if(!tempLink.label || !tempLink.url) return showToast("Fill all fields", "error");
    const newConfig = { ...siteConfig, directLinks: [...(siteConfig.directLinks || []), tempLink] };
    setSiteConfig(newConfig); setTempLink({ label: "", url: "" }); 
    saveSettings(newConfig);
  };

  const removeDirectLink = (idx: number) => {
    if(!confirm("Remove link?")) return;
    const newConfig = { ...siteConfig, directLinks: siteConfig.directLinks.filter((_, i) => i !== idx) };
    setSiteConfig(newConfig);
    saveSettings(newConfig);
  };

  // --- Status Check Logic ---
  const checkStreamStatus = async (url: string) => { try { await fetch(url, { method: 'HEAD', mode: 'no-cors' }); return "online"; } catch (error) { return "offline"; } };

  const checkSingleChannel = async (channelId: string) => {
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, sources: ch.sources.map(s => ({ ...s, status: "checking" as any })) } : ch));
    const target = channels.find(c => c.id === channelId);
    if (!target) return;
    const newSources = await Promise.all(target.sources.map(async (src) => {
        const status = src.url.startsWith("http") ? await checkStreamStatus(src.url) : "unknown";
        return { ...src, status: status as any };
    }));
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, sources: newSources } : ch));
    showToast(`Checked ${target.name}`, "success");
  };

  const checkAllChannels = async () => {
    showToast("Scanning all channels...", "success");
    const updated = await Promise.all(channels.map(async (ch) => {
        const newSources = await Promise.all(ch.sources.map(async (src) => {
            try { await fetch(src.url, { method: 'HEAD', mode: 'no-cors' }); return { ...src, status: 'online' as any }; } 
            catch { return { ...src, status: 'offline' as any }; }
        })); return { ...ch, sources: newSources };
    }));
    setChannels(updated); showToast("Scan completed!");
  };

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <div className="bg-[#18181b] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800">
        <h1 className="text-3xl font-black text-center text-white mb-8">Admin<span className="text-indigo-500">Panel</span> V2</h1>
        <div className="space-y-4">
            <input className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}/>
            <input className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500" type="password" placeholder="PIN" value={pinInput} onChange={e=>setPinInput(e.target.value)}/>
            <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg">Login System</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans flex flex-col md:flex-row overflow-hidden">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      
      {/* Mobile Toggle */}
      <div className="md:hidden p-4 bg-[#121215] border-b border-zinc-800 flex justify-between items-center">
         <h2 className="font-bold text-white">ToffeePro Admin</h2>
         <button onClick={()=>setShowSidebar(!showSidebar)}><Icons.Menu/></button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 w-64 bg-[#121215] border-r border-zinc-800 flex flex-col h-full transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
         <div className="p-6 border-b border-zinc-800 hidden md:block"><h2 className="text-2xl font-black text-white">Toffee<span className="text-indigo-500">Pro</span></h2></div>
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
             {[ 
               {id: "dashboard", label: "Overview", icon: <Icons.Dashboard/>},
               {id: "matches", label: "Live Matches", icon: <Icons.Matches/>}, 
               {id: "channels", label: "Channels", icon: <Icons.Channels/>},
               {id: "ads", label: "Ads & Revenue", icon: <Icons.Ads/>},
               {id: "status", label: "System Health", icon: <Icons.Status/>},
               {id: "settings", label: "Configuration", icon: <Icons.Settings/>},
               {id: "reports", label: "User Reports", icon: <Icons.Reports/>}
             ].map(item => (
                 <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchTerm(""); setEditingId(null); if(window.innerWidth < 768) setShowSidebar(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-semibold ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
                    {item.icon} {item.label}
                 </button>
             ))}
         </nav>
         <div className="p-4 border-t border-zinc-800"><button onClick={()=>setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-900/30 p-3 rounded-xl transition"><Icons.Logout /> Logout</button></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto h-[calc(100vh-60px)] md:h-screen bg-[#09090b]">
        
        {/* --- DASHBOARD --- */}
        {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
                <h1 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[ {t:"Channels", v:channels.length, c:"indigo"}, {t:"Live Matches", v:matches.filter(m=>m.status==='LIVE').length, c:"orange"}, {t:"Reports", v:reports.length, c:"red"}, {t:"Ads", v:ads.length, c:"green"} ].map((s, i) => (
                        <div key={i} className={`p-6 rounded-2xl border border-zinc-800 bg-${s.c}-900/10`}>
                            <h3 className="text-zinc-500 text-sm font-bold uppercase">{s.t}</h3>
                            <p className={`text-4xl font-black mt-2 text-${s.c}-400`}>{s.v}</p>
                        </div>
                    ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-6 h-80">
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800">
                        <h3 className="text-zinc-400 font-bold mb-4">Content Distribution</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[ {name:'Total', v:channels.length}, {name:'Live', v:matches.length}, {name:'Issues', v:reports.length} ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="name" stroke="#71717a" />
                                <YAxis stroke="#71717a" />
                                <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px'}} />
                                <Bar dataKey="v" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800">
                        <h3 className="text-zinc-400 font-bold mb-4">Channel Categories</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{name: 'Sports', value: channels.filter(c=>c.category==='Sports').length}, {name: 'News', value: channels.filter(c=>c.category==='News').length}, {name: 'Others', value: channels.filter(c=>c.category!=='Sports' && c.category!=='News').length}]} cx="50%" cy="50%" innerRadius={40} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                    <Cell fill="#6366f1" /> <Cell fill="#10b981" /> <Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#18181b'}} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* --- MATCHES (MANUAL INPUT & STATUS) --- */}
        {activeTab === "matches" && (
            <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
                <div className="lg:col-span-4 bg-[#18181b] p-6 rounded-2xl border border-zinc-800 h-fit sticky top-4">
                    <h2 className="text-xl font-bold text-orange-400 mb-6">Match Settings</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2"><input className="bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="Team 1" value={matchForm.team1} onChange={e=>setMatchForm({...matchForm, team1:e.target.value})}/><input className="bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="Logo 1 URL" value={matchForm.team1Logo} onChange={e=>setMatchForm({...matchForm, team1Logo:e.target.value})}/></div>
                        <div className="grid grid-cols-2 gap-2"><input className="bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="Team 2" value={matchForm.team2} onChange={e=>setMatchForm({...matchForm, team2:e.target.value})}/><input className="bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="Logo 2 URL" value={matchForm.team2Logo} onChange={e=>setMatchForm({...matchForm, team2Logo:e.target.value})}/></div>
                        <input className="w-full bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="Match Info (e.g. IPL Final)" value={matchForm.info} onChange={e=>setMatchForm({...matchForm, info:e.target.value})}/>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <input type="datetime-local" className="bg-black border border-zinc-700 p-2 rounded text-sm text-zinc-400" value={matchForm.matchTime} onChange={e=>setMatchForm({...matchForm, matchTime:e.target.value})}/>
                            <select className="bg-black border border-zinc-700 p-2 rounded text-sm text-white" value={matchForm.status} onChange={e=>setMatchForm({...matchForm, status:e.target.value as any})}><option value="LIVE">🔴 LIVE</option><option value="UPCOMING">📅 UPCOMING</option><option value="ENDED">🏁 ENDED</option></select>
                        </div>

                        {/* MANUAL CHANNEL INPUT FIELD */}
                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Channel Configuration</label>
                            <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white text-sm focus:border-orange-500 outline-none" placeholder="Enter Channel ID or Direct Stream URL" value={matchForm.channelName} onChange={e=>setMatchForm({...matchForm, channelName:e.target.value})}/>
                            <p className="text-[10px] text-zinc-600">Enter ID from Channels tab OR paste .m3u8 link directly</p>
                        </div>

                        <button onClick={saveMatch} disabled={loading} className="w-full bg-gradient-to-r from-orange-600 to-red-600 py-3 rounded-lg font-bold hover:shadow-lg text-white transition">{loading?"Saving...":"Save Match Data"}</button>
                    </div>
                </div>
                <div className="lg:col-span-8 space-y-4">
                    {matches.map(m => (
                        <div key={m.id} className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2"><div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden"><img src={m.team1Logo} className="w-full h-full object-cover"/></div><div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden"><img src={m.team2Logo} className="w-full h-full object-cover"/></div></div>
                                <div>
                                    <h3 className="font-bold text-white">{m.team1} vs {m.team2}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.status==='LIVE'?'bg-red-600 text-white animate-pulse':m.status==='UPCOMING'?'bg-blue-600/20 text-blue-400':'bg-zinc-700 text-zinc-400'}`}>{m.status}</span>
                                        <p className="text-xs text-zinc-500">{new Date(m.matchTime).toLocaleString()}</p>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 font-mono mt-1">Link: {m.channelName}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition"><button onClick={()=>{setEditingId(m.id!); setMatchForm(m)}} className="text-zinc-400 hover:text-white px-2 border border-zinc-700 rounded p-1"><Icons.Settings/></button><button onClick={()=>deleteItem("hotMatches", m.id!)} className="text-red-500 hover:text-red-400 px-2 border border-red-900/30 rounded p-1"><Icons.Trash/></button></div>
                        </div>
                    ))}
                    {matches.length === 0 && <div className="text-zinc-500 text-center py-10 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">No matches found. Add one to start.</div>}
                </div>
            </div>
        )}

        {/* --- CHANNELS --- */}
        {activeTab === "channels" && (
            <div className="grid lg:grid-cols-12 gap-8 animate-fadeIn">
                <div className="lg:col-span-8 space-y-6">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500"><Icons.Search /></div>
                        <input type="text" className="w-full bg-[#18181b] border border-zinc-800 text-white rounded-xl pl-12 p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Search channels..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {filteredChannels.map(ch => (
                            <div key={ch.id} className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-indigo-500/50 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black rounded p-1 border border-zinc-700"><img src={ch.logo} className="w-full h-full object-contain"/></div>
                                    <div><h3 className="font-bold text-white">{ch.name}</h3><span className="text-xs bg-zinc-800 px-2 rounded text-zinc-400">{ch.category}</span><p className="text-[9px] text-zinc-600 mt-1">ID: {ch.id}</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={()=>{setEditingId(ch.id!); setChannelForm(ch)}} className="text-indigo-400 bg-indigo-900/20 px-3 py-1 rounded hover:bg-indigo-600 hover:text-white transition">Edit</button>
                                    <button onClick={()=>deleteItem("channels", ch.id!)} className="text-red-400 bg-red-900/20 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition">Del</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-4 bg-[#18181b] p-6 rounded-2xl border border-zinc-800 h-fit sticky top-4 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6">{editingId ? "Edit Channel" : "Add Channel"}</h2>
                    <div className="space-y-4">
                        <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none" placeholder="Name" value={channelForm.name} onChange={e=>setChannelForm({...channelForm, name: e.target.value})}/>
                        <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none text-xs" placeholder="Logo URL" value={channelForm.logo} onChange={e=>setChannelForm({...channelForm, logo: e.target.value})}/>
                        <div className="flex gap-2">
                            <select className="bg-black border border-zinc-700 p-3 rounded-lg text-white text-sm flex-1 outline-none" value={channelForm.category} onChange={e=>setChannelForm({...channelForm, category: e.target.value})}>{["Sports", "News", "Entertainment", "Kids", "Movies", "Religious"].map(c => <option key={c} value={c}>{c}</option>)}</select>
                            <label className="flex items-center bg-black px-3 rounded-lg border border-zinc-700 cursor-pointer"><input type="checkbox" className="mr-2" checked={channelForm.is_embed} onChange={e=>setChannelForm({...channelForm, is_embed: e.target.checked})}/><span className="text-xs font-bold">Embed</span></label>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto bg-black/30 p-2 rounded border border-zinc-800">
                            {channelForm.sources.map((src, i) => (
                                <div key={i} className="bg-zinc-900 p-2 rounded border border-zinc-700 relative">
                                    <button onClick={()=>{const ns=channelForm.sources.filter((_,idx)=>idx!==i);setChannelForm({...channelForm, sources:ns})}} className="absolute top-1 right-1 text-red-500 text-[10px]">Remove</button>
                                    <input className="w-full bg-transparent border-b border-zinc-700 text-xs mb-1 outline-none text-green-400" placeholder="Stream URL" value={src.url} onChange={e=>{const ns=[...channelForm.sources];ns[i].url=e.target.value;setChannelForm({...channelForm, sources:ns})}}/>
                                    <div className="flex gap-1"><input className="w-1/3 bg-black p-1 rounded text-[10px] text-white" placeholder="Label" value={src.label} onChange={e=>{const ns=[...channelForm.sources];ns[i].label=e.target.value;setChannelForm({...channelForm, sources:ns})}}/><select className="w-2/3 bg-black p-1 rounded text-[10px] text-zinc-300 outline-none" value={src.drm?.type||"none"} onChange={e=>{const ns=[...channelForm.sources]; if(!ns[i].drm) ns[i].drm={type:"none"}; (ns[i].drm as any).type=e.target.value; setChannelForm({...channelForm, sources:ns})}}><option value="none">No DRM</option><option value="clearkey">ClearKey</option><option value="widevine">Widevine</option></select></div>
                                </div>
                            ))}
                            <button onClick={()=>setChannelForm({...channelForm, sources: [...channelForm.sources, {label: "HD", url: "", drm: {type:"none"}}]})} className="w-full py-1 text-xs border border-dashed border-zinc-600 text-zinc-500 hover:text-white rounded">+ Add Source</button>
                        </div>
                        <div className="flex gap-2"><button onClick={saveChannel} disabled={loading} className="flex-1 bg-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-500 text-white transition">{loading?"Saving...":"Save"}</button>{editingId && <button onClick={()=>{setEditingId(null); setChannelForm(initialChannel)}} className="px-4 bg-zinc-800 rounded-lg">Cancel</button>}</div>
                    </div>
                </div>
            </div>
        )}

        {/* --- ADS --- */}
        {activeTab === "ads" && (
            <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
                <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800 h-fit">
                    <h2 className="text-xl font-bold text-green-400 mb-6">Create Ad</h2>
                    <div className="space-y-4">
                        <select className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none" value={adForm.location} onChange={e=>setAdForm({...adForm, location:e.target.value})}><option value="top">Top Banner</option><option value="middle">Middle Banner</option></select>
                        <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none text-xs" placeholder="Image URL" value={adForm.imageUrl} onChange={e=>setAdForm({...adForm, imageUrl:e.target.value})}/>
                        {adForm.imageUrl && <img src={adForm.imageUrl} className="h-20 mx-auto object-contain border border-zinc-700 rounded bg-black/50" />}
                        <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none" placeholder="Target Link" value={adForm.link} onChange={e=>setAdForm({...adForm, link:e.target.value})}/>
                        <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white outline-none" placeholder="Alt Text" value={adForm.text} onChange={e=>setAdForm({...adForm, text:e.target.value})}/>
                        <button onClick={saveAd} disabled={loading} className="w-full bg-green-600 py-3 rounded-lg font-bold hover:bg-green-500 text-white transition">{loading?"Saving...":"Save Ad"}</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                             <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold uppercase bg-zinc-800 px-2 py-1 rounded text-zinc-400">{ad.location}</span><div className="flex gap-2"><button onClick={()=>{setEditingId(ad.id!); setAdForm(ad)}} className="text-zinc-400 hover:text-white text-xs">Edit</button><button onClick={()=>deleteItem("ads", ad.id!)} className="text-red-500 hover:text-red-400 text-xs">Del</button></div></div>
                             {ad.imageUrl && <img src={ad.imageUrl} className="w-full h-24 object-contain bg-black rounded border border-zinc-800"/>}
                             <p className="text-xs text-zinc-500 mt-2 truncate">{ad.link}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- STATUS CHECKER --- */}
        {activeTab === "status" && (
            <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800 h-[80vh] flex flex-col animate-fadeIn">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-white">Channel Health</h2><button onClick={checkAllChannels} className="bg-indigo-600 px-4 py-2 rounded-lg text-white font-bold text-sm hover:bg-indigo-500 flex items-center gap-2"><Icons.Refresh/> Full Scan</button></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {channels.map(ch => (
                        <div key={ch.id} className="bg-zinc-900 p-3 rounded-lg border border-zinc-700 flex justify-between items-center">
                            <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${ch.sources.some(s=>s.status==='online')?'bg-green-500':'bg-zinc-600'}`}></div><span className="text-sm font-medium text-white">{ch.name}</span></div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                {ch.sources.map((src, i) => <span key={i} className={`text-[10px] px-2 py-1 rounded border ${src.status==='online'?'bg-green-900/30 border-green-500/50 text-green-400':src.status==='offline'?'bg-red-900/30 border-red-500/50 text-red-400':'bg-zinc-800 border-zinc-600 text-zinc-400'}`}>{src.label}: {src.status||"Unknown"}</span>)}
                                <button onClick={()=>checkSingleChannel(ch.id!)} className="p-1.5 bg-zinc-800 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition"><Icons.Check/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- SETTINGS --- */}
        {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800">
                    <h2 className="text-lg font-bold text-purple-400 mb-4">Site Configuration</h2>
                    <div className="space-y-4">
                        <div><label className="text-xs text-zinc-500">Marquee Text</label><textarea className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white text-sm outline-none" rows={2} value={siteConfig.marqueeText} onChange={e=>setSiteConfig({...siteConfig, marqueeText: e.target.value})}/></div>
                        <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-700"><span>Maintenance Mode</span><input type="checkbox" className="w-5 h-5 accent-red-500" checked={siteConfig.maintenanceMode} onChange={e=>setSiteConfig({...siteConfig, maintenanceMode: e.target.checked})}/></div>
                        <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-700"><span>Enable Popunder Ads</span><input type="checkbox" className="w-5 h-5 accent-purple-500" checked={siteConfig.enablePopunder} onChange={e=>setSiteConfig({...siteConfig, enablePopunder: e.target.checked})}/></div>
                        <button onClick={()=>saveSettings()} disabled={loading} className="w-full bg-purple-600 py-3 rounded-lg font-bold text-white hover:bg-purple-500 transition">{loading?"Saving...":"Save Changes"}</button>
                    </div>
                </div>
                <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800">
                    <h2 className="text-lg font-bold text-green-400 mb-4">Direct Links</h2>
                    <div className="flex gap-2 mb-4"><input className="flex-1 bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="Label" value={tempLink.label} onChange={e=>setTempLink({...tempLink, label:e.target.value})}/><input className="flex-1 bg-black border border-zinc-700 p-2 rounded text-sm text-white" placeholder="URL" value={tempLink.url} onChange={e=>setTempLink({...tempLink, url:e.target.value})}/><button onClick={addDirectLink} className="bg-green-600 px-4 rounded font-bold text-white">Add</button></div>
                    <div className="space-y-2">{siteConfig.directLinks?.map((l, i) => (<div key={i} className="flex justify-between items-center bg-zinc-900 p-3 rounded border border-zinc-700"><div><span className="font-bold text-white block text-sm">{l.label}</span><span className="text-xs text-zinc-500">{l.url}</span></div><button onClick={()=>removeDirectLink(i)} className="text-red-400 text-xs">Remove</button></div>))}</div>
                </div>
            </div>
        )}

        {/* --- REPORTS --- */}
        {activeTab === "reports" && (
            <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800 animate-fadeIn">
                <h2 className="text-xl font-bold text-red-400 mb-6">User Reports ({reports.length})</h2>
                <div className="space-y-3">
                    {reports.map(r => (
                        <div key={r.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 flex justify-between items-center">
                            <div><h3 className="font-bold text-white">{r.channelName}</h3><p className="text-sm text-red-300">Issue: {r.issue}</p><p className="text-xs text-zinc-500">{r.timestamp?.toDate().toLocaleString()}</p></div>
                            <div className="flex gap-2"><button onClick={()=>{setSearchTerm(r.channelName); setActiveTab("channels")}} className="bg-blue-600 px-3 py-1 rounded text-white text-xs">Fix</button><button onClick={()=>deleteItem("reports", r.id!)} className="bg-green-600 px-3 py-1 rounded text-white text-xs">Resolve</button></div>
                        </div>
                    ))}
                    {reports.length === 0 && <div className="text-center py-10 text-zinc-500">No reports!</div>}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}
