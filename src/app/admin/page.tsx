"use client";
import React, { useState, useEffect } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
  onSnapshot, query, orderBy 
} from "firebase/firestore";
import { db } from "../firebase"; // পাথ ঠিক না থাকলে './firebase' দিন

// --- Interfaces ---
interface DrmConfig {
  type: "clearkey" | "widevine" | "none";
  keyId?: string;
  key?: string;
  licenseUrl?: string;
}
interface Source { 
  label: string; 
  url: string; 
  drm?: DrmConfig; 
}
interface Channel { 
  id?: string; 
  name: string; 
  logo: string; 
  is_embed: boolean; 
  category: string; 
  sources: Source[]; 
}
interface HotMatch { id?: string; team1: string; team2: string; info: string; matchTime: string; channelName: string; }
interface AdData { id?: string; location: string; imageUrl: string; link: string; text: string; }
interface Report { id?: string; channelName: string; issue: string; timestamp: any; }

// সাইট সেটিংস ইন্টারফেস
interface SiteSettings {
  marqueeText: string;
  maintenanceMode: boolean;
  popupMessage: string;
  popupEnabled: boolean;
  enablePopunder: boolean;
}

export default function AdminPanel() {
  // --- States ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [activeTab, setActiveTab] = useState("channels");
  const [loading, setLoading] = useState(false);

  // Data States
  const [channels, setChannels] = useState<Channel[]>([]);
  const [matches, setMatches] = useState<HotMatch[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<SiteSettings>({ 
    marqueeText: "", 
    maintenanceMode: false, 
    popupMessage: "", 
    popupEnabled: false,
    enablePopunder: true 
  });

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Init States
  const initialChannelState: Channel = { name: "", logo: "", is_embed: false, category: "Sports", sources: [{ label: "HD", url: "", drm: { type: "none" } }] };
  const [channelForm, setChannelForm] = useState<Channel>(initialChannelState);
  const initialMatchState = { team1: "", team2: "", info: "", matchTime: "", channelName: "" };
  const [matchForm, setMatchForm] = useState<HotMatch>(initialMatchState);
  const initialAdState = { location: "top", imageUrl: "", link: "", text: "" };
  const [adForm, setAdForm] = useState<AdData>(initialAdState);

  // --- Login ---
  const handleLogin = () => {
    if (username === "admin" && pinInput === "sajid@1234") { 
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Wrong Credentials!");
    }
  };

  // --- Fetch Data ---
  const fetchData = () => {
    onSnapshot(collection(db, "channels"), (snap) => setChannels(snap.docs.map(d => ({ ...d.data(), id: d.id } as Channel))));
    onSnapshot(collection(db, "hotMatches"), (snap) => setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id } as HotMatch))));
    onSnapshot(collection(db, "ads"), (snap) => setAds(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdData))));
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => setReports(snap.docs.map(d => ({ ...d.data(), id: d.id } as Report))));
    
    // সেটিংস ফেচ করা
    onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
            marqueeText: data.marqueeText || "",
            maintenanceMode: data.maintenanceMode || false,
            popupMessage: data.popupMessage || "",
            popupEnabled: data.popupEnabled || false,
            enablePopunder: data.enablePopunder !== undefined ? data.enablePopunder : true
        });
      }
    });
  };

  // --- CRUD: Settings ---
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // settings/config ডকুমেন্টে সেভ করা হচ্ছে
      await setDoc(doc(db, "settings", "config"), settings);
      alert("Site Settings Updated!");
    } catch (e) {
      console.error(e);
      alert("Error saving settings");
    }
    setLoading(false);
  };

  // --- CRUD: Channels (Custom ID Logic Added) ---
  const handleSaveChannel = async () => {
    if (!channelForm.name) {
        alert("Channel Name is required!");
        return;
    }
    setLoading(true);
    try {
      // 1. Clean Sources
      const cleanSources = channelForm.sources.map(src => {
        if (!src.drm || src.drm.type === "none") {
          const { drm, ...rest } = src;
          return rest;
        }
        return src;
      });
      
      const dataToSave = { ...channelForm, sources: cleanSources };

      if (editingId) {
        // Edit Mode: Update existing doc
        await updateDoc(doc(db, "channels", editingId), dataToSave);
        alert("Channel Updated!");
      } else {
        // Create Mode: Use Custom ID (Channel Name)
        const customId = channelForm.name.trim(); 
        
        await setDoc(doc(db, "channels", customId), {
            ...dataToSave,
            id: customId,
            createdAt: new Date()
        });
        alert("Channel Added with Custom ID: " + customId);
      }
      
      setChannelForm(initialChannelState);
      setEditingId(null);
    } catch (e) { console.error(e); alert("Error saving channel"); }
    setLoading(false);
  };

  const handleEditChannel = (ch: Channel) => {
    const sourcesWithDrmInit = ch.sources.map(src => ({
      ...src,
      drm: src.drm ? src.drm : { type: "none" as const }
    }));
    setChannelForm({ ...ch, sources: sourcesWithDrmInit });
    setEditingId(ch.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (confirm("Are you sure?")) await deleteDoc(doc(db, collectionName, id));
  };

  // Helper Functions
  const handleSourceChange = (index: number, field: string, value: string) => {
    const newSources = [...channelForm.sources];
    (newSources[index] as any)[field] = value;
    setChannelForm({ ...channelForm, sources: newSources });
  };
  const handleDrmChange = (index: number, field: string, value: string) => {
    const newSources = [...channelForm.sources];
    if (!newSources[index].drm) newSources[index].drm = { type: "none" };
    (newSources[index].drm as any)[field] = value;
    setChannelForm({ ...channelForm, sources: newSources });
  };
  const addSource = () => setChannelForm({ ...channelForm, sources: [...channelForm.sources, { label: "New", url: "", drm: { type: "none" } }] });
  const removeSource = (index: number) => {
    const newSources = channelForm.sources.filter((_, i) => i !== index);
    setChannelForm({ ...channelForm, sources: newSources });
  };

  // Match & Ad Save
  const handleSaveMatch = async () => {
    if (editingId) await updateDoc(doc(db, "hotMatches", editingId), { ...matchForm });
    else await addDoc(collection(db, "hotMatches"), matchForm);
    setMatchForm(initialMatchState); setEditingId(null);
  };
  const handleSaveAd = async () => {
    if (editingId) await updateDoc(doc(db, "ads"), { ...adForm });
    else await addDoc(collection(db, "ads"), adForm);
    setAdForm(initialAdState); setEditingId(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="p-8 bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6">Admin Access</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Username" 
              className="p-3 rounded text-black w-full bg-gray-200 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Enter PIN" 
              className="p-3 rounded text-black w-full bg-gray-200 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
            />
          </div>
          <button 
            onClick={handleLogin} 
            className="bg-blue-600 px-4 py-3 rounded w-full font-bold mt-6 hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-cyan-400">Admin Panel</h1>
        <div className="flex gap-4">
           <a href="/" target="_blank" className="bg-green-600 px-4 py-1 text-sm rounded flex items-center">View Site</a>
           <button onClick={() => setIsAuthenticated(false)} className="bg-red-600 px-4 py-1 text-sm rounded">Logout</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["channels", "matches", "ads", "reports", "settings"].map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} className={`px-6 py-2 rounded font-bold capitalize transition ${activeTab === tab ? "bg-cyan-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* === SETTINGS TAB === */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-purple-400">Global Site Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">Scrolling News Ticker</label>
              <textarea className="w-full bg-gray-900 p-3 rounded border border-gray-600 focus:border-purple-500 outline-none" rows={3} placeholder="Enter scrolling text here..." value={settings.marqueeText} onChange={(e) => setSettings({...settings, marqueeText: e.target.value})} />
            </div>
            
            <div className="bg-gray-900 p-4 rounded border border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                    <span className="font-bold text-green-400 block">Popunder Ads</span>
                    <span className="text-xs text-gray-400">Enable/Disable 3rd party popup ads</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.enablePopunder} onChange={(e) => setSettings({...settings, enablePopunder: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-300">Global Popup / Notice</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.popupEnabled} onChange={(e) => setSettings({...settings, popupEnabled: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <input className="w-full bg-gray-800 p-2 rounded border border-gray-600 mb-2" placeholder="Popup Message (e.g. Join our Telegram)" value={settings.popupMessage} onChange={(e) => setSettings({...settings, popupMessage: e.target.value})} />
            </div>

            <div className="flex items-center justify-between bg-red-900/20 p-4 rounded border border-red-900/50">
              <div><h3 className="font-bold text-red-400">Maintenance Mode</h3><p className="text-xs text-gray-400">Enable this to hide the site content.</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            <button onClick={handleSaveSettings} disabled={loading} className="w-full bg-purple-600 py-3 rounded font-bold hover:bg-purple-500 disabled:opacity-50 text-lg shadow-lg">
              {loading ? "Saving Config..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* === CHANNELS TAB === */}
      {activeTab === "channels" && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg h-fit shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">{editingId ? "Edit Channel" : "Add New Channel"}</h2>
            <div className="space-y-3">
              <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Channel Name (Will be ID)" value={channelForm.name} onChange={(e) => setChannelForm({...channelForm, name: e.target.value})} />
              <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Logo URL" value={channelForm.logo} onChange={(e) => setChannelForm({...channelForm, logo: e.target.value})} />
              <select className="w-full bg-gray-700 p-2 rounded border border-gray-600" value={channelForm.category} onChange={(e) => setChannelForm({...channelForm, category: e.target.value})}>
                <option>Sports</option><option>News</option><option>Entertainment</option><option>Kids</option><option>Movies</option>
              </select>
              <label className="flex items-center gap-2 bg-gray-700 p-2 rounded cursor-pointer border border-gray-600">
                <input type="checkbox" checked={channelForm.is_embed} onChange={(e) => setChannelForm({...channelForm, is_embed: e.target.checked})} /> Is Iframe/Embed?
              </label>

              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-gray-400">Sources & Keys</span><button onClick={addSource} className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-500">+ Add Source</button></div>
                {channelForm.sources.map((src, idx) => (
                  <div key={idx} className="bg-gray-900 p-3 rounded border border-gray-700 relative group">
                    <button onClick={() => removeSource(idx)} className="absolute top-2 right-2 text-red-500 text-xs font-bold hover:text-red-400">✖ Remove</button>
                    <div className="grid gap-2">
                        <div className="flex gap-2">
                          <input className="w-1/3 bg-gray-800 p-1.5 text-xs rounded border border-gray-600" placeholder="Label (HD)" value={src.label} onChange={(e) => handleSourceChange(idx, "label", e.target.value)} />
                          <input className="w-2/3 bg-gray-800 p-1.5 text-xs rounded border border-gray-600" placeholder="Stream URL (.m3u8/.mpd)" value={src.url} onChange={(e) => handleSourceChange(idx, "url", e.target.value)} />
                        </div>
                        <div className="bg-gray-800 p-2 rounded border border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] uppercase font-bold text-yellow-500">DRM Type:</span>
                             <select className="bg-gray-700 text-xs p-1 rounded border border-gray-600" value={src.drm?.type || "none"} onChange={(e) => handleDrmChange(idx, "type", e.target.value)}>
                               <option value="none">None (Open/HLS)</option><option value="clearkey">ClearKey</option><option value="widevine">Widevine</option>
                             </select>
                          </div>
                          {src.drm?.type === "clearkey" && (
                            <div className="grid gap-2">
                              <input className="w-full bg-gray-900 p-1.5 text-xs rounded border border-gray-600 font-mono" placeholder="Key ID (Hex)" value={src.drm.keyId || ""} onChange={(e) => handleDrmChange(idx, "keyId", e.target.value)} />
                              <input className="w-full bg-gray-900 p-1.5 text-xs rounded border border-gray-600 font-mono" placeholder="Key (Hex)" value={src.drm.key || ""} onChange={(e) => handleDrmChange(idx, "key", e.target.value)} />
                            </div>
                          )}
                          {src.drm?.type === "widevine" && <input className="w-full bg-gray-900 p-1.5 text-xs rounded border border-gray-600" placeholder="License URL" value={src.drm.licenseUrl || ""} onChange={(e) => handleDrmChange(idx, "licenseUrl", e.target.value)} />}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSaveChannel} disabled={loading} className="w-full bg-cyan-600 py-2 rounded font-bold hover:bg-cyan-500 disabled:opacity-50 mt-4 border border-cyan-400">{loading ? "Saving..." : (editingId ? "Update Channel" : "Create Channel")}</button>
              {editingId && <button onClick={() => {setEditingId(null); setChannelForm(initialChannelState);}} className="w-full bg-gray-600 py-1 mt-2 rounded text-sm">Cancel</button>}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3 h-screen overflow-y-auto pb-20 custom-scrollbar">
            {channels.map((ch) => (
              <div key={ch.id} className="bg-gray-800 p-4 rounded flex justify-between items-center border border-gray-700 hover:border-cyan-500 transition">
                <div className="flex items-center gap-3">
                  <img src={ch.logo} className="w-12 h-12 rounded bg-black object-contain p-1 border border-gray-600" />
                  <div>
                      <h3 className="font-bold text-white">{ch.name}</h3>
                      <p className="text-[10px] text-gray-500">ID: {ch.id}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1"><span className="bg-gray-700 px-1.5 rounded">{ch.category}</span><span className={`px-1.5 rounded ${ch.is_embed ? "bg-purple-900 text-purple-200" : "bg-green-900 text-green-200"}`}>{ch.is_embed ? "Embed" : "Stream"}</span><span>{ch.sources.length} Links</span></div>
                  </div>
                </div>
                <div className="flex gap-2"><button onClick={() => handleEditChannel(ch)} className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500">Edit</button><button onClick={() => handleDelete("channels", ch.id!)} className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-500">Delete</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === MATCHES TAB === */}
      {activeTab === "matches" && (
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg h-fit border border-gray-700">
             <h2 className="text-xl font-bold mb-4 text-orange-400">Manage Match</h2>
             <div className="space-y-3">
                <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Team 1 (e.g. BAN)" value={matchForm.team1} onChange={(e) => setMatchForm({...matchForm, team1: e.target.value})} />
                <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Team 2 (e.g. IND)" value={matchForm.team2} onChange={(e) => setMatchForm({...matchForm, team2: e.target.value})} />
                <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Info (e.g. 1st ODI)" value={matchForm.info} onChange={(e) => setMatchForm({...matchForm, info: e.target.value})} />
                <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Time (e.g. 2:00 PM)" value={matchForm.matchTime} onChange={(e) => setMatchForm({...matchForm, matchTime: e.target.value})} />
                <select className="w-full bg-gray-700 p-2 rounded border border-gray-600" value={matchForm.channelName} onChange={(e) => setMatchForm({...matchForm, channelName: e.target.value})}>
                  <option value="">Select Channel to Play</option>
                  {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleSaveMatch} className="w-full bg-orange-600 py-2 rounded font-bold hover:bg-orange-500 border border-orange-400">Save Match</button>
             </div>
           </div>
           <div className="lg:col-span-2 space-y-3">
             {matches.map((m) => (
               <div key={m.id} className="bg-gray-800 p-4 rounded flex justify-between border border-gray-700">
                 <div><h3 className="font-bold text-orange-400">{m.team1} vs {m.team2}</h3><p className="text-sm">{m.info} • {m.matchTime}</p></div>
                 <button onClick={() => handleDelete("hotMatches", m.id!)} className="bg-red-600 px-3 py-1 rounded text-sm h-fit">Delete</button>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* === ADS TAB === */}
      {activeTab === "ads" && (
         <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-yellow-400">Add/Edit Advertisement</h2>
              <div className="space-y-3">
                <select className="w-full bg-gray-700 p-2 rounded border border-gray-600" value={adForm.location} onChange={(e) => setAdForm({...adForm, location: e.target.value})}><option value="top">Top Ad</option><option value="middle">Middle Ad</option></select>
                <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Image URL (Optional)" value={adForm.imageUrl} onChange={(e) => setAdForm({...adForm, imageUrl: e.target.value})} />
                <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Target Link" value={adForm.link} onChange={(e) => setAdForm({...adForm, link: e.target.value})} />
                <input className="w-full bg-gray-700 p-2 rounded border border-gray-600" placeholder="Text (If no image)" value={adForm.text} onChange={(e) => setAdForm({...adForm, text: e.target.value})} />
                <button onClick={handleSaveAd} className="w-full bg-yellow-600 py-2 rounded font-bold hover:bg-yellow-500 border border-yellow-400">Publish Ad</button>
              </div>
            </div>
            <div className="space-y-3">
               {ads.map((ad) => (
                 <div key={ad.id} className="bg-gray-800 p-4 rounded border border-gray-700">
                   <h3 className="font-bold text-yellow-400 uppercase">{ad.location} AD</h3>
                   <p className="text-xs truncate">{ad.link}</p>
                   {ad.imageUrl && <img src={ad.imageUrl} className="h-10 mt-2 rounded" />}
                   <button onClick={() => handleDelete("ads", ad.id!)} className="bg-red-600 px-3 py-1 rounded text-sm mt-2">Delete</button>
                 </div>
               ))}
            </div>
         </div>
      )}

      {/* === REPORTS TAB === */}
      {activeTab === "reports" && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-red-400">User Reports ({reports.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-700 text-gray-300"><tr><th className="p-3">Channel</th><th className="p-3">Issue</th><th className="p-3">Action</th></tr></thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 font-bold">{r.channelName}</td>
                    <td className="p-3 text-gray-400">{r.issue}</td>
                    <td className="p-3"><button onClick={() => handleDelete("reports", r.id!)} className="text-green-400 hover:underline">Resolve / Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
