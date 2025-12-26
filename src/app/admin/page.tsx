"use client";
import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Interfaces ---
interface DrmConfig { type: "clearkey" | "widevine" | "none"; keyId?: string; key?: string; licenseUrl?: string; }
interface Source { label: string; url: string; drm?: DrmConfig; status?: "online" | "offline" | "checking" | "unknown"; }
interface Channel { id?: string; name: string; logo: string; is_embed: boolean; category: string; sources: Source[]; }
interface HotMatch { id?: string; team1: string; team2: string; info: string; matchTime: string; channelName: string; }
interface AdData { id?: string; location: string; imageUrl: string; link: string; text: string; }
interface Report { id?: string; channelName: string; issue: string; timestamp: any; }

interface DirectLinkItem {
  url: string;
  label: string;
}

interface SiteSettings {
  marqueeText: string;
  maintenanceMode: boolean;
  popupMessage: string;
  popupEnabled: boolean;
  enablePopunder: boolean;
  directLinks: DirectLinkItem[]; // Array of links
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  // Data States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Settings State
  const [siteConfig, setSiteConfig] = useState<SiteSettings>({ 
    marqueeText: "", maintenanceMode: false, popupMessage: "", 
    popupEnabled: false, enablePopunder: true,
    directLinks: [] 
  });

  const [tempLink, setTempLink] = useState({ url: "", label: "" });

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const initialChannelState: Channel = { name: "", logo: "", is_embed: false, category: "Sports", sources: [{ label: "HD", url: "", drm: { type: "none" } }] };
  const [channelForm, setChannelForm] = useState<Channel>(initialChannelState);
  const initialMatchState = { team1: "", team2: "", info: "", matchTime: "", channelName: "" };
  const [matchForm, setMatchForm] = useState<HotMatch>(initialMatchState);
  const initialAdState = { location: "top", imageUrl: "", link: "", text: "" };
  const [adForm, setAdForm] = useState<AdData>(initialAdState);

  // Login
  const handleLogin = () => {
    if (username === "admin" && pinInput === "sajid@1234") { 
      setIsAuthenticated(true); fetchData();
    } else { alert("Wrong Credentials!"); }
  };

