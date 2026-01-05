"use client";
import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// --- ICONS (New Style) ---
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Matches: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Channels: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Ads: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
};

// --- Interfaces ---
interface Source { label: string; url: string; drm?: { type: string, keyId?: string, key?: string }; }
interface Channel { id?: string; name: string; logo: string; category: string; is_embed: boolean; sources: Source[]; }
interface HotMatch { id?: string; team1: string; team2: string; team1Logo: string; team2Logo: string; info: string; matchTime: string; channelName: string; }
interface AdData { id?: string; location: string; imageUrl: string; link: string; text: string; }

// --- Admin Component ---
export default function AdminPanel() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [pinInput, setPinInput] = useState("");
  
  // UI State
  const [activeTab, setActiveTab] = useState("channels"); // Default to channels to test search
  const [searchTerm, setSearchTerm] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Data State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);

  // Forms
  const initialChannel: Channel = { name: "", logo: "", category: "Sports", is_embed: false, sources: [{ label: "HD", url: "", drm: {type: "none"} }] };
  const [channelForm, setChannelForm] = useState<Channel>(initialChannel);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialMatch: HotMatch = { team1: "", team2: "", team1Logo: "", team2Logo: "", info: "", matchTime: "", channelName: "" };
  const [matchForm, setMatchForm] = useState<HotMatch>(initialMatch);

  const initialAd: AdData = { location: "top", imageUrl: "", link: "", text: "" };
  const [adForm, setAdForm] = useState<AdData>(initialAd);

  // Auth Handler
  const handleLogin = () => {
    if (username === "admin" && pinInput === "sajid@1234") {
      setIsAuthenticated(true);
      // Load Data immediately
      onSnapshot(collection(db, "channels"), (snap) => setChannels(snap.docs.map(d => ({ ...d.data(), id: d.id } as Channel))));
      onSnapshot(collection(db, "hotMatches"), (snap) => setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id } as HotMatch))));
      onSnapshot(collection(db, "ads"), (snap) => setAds(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdData))));
    } else {
      alert("Invalid Access!");
    }
  };

  // --- CRUD Handlers ---

  // 1. Channel CRUD
  const saveChannel = async () => {
    if (!channelForm.name) return alert("Name is required!");
    setLoading(true);
    try {
      const customId = channelForm.name.trim().replace(/\s+/g, '_').toLowerCase();
      if (editingId) {
        await updateDoc(doc(db, "channels", editingId), channelForm as any);
        setFeedback("Channel Updated!");
      } else {
        await setDoc(doc(db, "channels", customId), { ...channelForm, id: customId });
        setFeedback("Channel Created!");
      }
      setChannelForm(initialChannel);
      setEditingId(null);
    } catch (e) { alert("Error saving channel"); }
    setLoading(false);
    setTimeout(() => setFeedback(""), 3000);
  };

  const deleteItem = async (col: string, id: string) => {
    if (confirm("Are you sure? This cannot be undone.")) {
      await deleteDoc(doc(db, col, id));
    }
  };

  // 2. Match CRUD
  const saveMatch = async () => {
    if (!matchForm.team1) return alert("Team Name required");
    setLoading(true);
    if (editingId) await updateDoc(doc(db, "hotMatches", editingId), matchForm as any);
    else await addDoc(collection(db, "hotMatches"), matchForm);
    setMatchForm(initialMatch); setEditingId(null); setLoading(false);
  };

  // 3. Ad CRUD
  const saveAd = async () => {
    setLoading(true);
    if (editingId) await updateDoc(doc(db, "ads", editingId), adForm as any);
    else await addDoc(collection(db, "ads"), adForm);
    setAdForm(initialAd); setEditingId(null); setLoading(false);
  };

  // --- Search Logic (FIXED) ---
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Login Screen
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="bg-[#18181b] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">Admin<span className="text-indigo-500">Panel</span></h1>
            <p className="text-zinc-500 text-sm mt-2">Restricted Access Area</p>
        </div>
        <div className="space-y-4">
            <input className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}/>
            <input className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition" type="password" placeholder="PIN Code" value={pinInput} onChange={e=>setPinInput(e.target.value)}/>
            <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-900/20">Login System</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans flex flex-col md:flex-row">
      
      {/* --- Sidebar (New Dark Theme) --- */}
      <aside className="w-full md:w-72 bg-[#121215] border-r border-zinc-800 flex flex-col h-screen sticky top-0">
         <div className="p-6 border-b border-zinc-800">
             <h2 className="text-2xl font-black text-white">Toffee<span className="text-indigo-500">Pro</span></h2>
         </div>
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
             {[ 
               {id: "dashboard", label: "Dashboard", icon: <Icons.Dashboard/>},
               {id: "channels", label: "Channel Manager", icon: <Icons.Channels/>},
               {id: "matches", label: "Live Matches", icon: <Icons.Matches/>},
               {id: "ads", label: "Advertising", icon: <Icons.Ads/>},
               {id: "settings", label: "Settings", icon: <Icons.Settings/>}
             ].map(item => (
                 <button 
                    key={item.id} 
                    onClick={() => { setActiveTab(item.id); setSearchTerm(""); setEditingId(null); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-semibold ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                 >
                    {item.icon} {item.label}
                 </button>
             ))}
         </nav>
         <div className="p-4 border-t border-zinc-800">
             <button onClick={()=>setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-950/30 p-3 rounded-xl transition">
                <Icons.Logout /> Logout
             </button>
         </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen bg-[#09090b]">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white capitalize">{activeTab}</h1>
                <p className="text-zinc-500 text-sm">Manage your streaming content</p>
            </div>
            {feedback && <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/20 animate-bounce">{feedback}</div>}
        </div>

        {/* --- 1. DASHBOARD --- */}
        {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
                {[
                    { title: "Total Channels", val: channels.length, color: "text-indigo-400", bg: "bg-indigo-900/10" },
                    { title: "Live Matches", val: matches.length, color: "text-orange-400", bg: "bg-orange-900/10" },
                    { title: "Active Ads", val: ads.length, color: "text-green-400", bg: "bg-green-900/10" },
                    { title: "System Status", val: "Stable", color: "text-blue-400", bg: "bg-blue-900/10" },
                ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-2xl border border-zinc-800 ${stat.bg}`}>
                        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wide">{stat.title}</h3>
                        <p className={`text-4xl font-black mt-2 ${stat.color}`}>{stat.val}</p>
                    </div>
                ))}
            </div>
        )}

        {/* --- 2. CHANNEL MANAGER (Fixed Search) --- */}
        {activeTab === "channels" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
                
                {/* Channel List (Left Side) */}
                <div className="lg:col-span-8 order-2 lg:order-1 space-y-6">
                    {/* Search Bar - FIXED */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                            <Icons.Search />
                        </div>
                        <input 
                            type="text" 
                            className="w-full bg-[#18181b] border border-zinc-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 p-4 transition shadow-lg" 
                            placeholder="Search channels by name or category..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                                {filteredChannels.length} results
                            </span>
                        </div>
                    </div>

                    {/* Channels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {filteredChannels.length > 0 ? (
                            filteredChannels.map(ch => (
                                <div key={ch.id} className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-indigo-500/50 transition group shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-black rounded-lg p-2 border border-zinc-700 flex items-center justify-center">
                                            {ch.logo ? <img src={ch.logo} className="max-w-full max-h-full object-contain" alt="logo"/> : <span className="text-xs">No Logo</span>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{ch.name}</h3>
                                            <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded mr-2">{ch.category}</span>
                                            <span className="text-[10px] text-zinc-500">{ch.sources.length} Sources</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={()=>{setEditingId(ch.id!); setChannelForm(ch)}} className="bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition">Edit</button>
                                        <button onClick={()=>deleteItem("channels", ch.id!)} className="bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition">Delete</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 bg-[#18181b] rounded-xl border border-zinc-800">
                                <p className="text-zinc-500">No channels found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add/Edit Form (Right Side) */}
                <div className="lg:col-span-4 order-1 lg:order-2">
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800 sticky top-4 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            {editingId ? <span className="text-indigo-400">Edit Channel</span> : <span className="text-green-400">Add New Channel</span>}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Channel Name</label>
                                <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-indigo-500 outline-none" placeholder="e.g. GTV Live" value={channelForm.name} onChange={e=>setChannelForm({...channelForm, name: e.target.value})}/>
                            </div>
                            
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Logo URL</label>
                                <div className="flex gap-2">
                                    <input className="w-full bg-black border border-zinc-700 p-3 rounded-lg text-white focus:border-indigo-500 outline-none text-xs" placeholder="https://..." value={channelForm.logo} onChange={e=>setChannelForm({...channelForm, logo: e.target.value})}/>
                                    {channelForm.logo && <img src={channelForm.logo} className="w-10 h-10 rounded border border-zinc-700 bg-black object-contain" />}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <select className="bg-black border border-zinc-700 p-3 rounded-lg text-white text-sm flex-1 outline-none" value={channelForm.category} onChange={e=>setChannelForm({...channelForm, category: e.target.value})}>
                                    {["Sports", "News", "Entertainment", "Kids", "Movies", "Religious", "Documentary"].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <label className="flex items-center bg-black px-3 rounded-lg border border-zinc-700 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 mr-2" checked={channelForm.is_embed} onChange={e=>setChannelForm({...channelForm, is_embed: e.target.checked})}/>
                                    <span className="text-xs font-bold text-zinc-400">Embed</span>
                                </label>
                            </div>

                            <div className="space-y-3 bg-black/50 p-3 rounded-lg border border-zinc-800 max-h-60 overflow-y-auto">
                                <p className="text-xs text-zinc-500 font-bold uppercase">Stream Sources</p>
                                {channelForm.sources.map((src, i) => (
                                    <div key={i} className="bg-zinc-900 p-3 rounded border border-zinc-700 relative">
                                        <button onClick={()=>{const ns=channelForm.sources.filter((_,idx)=>idx!==i);setChannelForm({...channelForm, sources:ns})}} className="absolute top-1 right-1 text-red-500 text-xs hover:text-red-400">Remove</button>
                                        <input className="w-full bg-transparent border-b border-zinc-700 text-xs mb-2 focus:outline-none text-green-400 font-mono" placeholder="Stream URL (.m3u8 / .mpd)" value={src.url} onChange={e=>{const ns=[...channelForm.sources];ns[i].url=e.target.value;setChannelForm({...channelForm, sources:ns})}}/>
                                        <div className="flex gap-2">
                                            <input className="w-1/3 bg-black p-1 rounded text-xs text-white" placeholder="Label (HD)" value={src.label} onChange={e=>{const ns=[...channelForm.sources];ns[i].label=e.target.value;setChannelForm({...channelForm, sources:ns})}}/>
                                            <select className="w-2/3 bg-black p-1 rounded text-xs text-zinc-300 outline-none" value={src.drm?.type||"none"} onChange={e=>{const ns=[...channelForm.sources]; if(!ns[i].drm) ns[i].drm={type:"none"}; (ns[i].drm as any).type=e.target.value; setChannelForm({...channelForm, sources:ns})}}>
                                                <option value="none">No DRM</option>
                                                <option value="clearkey">ClearKey</option>
                                                <option value="widevine">Widevine</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={()=>setChannelForm({...channelForm, sources: [...channelForm.sources, {label: "New", url: "", drm: {type:"none"}}]})} className="w-full py-2 border border-dashed border-zinc-600 text-zinc-500 text-xs hover:text-white hover:border-white rounded transition">
                                    + Add Another Source
                                </button>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={saveChannel} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-900/40">
                                    {loading ? "Saving..." : "Save Channel"}
                                </button>
                                {editingId && <button onClick={()=>{setEditingId(null); setChannelForm(initialChannel)}} className="px-4 py-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700">Cancel</button>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. ADS MANAGER (Visual Preview) --- */}
        {activeTab === "ads" && (
            <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
                <div className="bg-[#18181b] p-8 rounded-2xl border border-zinc-800 h-fit">
                    <h2 className="text-xl font-bold text-white mb-6">Manage Advertisements</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Ad Position</label>
                            <select className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white outline-none" value={adForm.location} onChange={e=>setAdForm({...adForm, location:e.target.value})}>
                                <option value="top">Top Banner (Header)</option>
                                <option value="middle">Middle Banner (Player)</option>
                            </select>
                        </div>
                        <div>
                             <label className="text-xs text-zinc-500 mb-1 block">Image URL</label>
                             <input className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white outline-none font-mono text-xs" placeholder="https://..." value={adForm.imageUrl} onChange={e=>setAdForm({...adForm, imageUrl:e.target.value})}/>
                        </div>
                        {adForm.imageUrl && (
                            <div className="p-2 border border-dashed border-zinc-700 rounded bg-black/50 text-center">
                                <p className="text-[10px] text-zinc-500 mb-1">Preview</p>
                                <img src={adForm.imageUrl} className="h-16 mx-auto object-contain" alt="preview"/>
                            </div>
                        )}
                        <input className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white outline-none" placeholder="Destination Link" value={adForm.link} onChange={e=>setAdForm({...adForm, link:e.target.value})}/>
                        <input className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white outline-none" placeholder="Alt Text" value={adForm.text} onChange={e=>setAdForm({...adForm, text:e.target.value})}/>
                        <button onClick={saveAd} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20">Save Advertisement</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-[#18181b] p-5 rounded-2xl border border-zinc-800 flex flex-col gap-3">
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${ad.location === 'top' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>{ad.location}</span>
                                <div className="flex gap-2">
                                    <button onClick={()=>{setEditingId(ad.id!); setAdForm(ad)}} className="text-zinc-400 hover:text-white"><Icons.Settings/></button>
                                    <button onClick={()=>deleteItem("ads", ad.id!)} className="text-red-500 hover:text-red-400"><Icons.Logout/></button>
                                </div>
                            </div>
                            {ad.imageUrl ? (
                                <img src={ad.imageUrl} className="w-full h-24 object-contain bg-black rounded border border-zinc-800" alt="ad"/>
                            ) : <div className="h-24 bg-black flex items-center justify-center text-zinc-600 text-xs">No Image</div>}
                            <p className="text-xs text-zinc-500 truncate">{ad.link}</p>
                        </div>
                    ))}
                    {ads.length === 0 && <p className="text-zinc-500 text-center">No active ads.</p>}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}
