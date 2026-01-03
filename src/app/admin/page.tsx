"use client";
import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase"; // ফায়ারবেজ পাথ চেক করুন
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// --- Interfaces ---
interface DrmConfig { type: "clearkey" | "widevine" | "none"; keyId?: string; key?: string; licenseUrl?: string; }
interface Source { label: string; url: string; drm?: DrmConfig; status?: "online" | "offline" | "checking" | "unknown"; }
interface Channel { id?: string; name: string; logo: string; is_embed: boolean; category: string; sources: Source[]; }

interface HotMatch { 
  id?: string; 
  team1: string; 
  team2: string; 
  team1Logo: string; 
  team2Logo: string;
  info: string; 
  matchTime: string; 
  channelName: string; 
}

interface AdData { id?: string; location: string; imageUrl: string; link: string; text: string; }
interface Report { id?: string; channelName: string; issue: string; timestamp: any; }
interface DirectLinkItem { url: string; label: string; }

interface SiteSettings {
  marqueeText: string;
  maintenanceMode: boolean;
  popupMessage: string;
  popupEnabled: boolean;
  enablePopunder: boolean;
  directLinks: DirectLinkItem[];
}

// --- Admin Component ---
export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  
  // 🔥 সার্চ স্টেট
  const [searchTerm, setSearchTerm] = useState(""); 

  // Data States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Settings State
  const [siteConfig, setSiteConfig] = useState<SiteSettings>({ 
    marqueeText: "", maintenanceMode: false, popupMessage: "", 
    popupEnabled: false, enablePopunder: true, directLinks: [] 
  });
  const [tempLink, setTempLink] = useState({ url: "", label: "" });

  // Forms
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialChannelState: Channel = { name: "", logo: "", is_embed: false, category: "Sports", sources: [{ label: "HD", url: "", drm: { type: "none" } }] };
  const [channelForm, setChannelForm] = useState<Channel>(initialChannelState);
  
  const initialMatchState: HotMatch = { team1: "", team2: "", team1Logo: "", team2Logo: "", info: "", matchTime: "", channelName: "" };
  const [matchForm, setMatchForm] = useState<HotMatch>(initialMatchState);
  
  const initialAdState = { location: "top", imageUrl: "", link: "", text: "" };
  const [adForm, setAdForm] = useState<AdData>(initialAdState);

  // --- Auth & Data Fetching ---
  const handleLogin = () => {
    if (username === "admin" && pinInput === "sajid@1234") { 
      setIsAuthenticated(true); fetchData();
    } else { alert("Wrong Credentials!"); }
  };

  const fetchData = () => {
    onSnapshot(collection(db, "channels"), (snap) => setChannels(snap.docs.map(d => ({ ...d.data(), id: d.id } as Channel))));
    onSnapshot(collection(db, "hotMatches"), (snap) => setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id } as HotMatch))));
    onSnapshot(collection(db, "ads"), (snap) => setAds(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdData))));
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => setReports(snap.docs.map(d => ({ ...d.data(), id: d.id } as Report))));
    
    onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
         const data = docSnap.data();
         setSiteConfig({
             marqueeText: data.marqueeText || "", 
             maintenanceMode: data.maintenanceMode || false,
             popupMessage: data.popupMessage || "", 
             popupEnabled: data.popupEnabled || false,
             enablePopunder: data.enablePopunder !== undefined ? data.enablePopunder : true,
             directLinks: data.directLinks || []
         });
      }
    });
  };

  // --- Actions ---
  const handleSaveSettings = async (updatedConfig?: SiteSettings) => {
    setLoading(true);
    try { 
        await setDoc(doc(db, "settings", "config"), updatedConfig || siteConfig); 
    } catch (e) { alert("Error saving settings!"); }
    setLoading(false);
  };

  const addDirectLink = async () => {
    if(!tempLink.url || !tempLink.label) return alert("Fill URL and Label!");
    const newConfig = { ...siteConfig, directLinks: [...(siteConfig.directLinks || []), tempLink] };
    setSiteConfig(newConfig); setTempLink({ url: "", label: "" });
    await handleSaveSettings(newConfig);
  };

  const removeDirectLink = async (index: number) => {
    if(!confirm("Delete link?")) return;
    const newConfig = { ...siteConfig, directLinks: siteConfig.directLinks.filter((_, i) => i !== index) };
    setSiteConfig(newConfig);
    await handleSaveSettings(newConfig);
  };

  // Channel Logic
  const handleSaveChannel = async () => {
    if (!channelForm.name) return alert("Name required!");
    setLoading(true);
    try {
      const cleanSources = channelForm.sources.map(src => {
        const cleanSrc = { ...src, url: src.url.trim() };
        if (!cleanSrc.drm || cleanSrc.drm.type === "none") { const { drm, ...rest } = cleanSrc; return rest; }
        return cleanSrc;
      });
      const dataToSave = { ...channelForm, sources: cleanSources };
      const customId = channelForm.name.trim().replace(/\s+/g, '_').toLowerCase();
      
      if (editingId) { await updateDoc(doc(db, "channels", editingId), dataToSave); } 
      else { await setDoc(doc(db, "channels", customId), { ...dataToSave, id: customId, createdAt: new Date() }); }
      
      setChannelForm(initialChannelState); setEditingId(null); alert("Saved Successfully!");
    } catch (e) { alert("Error saving channel"); }
    setLoading(false);
  };

  const handleDelete = async (col: string, id: string) => { if (confirm("Are you sure?")) await deleteDoc(doc(db, col, id)); };
  
  // Status Checker
  const checkStreamStatus = async (url: string) => {
    try { await fetch(url, { method: 'HEAD', mode: 'no-cors' }); return "online"; } catch (error) { return "offline"; }
  };
  const checkAllChannels = async () => {
    if(!confirm("Check 500+ channels? This might take time.")) return;
    const updatedChannels = await Promise.all(channels.map(async (ch) => {
        const newSources = await Promise.all(ch.sources.map(async (src) => {
            if(src.url.startsWith("http")) { const status = await checkStreamStatus(src.url); return { ...src, status: status as any }; }
            return src;
        }));
        return { ...ch, sources: newSources };
    }));
    setChannels(updatedChannels);
  };

  // Match & Ad Save
  const handleSaveMatch = async () => { 
      if (editingId) await updateDoc(doc(db, "hotMatches", editingId), matchForm as any); 
      else await addDoc(collection(db, "hotMatches"), matchForm); 
      setMatchForm(initialMatchState); setEditingId(null); 
  };
  const handleSaveAd = async () => { 
      if (editingId) await updateDoc(doc(db, "ads", editingId), adForm as any); 
      else await addDoc(collection(db, "ads"), adForm); 
      setAdForm(initialAdState); setEditingId(null); 
  };

  // --- 🔥 SEARCH & FILTER LOGIC ---
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = [ { name: 'Channels', count: channels.length }, { name: 'Matches', count: matches.length }, { name: 'Reports', count: reports.length }, { name: 'Ads', count: ads.length } ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1120]">
      <div className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl border border-gray-700 w-96 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-6">Admin Portal</h1>
        <input className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg mb-4 text-white focus:outline-none focus:border-cyan-500" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}/>
        <input className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg mb-6 text-white focus:outline-none focus:border-cyan-500" type="password" placeholder="Secure PIN" value={pinInput} onChange={e=>setPinInput(e.target.value)}/>
        <button onClick={handleLogin} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 py-3 rounded-lg text-white font-bold hover:shadow-lg transition transform hover:scale-105">Access Dashboard</button>
      </div>
    </div>
  );

  // --- DASHBOARD LAYOUT ---
  return (
    <div className="min-h-screen bg-[#0b1120] text-gray-200 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0f172a] border-r border-gray-800 flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-extrabold text-cyan-400 tracking-wide">Toffee<span className="text-white">Admin</span></h2>
        </div>
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
            {[
                {id: "dashboard", icon: "📊", label: "Dashboard"},
                {id: "matches", icon: "🔥", label: "Hot Matches"},
                {id: "channels", icon: "📺", label: "Channels"},
                {id: "ads", icon: "📢", label: "Ads Manager"},
                {id: "status_check", icon: "🩺", label: "Status Check"},
                {id: "settings", icon: "⚙️", label: "Settings"},
                {id: "reports", icon: "🚨", label: "Reports"},
            ].map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setEditingId(null); setSearchTerm(""); }} 
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                    <span>{item.icon}</span> {item.label}
                </button>
            ))}
            <button onClick={()=>setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 mt-10"><span>🚪</span> Logout</button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        
        {/* --- DASHBOARD TAB --- */}
        {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
                <h1 className="text-3xl font-bold text-white mb-6">Overview</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="text-gray-400 text-sm">Total Channels</div>
                        <div className="text-3xl font-bold text-blue-400">{channels.length}</div>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="text-gray-400 text-sm">Active Matches</div>
                        <div className="text-3xl font-bold text-orange-400">{matches.length}</div>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="text-gray-400 text-sm">Reports</div>
                        <div className="text-3xl font-bold text-red-400">{reports.length}</div>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="text-gray-400 text-sm">Active Ads</div>
                        <div className="text-3xl font-bold text-yellow-400">{ads.length}</div>
                    </div>
                </div>

                <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 h-80">
                    <h3 className="font-bold text-gray-400 mb-4">Content Analytics</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '8px'}} />
                            <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % 20]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* --- CHANNELS TAB (WITH SEARCH) --- */}
        {activeTab === "channels" && (
             <div className="grid lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* Channel Form */}
                <div className="lg:col-span-1 bg-[#1e293b] p-6 rounded-2xl border border-gray-700 h-fit sticky top-4">
                    <h2 className="text-xl font-bold text-cyan-400 mb-4">{editingId ? "Edit Channel" : "Add New Channel"}</h2>
                    <div className="space-y-4">
                        <input className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-sm focus:border-cyan-500 outline-none" placeholder="Channel Name" value={channelForm.name} onChange={e=>setChannelForm({...channelForm, name: e.target.value})}/>
                        <input className="w-full bg-gray-900 border border-gray-700 p-3 rounded-lg text-sm focus:border-cyan-500 outline-none" placeholder="Logo URL" value={channelForm.logo} onChange={e=>setChannelForm({...channelForm, logo: e.target.value})}/>
                        
                        <div className="flex gap-2">
                            <select className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-sm flex-1 outline-none" value={channelForm.category} onChange={e=>setChannelForm({...channelForm, category: e.target.value})}>
                                {["Sports", "News", "Entertainment", "Kids", "Movies", "Documentary", "Religious"].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="flex items-center bg-gray-900 px-3 rounded-lg border border-gray-700">
                                <input type="checkbox" className="w-4 h-4 mr-2" checked={channelForm.is_embed} onChange={e=>setChannelForm({...channelForm, is_embed: e.target.checked})}/> <span className="text-xs">Embed</span>
                            </div>
                        </div>

                        {/* Sources */}
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {channelForm.sources.map((src, i) => (
                                <div key={i} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 relative group">
                                    <button onClick={()=>{const ns=channelForm.sources.filter((_,idx)=>idx!==i);setChannelForm({...channelForm, sources:ns})}} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100">✖</button>
                                    <input className="w-full bg-transparent border-b border-gray-600 text-xs mb-2 focus:outline-none" placeholder="Stream URL" value={src.url} onChange={e=>{const ns=[...channelForm.sources];ns[i].url=e.target.value;setChannelForm({...channelForm, sources:ns})}}/>
                                    <div className="flex gap-2">
                                        <input className="w-1/3 bg-gray-900 p-1 rounded text-xs" placeholder="Label" value={src.label} onChange={e=>{const ns=[...channelForm.sources];ns[i].label=e.target.value;setChannelForm({...channelForm, sources:ns})}}/>
                                        <select className="w-2/3 bg-gray-900 p-1 rounded text-xs" value={src.drm?.type||"none"} onChange={e=>{const ns=[...channelForm.sources];if(!ns[i].drm) ns[i].drm={type:"none"}; (ns[i].drm as any).type=e.target.value; setChannelForm({...channelForm, sources:ns})}}>
                                            <option value="none">No DRM</option><option value="clearkey">ClearKey</option><option value="widevine">Widevine</option>
                                        </select>
                                    </div>
                                    {src.drm?.type === "clearkey" && (
                                        <div className="flex gap-2 mt-2">
                                            <input className="w-1/2 bg-gray-900 p-1 text-[10px] font-mono rounded" placeholder="Key ID" value={src.drm.keyId||""} onChange={e=>{const ns=[...channelForm.sources];(ns[i].drm as any).keyId=e.target.value; setChannelForm({...channelForm, sources:ns})}}/>
                                            <input className="w-1/2 bg-gray-900 p-1 text-[10px] font-mono rounded" placeholder="Key" value={src.drm.key||""} onChange={e=>{const ns=[...channelForm.sources];(ns[i].drm as any).key=e.target.value; setChannelForm({...channelForm, sources:ns})}}/>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button onClick={()=>setChannelForm({...channelForm, sources: [...channelForm.sources, {label: "New", url: "", drm: {type:"none"}}]})} className="text-xs text-green-400 font-bold hover:underline">+ Add Source</button>
                        </div>

                        <div className="flex gap-2">
                             <button onClick={handleSaveChannel} disabled={loading} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 py-3 rounded-lg font-bold hover:shadow-lg">{loading ? "Saving..." : editingId ? "Update Channel" : "Create Channel"}</button>
                             {editingId && <button onClick={()=>{setEditingId(null); setChannelForm(initialChannelState)}} className="bg-gray-700 px-4 rounded-lg">Cancel</button>}
                        </div>
                    </div>
                </div>

                {/* Channel List With Search */}
                <div className="lg:col-span-2 space-y-4">
                     {/* 🔥 Search Bar Added Here */}
                     <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#1e293b] p-3 rounded-xl border border-gray-700">
                         <h2 className="text-lg font-bold text-white">
                            All Channels <span className="text-gray-500 text-sm">({channels.length})</span>
                         </h2>
                         <div className="relative w-full sm:w-64">
                            <input 
                                className="w-full bg-gray-900 border border-gray-700 py-2 px-3 pl-9 rounded-lg text-sm focus:border-cyan-500 outline-none transition" 
                                placeholder="Search by name or category..." 
                                value={searchTerm} 
                                onChange={e=>setSearchTerm(e.target.value)} 
                            />
                            <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>
                            {searchTerm && (
                                <button onClick={()=>setSearchTerm("")} className="absolute right-3 top-2.5 text-gray-500 hover:text-white">✖</button>
                            )}
                         </div>
                     </div>

                     <div className="grid grid-cols-1 gap-3 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                        {filteredChannels.length > 0 ? (
                            filteredChannels.map(ch => (
                                <div key={ch.id} className="bg-[#1e293b] p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:border-gray-500 transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-black rounded-lg p-1 border border-gray-600 overflow-hidden">
                                            <img src={ch.logo} alt="logo" className="w-full h-full object-contain"/>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-200 group-hover:text-cyan-400 transition">{ch.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">{ch.category}</span>
                                                <span className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded">{ch.sources.length} Links</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={()=>{ setEditingId(ch.id!); setChannelForm(ch); }} className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition" title="Edit">✏️</button>
                                        <button onClick={()=>handleDelete("channels", ch.id!)} className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition" title="Delete">🗑️</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 bg-[#1e293b] rounded-xl border border-gray-800">
                                No channels found matching "{searchTerm}"
                            </div>
                        )}
                     </div>
                </div>
             </div>
        )}

        {/* --- HOT MATCHES TAB (UPDATED DESIGN) --- */}
        {activeTab === "matches" && (
            <div className="grid lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* Match Form */}
                <div className="lg:col-span-1 bg-[#1e293b] p-6 rounded-2xl border border-gray-700 h-fit">
                    <h2 className="text-xl font-bold text-orange-400 mb-4">Manage Match</h2>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <input className="bg-gray-900 border border-gray-700 p-2 rounded text-sm" placeholder="Team 1 Name" value={matchForm.team1} onChange={e=>setMatchForm({...matchForm, team1:e.target.value})}/>
                            <input className="bg-gray-900 border border-gray-700 p-2 rounded text-sm" placeholder="Team 1 Logo URL" value={matchForm.team1Logo} onChange={e=>setMatchForm({...matchForm, team1Logo:e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input className="bg-gray-900 border border-gray-700 p-2 rounded text-sm" placeholder="Team 2 Name" value={matchForm.team2} onChange={e=>setMatchForm({...matchForm, team2:e.target.value})}/>
                            <input className="bg-gray-900 border border-gray-700 p-2 rounded text-sm" placeholder="Team 2 Logo URL" value={matchForm.team2Logo} onChange={e=>setMatchForm({...matchForm, team2Logo:e.target.value})}/>
                        </div>
                        <input className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm" placeholder="Match Info (e.g. FIFA WC)" value={matchForm.info} onChange={e=>setMatchForm({...matchForm, info:e.target.value})}/>
                        
                        <div>
                             <label className="text-xs text-gray-400">Match Time (ISO Format preferred)</label>
                             <input type="datetime-local" className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm text-gray-400" value={matchForm.matchTime} onChange={e=>setMatchForm({...matchForm, matchTime:e.target.value})}/>
                        </div>

                        <select className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm" value={matchForm.channelName} onChange={e=>setMatchForm({...matchForm, channelName:e.target.value})}>
                            <option value="">Select Streaming Channel</option>
                            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <button onClick={handleSaveMatch} className="w-full bg-orange-600 py-2 rounded-lg font-bold hover:bg-orange-500 transition">Save Match</button>
                    </div>
                </div>

                {/* Matches List */}
                <div className="lg:col-span-2 grid gap-3">
                    {matches.map(m => (
                        <div key={m.id} className="bg-[#1e293b] p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-600 overflow-hidden flex items-center justify-center"><img src={m.team1Logo} alt="T1" className="w-full h-full object-cover"/></div>
                                    <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-600 overflow-hidden flex items-center justify-center"><img src={m.team2Logo} alt="T2" className="w-full h-full object-cover"/></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-200">{m.team1} vs {m.team2}</h3>
                                    <p className="text-xs text-orange-400">{m.info} • {new Date(m.matchTime).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={()=>{setEditingId(m.id!); setMatchForm(m)}} className="text-blue-400 hover:text-white px-2">Edit</button>
                                <button onClick={()=>handleDelete("hotMatches", m.id!)} className="text-red-400 hover:text-white px-2">Delete</button>
                            </div>
                        </div>
                    ))}
                    {matches.length === 0 && <p className="text-gray-500 text-center mt-10">No active matches found.</p>}
                </div>
            </div>
        )}

        {/* --- ADS TAB --- */}
        {activeTab === "ads" && (
             <div className="grid lg:grid-cols-2 gap-6 animate-fadeIn">
                 <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 h-fit">
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Banner Ads</h2>
                    <div className="space-y-3">
                        <select className="w-full bg-gray-900 border border-gray-700 p-2 rounded" value={adForm.location} onChange={e=>setAdForm({...adForm, location:e.target.value})}>
                            <option value="top">Top Banner (Below Nav)</option>
                            <option value="middle">Middle Banner (Below Player)</option>
                        </select>
                        <input className="w-full bg-gray-900 border border-gray-700 p-2 rounded" placeholder="Image URL" value={adForm.imageUrl} onChange={e=>setAdForm({...adForm, imageUrl:e.target.value})}/>
                        <input className="w-full bg-gray-900 border border-gray-700 p-2 rounded" placeholder="Click Link" value={adForm.link} onChange={e=>setAdForm({...adForm, link:e.target.value})}/>
                        <input className="w-full bg-gray-900 border border-gray-700 p-2 rounded" placeholder="Alt Text" value={adForm.text} onChange={e=>setAdForm({...adForm, text:e.target.value})}/>
                        <button onClick={handleSaveAd} className="w-full bg-yellow-600 py-2 rounded-lg font-bold">Save Ad</button>
                    </div>
                 </div>
                 <div className="space-y-3">
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-[#1e293b] p-4 rounded-xl border border-gray-700">
                             <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded uppercase font-bold">{ad.location}</span>
                                    {ad.imageUrl && <img src={ad.imageUrl} className="h-20 w-auto mt-2 rounded border border-gray-600"/>}
                                    <p className="text-xs text-gray-400 mt-1">{ad.link}</p>
                                </div>
                                <div className="flex gap-2">
                                     <button onClick={()=>{setEditingId(ad.id!); setAdForm(ad)}} className="text-blue-400 text-sm">Edit</button>
                                     <button onClick={()=>handleDelete("ads", ad.id!)} className="text-red-400 text-sm">Delete</button>
                                </div>
                             </div>
                        </div>
                    ))}
                 </div>
             </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === "settings" && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700">
                     <h2 className="text-xl font-bold text-purple-400 mb-4">Global Configuration</h2>
                     
                     <div className="space-y-4">
                        <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-gray-300 mb-2">📢 Marquee Notice</h3>
                            <textarea className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-sm" rows={2} value={siteConfig.marqueeText} onChange={e=>setSiteConfig({...siteConfig, marqueeText: e.target.value})}/>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 flex justify-between items-center">
                                 <div>
                                     <h3 className="font-bold text-gray-300">Popunder Ads</h3>
                                     <p className="text-xs text-gray-500">Enable ad script</p>
                                 </div>
                                 <input type="checkbox" className="w-5 h-5 accent-purple-500" checked={siteConfig.enablePopunder} onChange={e=>setSiteConfig({...siteConfig, enablePopunder: e.target.checked})}/>
                             </div>
                             <div className="p-4 bg-red-900/10 rounded-xl border border-red-900/50 flex justify-between items-center">
                                 <div>
                                     <h3 className="font-bold text-red-400">Maintenance</h3>
                                     <p className="text-xs text-gray-500">Lock site for users</p>
                                 </div>
                                 <input type="checkbox" className="w-5 h-5 accent-red-500" checked={siteConfig.maintenanceMode} onChange={e=>setSiteConfig({...siteConfig, maintenanceMode: e.target.checked})}/>
                             </div>
                        </div>

                        <button onClick={()=>handleSaveSettings()} disabled={loading} className="w-full bg-purple-600 py-3 rounded-lg font-bold shadow-lg hover:bg-purple-500">{loading?"Saving...":"Save Changes"}</button>
                     </div>
                </div>

                <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700">
                     <h2 className="text-xl font-bold text-green-400 mb-4">💰 Direct Links</h2>
                     <div className="flex gap-2 mb-4">
                         <input className="flex-1 bg-gray-900 border border-gray-700 p-2 rounded" placeholder="Button Label (e.g. Join Telegram)" value={tempLink.label} onChange={e=>setTempLink({...tempLink, label:e.target.value})}/>
                         <input className="flex-1 bg-gray-900 border border-gray-700 p-2 rounded" placeholder="URL" value={tempLink.url} onChange={e=>setTempLink({...tempLink, url:e.target.value})}/>
                         <button onClick={addDirectLink} className="bg-green-600 px-4 rounded font-bold">Add</button>
                     </div>
                     <div className="space-y-2">
                         {siteConfig.directLinks?.map((link, i) => (
                             <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded border border-gray-700">
                                 <div>
                                     <span className="font-bold block">{link.label}</span>
                                     <span className="text-xs text-gray-500">{link.url}</span>
                                 </div>
                                 <button onClick={()=>removeDirectLink(i)} className="text-red-400 text-sm">Remove</button>
                             </div>
                         ))}
                         {(!siteConfig.directLinks || siteConfig.directLinks.length===0) && <p className="text-gray-500 text-sm">No direct links active.</p>}
                     </div>
                </div>
            </div>
        )}

        {/* --- STATUS CHECK TAB --- */}
        {activeTab === "status_check" && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 animate-fadeIn h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">System Health Check</h2>
                    <button onClick={checkAllChannels} className="bg-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-500 transition shadow-lg">Run Full Scan</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {channels.map(ch => (
                        <div key={ch.id} className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-2">
                             <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className={`w-2 h-2 rounded-full ${ch.sources.some(s=>s.status==='online') ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <span className="font-medium text-sm">{ch.name}</span>
                             </div>
                             <div className="flex gap-2 flex-wrap justify-end">
                                 {ch.sources.map((src, idx) => (
                                     <span key={idx} className={`text-[10px] px-2 py-1 rounded border ${src.status === 'online' ? 'bg-green-900/30 border-green-500/50 text-green-400' : src.status === 'offline' ? 'bg-red-900/30 border-red-500/50 text-red-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                                         {src.label}: {src.status || "Unknown"}
                                     </span>
                                 ))}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- REPORTS TAB --- */}
        {activeTab === "reports" && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700 animate-fadeIn">
                <h2 className="text-xl font-bold text-red-400 mb-6">User Reports ({reports.length})</h2>
                <div className="space-y-2">
                    {reports.map(r => (
                        <div key={r.id} className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white">{r.channelName}</h3>
                                <p className="text-sm text-red-300">Issue: {r.issue}</p>
                                <p className="text-xs text-gray-500">{r.timestamp?.toDate().toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-blue-600 rounded text-xs" onClick={()=>{setSearchTerm(r.channelName); setActiveTab("channels");}}>Fix</button>
                                <button className="px-3 py-1 bg-green-600 rounded text-xs" onClick={()=>handleDelete("reports", r.id!)}>Resolve</button>
                            </div>
                        </div>
                    ))}
                    {reports.length === 0 && <div className="text-center py-10 text-gray-500">No pending reports! 🎉</div>}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}