  // Fetch Data
  const fetchData = () => {
    onSnapshot(collection(db, "channels"), (snap) => setChannels(snap.docs.map(d => ({ ...d.data(), id: d.id } as Channel))));
    onSnapshot(collection(db, "hotMatches"), (snap) => setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id } as HotMatch))));
    onSnapshot(collection(db, "ads"), (snap) => setAds(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdData))));
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => setReports(snap.docs.map(d => ({ ...d.data(), id: d.id } as Report))));
    
    // Settings Fetch logic
    onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
         const data = docSnap.data();
         setSiteConfig({
             marqueeText: data.marqueeText || "", 
             maintenanceMode: data.maintenanceMode || false,
             popupMessage: data.popupMessage || "", 
             popupEnabled: data.popupEnabled || false,
             enablePopunder: data.enablePopunder !== undefined ? data.enablePopunder : true,
             directLinks: data.directLinks || [] // নিশ্চিত করা হলো অ্যারে আছে
         });
      }
    });
  };

  // --- SETTINGS ACTIONS (AUTO SAVE ADDED) ---
  
  const handleSaveSettings = async (updatedConfig?: SiteSettings) => {
    setLoading(true);
    try { 
        // যদি নির্দিষ্ট কোনো কনফিগ পাঠানো হয় সেটা সেভ করবে, না হলে বর্তমান স্টেট
        await setDoc(doc(db, "settings", "config"), updatedConfig || siteConfig); 
        // alert("Saved!"); // বারবার এলার্ট বিরক্তিকর হতে পারে তাই কমেন্ট করা হলো
    } catch (e) { alert("Error saving settings!"); }
    setLoading(false);
  };

  // লিংক অ্যাড করার সাথে সাথে সেভ হবে
  const addDirectLink = async () => {
    if(!tempLink.url || !tempLink.label) return alert("Fill URL and Label!");
    
    // সেইফটি চেক: directLinks যদি না থাকে
    const currentLinks = siteConfig.directLinks || [];
    const updatedLinks = [...currentLinks, tempLink];
    
    const newConfig = { ...siteConfig, directLinks: updatedLinks };
    setSiteConfig(newConfig); // লোকাল আপডেট
    setTempLink({ url: "", label: "" }); // ইনপুট ক্লিয়ার
    
    // ডাটাবেস আপডেট
    await handleSaveSettings(newConfig);
  };

  // লিংক ডিলেট করার সাথে সাথে সেভ হবে
  const removeDirectLink = async (index: number) => {
    if(!confirm("Delete this link?")) return;
    
    const currentLinks = siteConfig.directLinks || [];
    const updatedLinks = currentLinks.filter((_, i) => i !== index);
    
    const newConfig = { ...siteConfig, directLinks: updatedLinks };
    setSiteConfig(newConfig);
    
    // ডাটাবেস আপডেট
    await handleSaveSettings(newConfig);
  };

  // --- SERVER STATUS CHECKER ---
  const checkStreamStatus = async (url: string) => {
    try { await fetch(url, { method: 'HEAD', mode: 'no-cors' }); return "online"; } catch (error) { return "offline"; }
  };

  const checkAllChannels = async () => {
    if(!confirm("Check ALL channels?")) return;
    const updatedChannels = await Promise.all(channels.map(async (ch) => {
        const newSources = await Promise.all(ch.sources.map(async (src) => {
            if(src.url.startsWith("http")) {
                const status = await checkStreamStatus(src.url);
                return { ...src, status: status as any };
            }
            return src;
        }));
        return { ...ch, sources: newSources };
    }));
    setChannels(updatedChannels);
  };

  const checkSingleChannel = async (channelId: string) => {
    setChannels(prev => prev.map(ch => {
        if (ch.id === channelId) return { ...ch, sources: ch.sources.map(s => ({ ...s, status: "checking" as any })) };
        return ch;
    }));
    const targetChannel = channels.find(c => c.id === channelId);
    if (!targetChannel) return;
    const newSources = await Promise.all(targetChannel.sources.map(async (src) => {
        if(src.url.startsWith("http")) {
            const status = await checkStreamStatus(src.url);
            return { ...src, status: status as any };
        }
        return { ...src, status: "unknown" as any };
    }));
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, sources: newSources } : ch));
  };

  // --- CHANNEL CRUD ---
  const handleSaveChannel = async () => {
    if (!channelForm.name) return alert("Name required!");
    setLoading(true);
    try {
      const cleanSources = channelForm.sources.map(src => {
        const cleanSrc = { ...src, url: src.url.trim() };
        if (cleanSrc.drm && cleanSrc.drm.type !== "none") {
           if (cleanSrc.drm.type === "clearkey") { cleanSrc.drm.keyId = cleanSrc.drm.keyId?.trim(); cleanSrc.drm.key = cleanSrc.drm.key?.trim(); }
           if (cleanSrc.drm.type === "widevine") { cleanSrc.drm.licenseUrl = cleanSrc.drm.licenseUrl?.trim(); }
        } else { const { drm, ...rest } = cleanSrc; return rest; }
        return cleanSrc;
      });
      const dataToSave = { ...channelForm, sources: cleanSources };
      const customId = channelForm.name.trim();
      if (editingId) { await updateDoc(doc(db, "channels", editingId), dataToSave); alert("Updated!"); } 
      else { await setDoc(doc(db, "channels", customId), { ...dataToSave, id: customId, createdAt: new Date() }); alert("Added!"); }
      setChannelForm(initialChannelState); setEditingId(null);
    } catch (e) { alert("Error!"); }
    setLoading(false);
  };

  // Helpers
  const handleEditChannel = (ch: Channel) => {
    const sourcesWithDrmInit = ch.sources.map(src => ({ ...src, drm: src.drm ? src.drm : { type: "none" as const } }));
    setChannelForm({ ...ch, sources: sourcesWithDrmInit }); setEditingId(ch.id || null); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDelete = async (col: string, id: string) => { if (confirm("Sure?")) await deleteDoc(doc(db, col, id)); };
  const handleSourceChange = (idx: number, f: string, v: string) => { const ns = [...channelForm.sources]; (ns[idx] as any)[f] = v; setChannelForm({ ...channelForm, sources: ns }); };
  const handleDrmChange = (idx: number, f: string, v: string) => { const ns = [...channelForm.sources]; if (!ns[idx].drm) ns[idx].drm = { type: "none" }; (ns[idx].drm as any)[f] = v; setChannelForm({ ...channelForm, sources: ns }); };
  const addSource = () => setChannelForm({ ...channelForm, sources: [...channelForm.sources, { label: "New", url: "", drm: { type: "none" } }] });
  const removeSource = (idx: number) => { const ns = channelForm.sources.filter((_, i) => i !== idx); setChannelForm({ ...channelForm, sources: ns }); };

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

  // Dashboard Data
  const chartData = [
    { name: 'Channels', count: channels.length },
    { name: 'Matches', count: matches.length },
    { name: 'Reports', count: reports.length },
    { name: 'Ads', count: ads.length },
  ];

  if (!isAuthenticated) return <div className="h-screen flex items-center justify-center bg-gray-900"><div className="bg-gray-800 p-8 rounded shadow-lg text-center"><input className="p-2 mb-2 w-full rounded text-black" placeholder="User" value={username} onChange={e=>setUsername(e.target.value)}/><input className="p-2 w-full rounded text-black" type="password" placeholder="PIN" value={pinInput} onChange={e=>setPinInput(e.target.value)}/><button onClick={handleLogin} className="mt-4 bg-blue-600 w-full py-2 rounded text-white font-bold">Login</button></div></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-cyan-400">Admin Pro</h1>
        <div className="flex gap-4"><a href="/" target="_blank" className="bg-green-600 px-4 py-1 rounded text-sm">Live Site</a><button onClick={()=>setIsAuthenticated(false)} className="bg-red-600 px-4 py-1 rounded text-sm">Logout</button></div>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {["dashboard", "channels", "status_check", "matches", "ads", "reports", "settings"].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`px-5 py-2 rounded font-bold capitalize whitespace-nowrap transition ${activeTab === tab ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/50" : "bg-gray-800 hover:bg-gray-700 text-gray-400"}`}>{tab.replace("_", " ")}</button>
        ))}
      </div>

      {/* --- DASHBOARD --- */}
      {activeTab === "dashboard" && (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-lg"><h3 className="text-2xl font-bold">{channels.length}</h3><p className="text-blue-200 text-sm">Total Channels</p></div>
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl shadow-lg"><h3 className="text-2xl font-bold">{matches.length}</h3><p className="text-purple-200 text-sm">Live Matches</p></div>
                <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-xl shadow-lg"><h3 className="text-2xl font-bold">{reports.length}</h3><p className="text-red-200 text-sm">Pending Reports</p></div>
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-xl shadow-lg"><h3 className="text-2xl font-bold">{ads.length}</h3><p className="text-yellow-200 text-sm">Active Ads</p></div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-64">
                <h3 className="text-sm font-bold mb-4 text-gray-400">Content Overview</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="name" stroke="#9CA3AF" /><YAxis stroke="#9CA3AF" /><Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none'}} /><Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* --- STATUS CHECKER --- */}
      {activeTab === "status_check" && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-green-400">Server Status Checker</h2><button onClick={checkAllChannels} className="bg-green-600 px-4 py-2 rounded font-bold hover:bg-green-500">Check All Links</button></div>
            <div className="grid gap-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {channels.map(ch => (
                    <div key={ch.id} className="bg-gray-900 p-3 rounded border border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto"><img src={ch.logo} className="w-8 h-8 rounded bg-black object-contain"/><span className="font-bold truncate">{ch.name}</span></div>
                        <div className="flex flex-wrap items-center gap-2">
                            {ch.sources.map((src, idx) => (
                                <div key={idx} className={`px-2 py-1 text-xs rounded border flex items-center gap-1 ${src.status === 'online' ? 'bg-green-900 border-green-500 text-green-200' : src.status === 'offline' ? 'bg-red-900 border-red-500 text-red-200' : src.status === 'checking' ? 'bg-yellow-900 border-yellow-500 text-yellow-200 animate-pulse' : 'bg-gray-800 border-gray-600'}`}>
                                    {src.label}: {src.status || "Unknown"}
                                </div>
                            ))}
                            <button onClick={() => checkSingleChannel(ch.id!)} className="ml-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded">↻ Check</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- SETTINGS (UPDATED AUTO-SAVE) --- */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
           <h2 className="text-xl font-bold text-purple-400">Site Configuration</h2>
           
           <div className="bg-gray-900 p-4 rounded border border-yellow-600/50">
               <h3 className="font-bold text-yellow-400 mb-4">💰 Direct Link / Monetization</h3>
               <p className="text-xs text-gray-400 mb-3">Links will be saved automatically when you click Add/Delete.</p>
               
               <div className="space-y-2 mb-4">
                  {siteConfig.directLinks && siteConfig.directLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-600">
                       <div className="text-sm">
                          <span className="font-bold text-white block">{link.label}</span>
                          <span className="text-gray-500 text-xs truncate max-w-[200px] block">{link.url}</span>
                       </div>
                       <button onClick={() => removeDirectLink(idx)} className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-500">Del</button>
                    </div>
                  ))}
                  {siteConfig.directLinks?.length === 0 && <p className="text-gray-500 text-xs italic">No links added yet.</p>}
               </div>

               <div className="grid gap-2 border-t border-gray-700 pt-3">
                  <input className="w-full bg-gray-800 p-2 rounded border border-gray-600 text-sm" placeholder="Button Text (e.g. Download App)" value={tempLink.label} onChange={(e) => setTempLink({...tempLink, label: e.target.value})} />
                  <input className="w-full bg-gray-800 p-2 rounded border border-gray-600 text-sm" placeholder="Direct Link URL (https://...)" value={tempLink.url} onChange={(e) => setTempLink({...tempLink, url: e.target.value})} />
                  <button onClick={addDirectLink} className="bg-green-600 py-2 rounded font-bold text-sm hover:bg-green-500">Add Link & Auto-Save</button>
               </div>
           </div>

           <div className="space-y-4">
             <label className="block text-sm font-bold text-gray-300">Scrolling Text <textarea className="w-full bg-gray-900 p-2 rounded mt-1 border border-gray-600" rows={2} value={siteConfig.marqueeText} onChange={e=>setSiteConfig({...siteConfig, marqueeText: e.target.value})}/></label>
             <div className="flex justify-between bg-gray-900 p-3 rounded items-center"><span>Popunder Ads</span><input type="checkbox" checked={siteConfig.enablePopunder} onChange={e=>setSiteConfig({...siteConfig, enablePopunder: e.target.checked})} className="w-5 h-5"/></div>
             <div className="flex justify-between bg-red-900/20 p-3 rounded items-center border border-red-900/50"><span>Maintenance Mode</span><input type="checkbox" checked={siteConfig.maintenanceMode} onChange={e=>setSiteConfig({...siteConfig, maintenanceMode: e.target.checked})} className="w-5 h-5"/></div>
           </div>
           <button onClick={() => handleSaveSettings()} disabled={loading} className="w-full bg-purple-600 py-3 rounded font-bold hover:bg-purple-500 shadow-lg">{loading ? "Saving..." : "Save Global Config"}</button>
        </div>
      )}

      {/* --- OTHER TABS (Same as before) --- */}
      {activeTab === "channels" && <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg h-fit border border-gray-700"><h2 className="text-xl font-bold mb-4 text-cyan-400">{editingId ? "Edit Channel" : "Add Channel"}</h2><div className="space-y-3"><input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Name" value={channelForm.name} onChange={e=>setChannelForm({...channelForm, name: e.target.value})}/><input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Logo URL" value={channelForm.logo} onChange={e=>setChannelForm({...channelForm, logo: e.target.value})}/><select className="w-full bg-gray-700 p-2 rounded border border-gray-600" value={channelForm.category} onChange={e=>setChannelForm({...channelForm, category: e.target.value})}><option>Sports</option><option>News</option><option>Entertainment</option><option>Kids</option><option>Movies</option></select><label className="flex gap-2 text-sm"><input type="checkbox" checked={channelForm.is_embed} onChange={e=>setChannelForm({...channelForm, is_embed: e.target.checked})}/> Is Embed?</label><div className="space-y-2">{channelForm.sources.map((src, i)=><div key={i} className="bg-gray-900 p-2 rounded border border-gray-600 relative"><button onClick={()=>removeSource(i)} className="absolute top-1 right-1 text-red-500 text-xs">✖</button><div className="grid gap-2"><div className="flex gap-2"><input className="w-1/3 bg-gray-800 p-1 text-xs rounded" placeholder="Label" value={src.label} onChange={e=>handleSourceChange(i,"label",e.target.value)}/><input className="w-2/3 bg-gray-800 p-1 text-xs rounded" placeholder="URL" value={src.url} onChange={e=>handleSourceChange(i,"url",e.target.value)}/></div><select className="bg-gray-800 text-xs p-1 w-full rounded" value={src.drm?.type||"none"} onChange={e=>handleDrmChange(i,"type",e.target.value)}><option value="none">No DRM</option><option value="clearkey">ClearKey</option><option value="widevine">Widevine</option></select>{src.drm?.type==="clearkey"&&<div className="grid gap-1"><input className="bg-gray-800 p-1 text-xs font-mono" placeholder="KeyID" value={src.drm.keyId||""} onChange={e=>handleDrmChange(i,"keyId",e.target.value)}/><input className="bg-gray-800 p-1 text-xs font-mono" placeholder="Key" value={src.drm.key||""} onChange={e=>handleDrmChange(i,"key",e.target.value)}/></div>}</div></div>)}<button onClick={addSource} className="text-xs bg-green-600 px-2 py-1 rounded">+ Source</button></div><button onClick={handleSaveChannel} className="w-full bg-cyan-600 py-2 rounded font-bold mt-2">{editingId?"Update":"Create"}</button>{editingId && <button onClick={()=>{setEditingId(null);setChannelForm(initialChannelState)}} className="w-full bg-gray-600 py-1 rounded text-xs">Cancel</button>}</div></div><div className="lg:col-span-2 space-y-2 h-[80vh] overflow-y-auto pb-10 custom-scrollbar">{channels.map(ch=><div key={ch.id} className="bg-gray-800 p-3 rounded flex justify-between items-center border border-gray-700"><div className="flex gap-3 items-center"><img src={ch.logo} className="w-10 h-10 object-contain"/><h3 className="font-bold">{ch.name}</h3></div><div className="flex gap-2"><button onClick={()=>handleEditChannel(ch)} className="bg-blue-600 px-2 py-1 rounded text-xs">Edit</button><button onClick={()=>handleDelete("channels",ch.id!)} className="bg-red-600 px-2 py-1 rounded text-xs">Del</button></div></div>)}</div></div>}
      {activeTab === "matches" && <div className="grid lg:grid-cols-3 gap-6"><div className="bg-gray-800 p-6 rounded h-fit"><input className="w-full bg-gray-700 p-2 mb-2 rounded" placeholder="Team 1" value={matchForm.team1} onChange={e=>setMatchForm({...matchForm, team1:e.target.value})}/><input className="w-full bg-gray-700 p-2 mb-2 rounded" placeholder="Team 2" value={matchForm.team2} onChange={e=>setMatchForm({...matchForm, team2:e.target.value})}/><input className="w-full bg-gray-700 p-2 mb-2 rounded" placeholder="Info" value={matchForm.info} onChange={e=>setMatchForm({...matchForm, info:e.target.value})}/><input className="w-full bg-gray-700 p-2 mb-2 rounded" placeholder="Time" value={matchForm.matchTime} onChange={e=>setMatchForm({...matchForm, matchTime:e.target.value})}/><select className="w-full bg-gray-700 p-2 mb-2 rounded" value={matchForm.channelName} onChange={e=>setMatchForm({...matchForm, channelName:e.target.value})}><option value="">Select Channel</option>{channels.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button onClick={handleSaveMatch} className="w-full bg-orange-600 py-2 rounded font-bold">Save Match</button></div><div className="lg:col-span-2 space-y-2">{matches.map(m=><div key={m.id} className="bg-gray-800 p-3 rounded flex justify-between"><div><h3 className="font-bold">{m.team1} vs {m.team2}</h3><p className="text-xs">{m.info}</p></div><button onClick={()=>handleDelete("hotMatches",m.id!)} className="bg-red-600 px-2 py-1 rounded text-xs h-fit">Del</button></div>)}</div></div>}
      {activeTab === "ads" && <div className="grid lg:grid-cols-2 gap-6"><div className="bg-gray-800 p-6 rounded h-fit"><select className="w-full bg-gray-700 p-2 mb-2 rounded" value={adForm.location} onChange={e=>setAdForm({...adForm, location:e.target.value})}><option value="top">Top</option><option value="middle">Middle</option></select><input className="w-full bg-gray-700 p-2 mb-2 rounded" placeholder="Img URL" value={adForm.imageUrl} onChange={e=>setAdForm({...adForm, imageUrl:e.target.value})}/><input className="w-full bg-gray-700 p-2 mb-2 rounded" placeholder="Link" value={adForm.link} onChange={e=>setAdForm({...adForm, link:e.target.value})}/><input className="w-full bg-gray-700 p-2 mb-2 rounded" placeholder="Text" value={adForm.text} onChange={e=>setAdForm({...adForm, text:e.target.value})}/><button onClick={handleSaveAd} className="w-full bg-yellow-600 py-2 rounded font-bold">Save Ad</button></div><div className="space-y-2">{ads.map(ad=><div key={ad.id} className="bg-gray-800 p-3 rounded border border-gray-700"><b>{ad.location}</b>: {ad.link} <button onClick={()=>handleDelete("ads",ad.id!)} className="bg-red-600 px-2 py-0.5 rounded text-xs ml-2">Del</button></div>)}</div></div>}
      {activeTab === "reports" && <div className="bg-gray-800 p-6 rounded"><h2 className="text-xl font-bold mb-4 text-red-400">Reports</h2>{reports.map(r=><div key={r.id} className="border-b border-gray-700 p-2 flex justify-between"><span><b>{r.channelName}</b>: {r.issue}</span><button onClick={()=>handleDelete("reports",r.id!)} className="text-green-400 text-xs">Resolve</button></div>)}</div>}

    </div>
  );
}
