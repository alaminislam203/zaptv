// ============================================================
// FALCON SPORTS — Admin Panel (Multi-stream support)
// Supports adding: HLS, DASH, YouTube, iframe, MP4 streams
// ============================================================

import { useState, useEffect, CSSProperties } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp, setDoc
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA3bna8DVXzCLUU3YQoXColTC0-8T4LoF0",
  authDomain: "arenax-live-tv.firebaseapp.com",
  projectId: "arenax-live-tv",
  storageBucket: "arenax-live-tv.firebasestorage.app",
  messagingSenderId: "302900762554",
  appId: "1:302900762554:web:98e23ca37c50868e1a6f83",
  measurementId: "G-G5EPV3XFP4"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

const emptyMatch = {
  sport: "Football", league: "",
  homeTeam: "", homeLogo: "",
  awayTeam: "", awayLogo: "",
  matchDate: "", status: "upcoming",
  homeScore: "", awayScore: "",
  streams: [{ label: "Main Stream", url: "", type: "auto" }],
};

const sportOptions  = ["Football", "Cricket", "Basketball", "Tennis", "Baseball", "Rugby", "Hockey"];
const statusOptions = [
  { value: "upcoming", label: "⏳ Upcoming", color: "#1a73e8" },
  { value: "live",     label: "🔴 Live",     color: "#ef4444" },
  { value: "finished", label: "✅ Finished", color: "#16a34a" },
];
const streamTypes = ["auto","hls","dash","youtube","iframe","mp4"];

const S: { [key: string]: CSSProperties } = {
  label: { display:"block", fontSize:11, fontWeight:700, color:"#666", marginBottom:4, marginTop:12, letterSpacing:0.4 },
  input: { width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" },
  select: { width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none", background:"#fff", boxSizing:"border-box", cursor:"pointer" },
  textarea: { width:"100%", padding:"9px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize: 'vertical', height: 200 }
};

// ─── LOGIN ────────────────────────────────────────────────────
function LoginPage() {
  const [email,setEmail] = useState("");
  const [pass,setPass]   = useState("");
  const [err,setErr]     = useState("");
  const [busy,setBusy]   = useState(false);

  const login = async () => {
    setErr(""); setBusy(true);
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch { setErr("Invalid email or password."); }
    setBusy(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f2f5", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"40px 36px", boxShadow:"0 4px 24px rgba(0,0,0,0.1)", width:"100%", maxWidth:360 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:32 }}>🦅</div>
          <div style={{ fontWeight:800, fontSize:22, letterSpacing:1, marginTop:6 }}>
            <span style={{ color:"#e53e3e" }}>FALCON</span><span style={{ color:"#1a73e8" }}>SPORTS</span>
          </div>
          <div style={{ color:"#888", fontSize:13, marginTop:3 }}>Admin Panel</div>
        </div>
        {err && <div style={{ background:"#fef2f2", color:"#dc2626", padding:"10px 14px", borderRadius:8, marginBottom:14, fontSize:13 }}>{err}</div>}
        <label style={S.label}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={S.input} placeholder="admin@example.com" />
        <label style={S.label}>Password</label>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&login()} style={S.input} placeholder="••••••••" />
        <button onClick={login} disabled={busy} style={{
          width:"100%", padding:"12px", background:"#1a73e8", color:"#fff",
          border:"none", borderRadius:10, fontWeight:700, fontSize:15,
          cursor:"pointer", marginTop:16, opacity:busy?0.7:1
        }}>{busy?"Signing in...":"Sign In"}</button>
      </div>
    </div>
  );
}

// ─── STREAM EDITOR ───────────────────────────────────────────
function StreamEditor({ streams, onChange }) {
  const add = () => onChange([...streams, { label:`Stream ${streams.length+1}`, url:"", type:"auto" }]);
  const remove = (i) => onChange(streams.filter((_,idx)=>idx!==i));
  const update = (i, key, val) => {
    const updated = streams.map((s,idx) => idx===i ? {...s,[key]:val} : s);
    onChange(updated);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, marginBottom:6 }}>
        <label style={{ ...S.label, margin:0 }}>📡 Stream Links</label>
        <button onClick={add} style={{
          background:"#e8f0fe", color:"#1a73e8", border:"none",
          borderRadius:8, padding:"5px 12px", fontSize:12,
          fontWeight:700, cursor:"pointer"
        }}>+ Add Stream</button>
      </div>

      {streams.map((s,i) => (
        <div key={i} style={{
          background:"#f8faff", borderRadius:10, padding:"12px",
          marginBottom:8, border:"1.5px solid #e8f0fe"
        }}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <div style={{ flex:1 }}>
              <label style={{ ...S.label, marginTop:0 }}>Label</label>
              <input value={s.label} onChange={e=>update(i,"label",e.target.value)}
                style={S.input} placeholder="e.g. HD Stream" />
            </div>
            <div style={{ width:110 }}>
              <label style={{ ...S.label, marginTop:0 }}>Type</label>
              <select value={s.type} onChange={e=>update(i,"type",e.target.value)} style={S.select}>
                {streamTypes.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
            {streams.length > 1 && (
              <button onClick={()=>remove(i)} style={{
                alignSelf:"flex-end", background:"#fef2f2", color:"#dc2626",
                border:"1px solid #fecaca", borderRadius:8,
                padding:"8px 10px", cursor:"pointer", fontWeight:700, fontSize:13
              }}>✕</button>
            )}
          </div>
          <label style={{ ...S.label, marginTop:0 }}>URL</label>
          <input value={s.url} onChange={e=>update(i,"url",e.target.value)}
            style={S.input} placeholder="https://... (.m3u8 / .mpd / YouTube / iframe / .mp4)" />
          {/* Type hint */}
          {s.url && (
            <div style={{ fontSize:10, color:"#888", marginTop:4 }}>
              {s.url.includes(".m3u8") ? "✅ HLS detected" :
               s.url.includes(".mpd")  ? "✅ DASH detected" :
               s.url.includes("youtube") ? "✅ YouTube detected" :
               s.url.endsWith(".mp4") ? "✅ MP4 detected" :
               "ℹ️ Will embed as iframe"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── MATCH FORM ───────────────────────────────────────────────
function MatchForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || emptyMatch);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={S.label}>Sport *</label>
          <select value={form.sport} onChange={e=>set("sport",e.target.value)} style={S.select}>
            {sportOptions.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>League *</label>
          <input value={form.league} onChange={e=>set("league",e.target.value)} style={S.input} placeholder="e.g. Bundesliga" />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={S.label}>Home Team *</label>
          <input value={form.homeTeam} onChange={e=>set("homeTeam",e.target.value)} style={S.input} placeholder="FC Bayern Munich" />
          <label style={S.label}>Home Logo URL</label>
          <input value={form.homeLogo} onChange={e=>set("homeLogo",e.target.value)} style={S.input} placeholder="https://..." />
        </div>
        <div>
          <label style={S.label}>Away Team *</label>
          <input value={form.awayTeam} onChange={e=>set("awayTeam",e.target.value)} style={S.input} placeholder="Borussia M'gladbach" />
          <label style={S.label}>Away Logo URL</label>
          <input value={form.awayLogo} onChange={e=>set("awayLogo",e.target.value)} style={S.input} placeholder="https://..." />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={S.label}>Match Date & Time</label>
          <input type="datetime-local" value={form.matchDate} onChange={e=>set("matchDate",e.target.value)} style={S.input} />
        </div>
        <div>
          <label style={S.label}>Status</label>
          <select value={form.status} onChange={e=>set("status",e.target.value)} style={S.select}>
            {statusOptions.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {(form.status === "live" || form.status === "finished") && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={S.label}>Home Score</label>
            <input type="number" value={form.homeScore} onChange={e=>set("homeScore",e.target.value)} style={S.input} placeholder="0" />
          </div>
          <div>
            <label style={S.label}>Away Score</label>
            <input type="number" value={form.awayScore} onChange={e=>set("awayScore",e.target.value)} style={S.input} placeholder="0" />
          </div>
        </div>
      )}

      {/* Multi-stream editor */}
      <StreamEditor
        streams={form.streams || [{ label:"Main Stream", url:"", type:"auto" }]}
        onChange={v => set("streams", v)}
      />

      <div style={{ display:"flex", gap:10, marginTop:18 }}>
        <button onClick={()=>onSave(form)} disabled={saving} style={{
          flex:1, padding:"11px", background:"#1a73e8", color:"#fff",
          border:"none", borderRadius:8, fontWeight:700, fontSize:14,
          cursor:"pointer", opacity:saving?0.7:1
        }}>{saving ? "Saving..." : "💾 Save Match"}</button>
        <button onClick={onCancel} style={{
          padding:"11px 20px", background:"#f0f2f5", color:"#555",
          border:"none", borderRadius:8, fontWeight:600, fontSize:14, cursor:"pointer"
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── PAGE EDITOR ──────────────────────────────────────────────
function PageEditor({ page, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(page?.title || "");
  const [content, setContent] = useState(page?.content || "");

  const handleSave = () => {
    onSave({ ...page, title, content });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#222", marginBottom: 14 }}>
        {page?.id ? "✏️ Edit Page" : "➕ Add New Page"}
      </h2>
      <label style={S.label}>Page Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={S.input}
        placeholder="e.g. About Us"
      />
      <label style={S.label}>Page Content (HTML supported)</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={S.textarea}
        placeholder="Enter your page content here. You can use HTML tags."
      />
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, padding: "11px", background: "#1a73e8", color: "#fff",
          border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
          cursor: "pointer", opacity: saving ? 0.7 : 1
        }}>{saving ? "Saving..." : "💾 Save Page"}</button>
        <button onClick={onCancel} style={{
          padding: "11px 20px", background: "#f0f2f5", color: "#555",
          border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer"
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── MENU MANAGER ──────────────────────────────────────────────
function MenuManager() {
    const [menuItems, setMenuItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "menu"), orderBy("label"));
        const unsub = onSnapshot(q, snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, []);

    const saveMenuItem = async (itemData) => {
        setSaving(true);
        try {
            if (itemData.id) {
                const { id, ...data } = itemData;
                await updateDoc(doc(db, "menu", id), data);
            } else {
                await addDoc(collection(db, "menu"), itemData);
            }
            setEditingItem(null);
        } catch (e) {
            alert("Error saving menu item: " + e.message);
        }
        setSaving(false);
    };

    const deleteMenuItem = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this menu item?")) return;
        try {
            await deleteDoc(doc(db, "menu", itemId));
        } catch (e) {
            alert("Error deleting menu item: " + e.message);
        }
    };

    return (
        <div>
            {editingItem ? (
                <MenuItemForm
                    item={editingItem}
                    onSave={saveMenuItem}
                    onCancel={() => setEditingItem(null)}
                    saving={saving}
                />
            ) : (
                <>
                    <button onClick={() => setEditingItem({ label: '', url: '' })} style={{
                        padding:"11px 20px", background:"#1a73e8", color:"#fff",
                        border:"none", borderRadius:10, fontWeight:700, fontSize:14,
                        cursor:"pointer", marginBottom:16, boxShadow:"0 2px 8px rgba(26,115,232,0.3)"
                    }}>➕ Add Menu Item</button>

                    {menuItems.map(item => (
                        <div key={item.id} style={{ background: "#fff", borderRadius: 12, padding: "13px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{item.label}</div>
                                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{item.url}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setEditingItem(item)} style={{ padding: "7px 16px", background: "#f0f6ff", color: "#1a73e8", border: "1px solid #c7deff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Edit</button>
                                <button onClick={() => deleteMenuItem(item.id)} style={{ padding: "7px 14px", background: "#fff0f0", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            </div>
                        </div>
                    ))}
                     {menuItems.length === 0 && (
                        <div style={{ textAlign:"center", padding:40, background:"#fff", borderRadius:12, color:"#aaa" }}>
                            <div style={{ fontSize:40 }}>🔗</div>
                            <div style={{ marginTop:8, fontWeight:600 }}>No menu items yet. Add your first one!</div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function MenuItemForm({ item, onSave, onCancel, saving }) {
    const [label, setLabel] = useState(item?.label || "");
    const [url, setUrl] = useState(item?.url || "");

    const handleSave = () => {
        onSave({ ...item, label, url });
    };

    return (
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#222", marginBottom: 14 }}>
                {item?.id ? "✏️ Edit Menu Item" : "➕ Add New Menu Item"}
            </h2>
            <label style={S.label}>Label</label>
            <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                style={S.input}
                placeholder="e.g. Home"
            />
            <label style={S.label}>URL</label>
            <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={S.input}
                placeholder="e.g. / or https://example.com"
            />
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={handleSave} disabled={saving} style={{
                    flex: 1, padding: "11px", background: "#1a73e8", color: "#fff",
                    border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
                    cursor: "pointer", opacity: saving ? 0.7 : 1
                }}>{saving ? "Saving..." : "💾 Save Item"}</button>
                <button onClick={onCancel} style={{
                    padding: "11px 20px", background: "#f0f2f5", color: "#555",
                    border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer"
                }}>Cancel</button>
            </div>
        </div>
    );
}

// ─── AD MANAGER ────────────────────────────────────────────────
function AdManager() {
    const [adView, setAdView] = useState('banner'); // 'banner' or 'carousel'
    const [bannerAds, setBannerAds] = useState([]);
    const [carouselAds, setCarouselAds] = useState([]);
    const [editingAd, setEditingAd] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubBanner = onSnapshot(query(collection(db, "bannerAds")), snap => {
            setBannerAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubCarousel = onSnapshot(query(collection(db, "carouselAds"), orderBy("createdAt", "asc")), snap => {
            setCarouselAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubBanner(); unsubCarousel(); };
    }, []);

    const saveAd = async (adData, type) => {
        setSaving(true);
        const collectionName = type === 'banner' ? 'bannerAds' : 'carouselAds';
        try {
            if (adData.id) {
                const { id, ...data } = adData;
                await updateDoc(doc(db, collectionName, id), data);
            } else {
                await addDoc(collection(db, collectionName), { ...adData, createdAt: serverTimestamp() });
            }
            setEditingAd(null);
        } catch (e) {
            alert(`Error saving ${type} ad: ` + e.message);
        }
        setSaving(false);
    };

    const deleteAd = async (adId, type) => {
        if (!window.confirm(`Are you sure you want to delete this ${type} ad?`)) return;
        const collectionName = type === 'banner' ? 'bannerAds' : 'carouselAds';
        try {
            await deleteDoc(doc(db, collectionName, adId));
        } catch (e) {
            alert(`Error deleting ${type} ad: ` + e.message);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: '#fff', padding: 5, borderRadius: 10 }}>
                <button onClick={() => setAdView('banner')} style={{ flex: 1, padding: '8px 4px', borderRadius: 7, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', background: adView === 'banner' ? '#1a73e8' : 'transparent', color: adView === 'banner' ? '#fff' : '#666' }}>Banner Ads</button>
                <button onClick={() => setAdView('carousel')} style={{ flex: 1, padding: '8px 4px', borderRadius: 7, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', background: adView === 'carousel' ? '#1a73e8' : 'transparent', color: adView === 'carousel' ? '#fff' : '#666' }}>Carousel Ads</button>
            </div>

            {editingAd ? (
                <AdForm
                    ad={editingAd}
                    type={adView}
                    onSave={(data) => saveAd(data, adView)}
                    onCancel={() => setEditingAd(null)}
                    saving={saving}
                />
            ) : (
                <>
                    <button onClick={() => setEditingAd({ imageUrl: '', linkUrl: '' })} style={{
                        padding:"11px 20px", background:"#1a73e8", color:"#fff",
                        border:"none", borderRadius:10, fontWeight:700, fontSize:14,
                        cursor:"pointer", marginBottom:16, boxShadow:"0 2px 8px rgba(26,115,232,0.3)"
                    }}>➕ Add {adView === 'banner' ? 'Banner Ad' : 'Carousel Slide'}</button>

                    {(adView === 'banner' ? bannerAds : carouselAds).map(ad => (
                        <div key={ad.id} style={{ background: "#fff", borderRadius: 12, padding: "10px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                            <img src={ad.imageUrl} style={{ width: 100, height: 50, borderRadius: 8, objectFit: 'cover' }} alt="Ad" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 12, color: "#111", wordBreak: 'break-all' }}>{ad.linkUrl}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setEditingAd(ad)} style={{ padding: "7px 16px", background: "#f0f6ff", color: "#1a73e8", border: "1px solid #c7deff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Edit</button>
                                <button onClick={() => deleteAd(ad.id, adView)} style={{ padding: "7px 14px", background: "#fff0f0", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

function AdForm({ ad, type, onSave, onCancel, saving }) {
    const [imageUrl, setImageUrl] = useState(ad?.imageUrl || "");
    const [linkUrl, setLinkUrl] = useState(ad?.linkUrl || "");

    return (
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#222", marginBottom: 14 }}>{ad?.id ? 'Edit' : 'Add'} {type === 'banner' ? 'Banner Ad' : 'Carousel Slide'}</h2>
            <label style={S.label}>Image URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={S.input} placeholder="https://..." />
            <label style={S.label}>Link URL (optional)</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} style={S.input} placeholder="https://..." />
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={() => onSave({ ...ad, imageUrl, linkUrl })} disabled={saving} style={{
                    flex: 1, padding: "11px", background: "#1a73e8", color: "#fff",
                    border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
                    cursor: "pointer", opacity: saving ? 0.7 : 1
                }}>{saving ? "Saving..." : "💾 Save Ad"}</button>
                <button onClick={onCancel} style={{
                    padding: "11px 20px", background: "#f0f2f5", color: "#555",
                    border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer"
                }}>Cancel</button>
            </div>
        </div>
    );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────
function AdminPanel() {
  const [matches,setMatches] = useState([]);
  const [showForm,setShowForm] = useState(false);
  const [editing,setEditing]   = useState(null);
  const [saving,setSaving]     = useState(false);
  const [deleting,setDeleting] = useState(null);
  const [search,setSearch]     = useState("");
  const [showManager, setShowManager] = useState("matches"); // 'matches', 'pages', 'menu', 'ads'
  const [pages, setPages] = useState([]);
  const [editingPage, setEditingPage] = useState(null);
  const [savingPage, setSavingPage] = useState(false);
  const [deletingPage, setDeletingPage] = useState(null);
  const [visits, setVisits] = useState({ total: 0, today: 0 });

  useEffect(()=>{
    const q = query(collection(db,"matches"), orderBy("matchDate","asc"));
    const unsub = onSnapshot(q, snap => setMatches(snap.docs.map(d=>({id:d.id,...d.data()}))));
    
    const qPages = query(collection(db, "pages"), orderBy("title", "asc"));
    const unsubPages = onSnapshot(qPages, snap => setPages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const today = new Date().toISOString().split('T')[0];
    const unsubTotal = onSnapshot(doc(db, "visits", "total"), (doc) => {
        setVisits(v => ({ ...v, total: doc.exists() ? doc.data().count : 0 }));
    });
    const unsubToday = onSnapshot(doc(db, "visits", today), (doc) => {
        setVisits(v => ({ ...v, today: doc.exists() ? doc.data().count : 0 }));
    });


    return () => { unsub(); unsubPages(); unsubTotal(); unsubToday(); };
  },[]);

  const save = async (form) => {
    setSaving(true);
    try {
      const data = {
        ...form,
        homeScore: form.homeScore !== "" ? Number(form.homeScore) : null,
        awayScore: form.awayScore !== "" ? Number(form.awayScore) : null,
        streams: form.streams.filter(s => s.url.trim()),
        updatedAt: serverTimestamp()
      };
      if (editing) await updateDoc(doc(db,"matches",editing.id), data);
      else         await addDoc(collection(db,"matches"), {...data, createdAt:serverTimestamp()});
      setShowForm(false); setEditing(null);
    } catch(e){ alert("Error: "+e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this match?")) return;
    setDeleting(id);
    try { await deleteDoc(doc(db,"matches",id)); } catch(e){ alert(e.message); }
    setDeleting(null);
  };

  const savePage = async (pageData) => {
    setSavingPage(true);
    try {
      const { id, ...data } = pageData;
      const slug = id || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const docRef = doc(db, "pages", slug);
      await setDoc(docRef, data, { merge: true });
      setEditingPage(null);
    } catch (e) {
      alert("Error saving page: " + e.message);
    }
    setSavingPage(false);
  };

  const deletePage = async (pageId) => {
    if (!window.confirm("Are you sure you want to delete this page?")) return;
    setDeletingPage(pageId);
    try {
      await deleteDoc(doc(db, "pages", pageId));
    } catch (e) {
      alert("Error deleting page: " + e.message);
    }
    setDeletingPage(null);
  };


  const filtered = matches.filter(m =>
    !search ||
    m.homeTeam?.toLowerCase().includes(search.toLowerCase()) ||
    m.awayTeam?.toLowerCase().includes(search.toLowerCase()) ||
    m.league?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label:"Total",    value:matches.length,                                 icon:"🏟️", color:"#1a73e8" },
    { label:"Live",     value:matches.filter(m=>m.status==="live").length,    icon:"🔴", color:"#ef4444" },
    { label:"Upcoming", value:matches.filter(m=>m.status==="upcoming").length,icon:"⏳", color:"#f59e0b" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f0f2f5", fontFamily:"'Segoe UI',sans-serif" }}>

      {/* Top Bar */}
      <div style={{ background:"#0f0f1a", color:"#fff", padding:"13px 20px", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 12px rgba(0,0,0,0.3)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontWeight:800, fontSize:18, letterSpacing:1 }}>
          <span style={{ color:"#e53e3e" }}>FALCON</span><span style={{ color:"#4da6ff" }}>SPORTS</span>
          <span style={{ fontSize:12, color:"#666", marginLeft:10, fontWeight:400 }}>Admin</span>
        </div>
        <button onClick={()=>signOut(auth)} style={{ background:"rgba(255,255,255,0.08)", color:"#ccc", border:"1px solid rgba(255,255,255,0.15)", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>Sign Out</button>
      </div>

      <div style={{ maxWidth:920, margin:"0 auto", padding:"20px 16px" }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: '#fff', padding: 5, borderRadius: 10, boxShadow:"0 1px 6px rgba(0,0,0,0.06)", flexWrap: 'wrap' }}>
          <button onClick={() => setShowManager('matches')} style={{ flex: 1, padding: '8px 4px', borderRadius: 7, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', background: showManager === 'matches' ? '#1a73e8' : 'transparent', color: showManager === 'matches' ? '#fff' : '#666', transition: 'all 0.2s', minWidth: 100 }}>
            🏟️ Matches
          </button>
          <button onClick={() => setShowManager('pages')} style={{ flex: 1, padding: '8px 4px', borderRadius: 7, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', background: showManager === 'pages' ? '#1a73e8' : 'transparent', color: showManager === 'pages' ? '#fff' : '#666', transition: 'all 0.2s', minWidth: 100 }}>
            📄 Pages
          </button>
          <button onClick={() => setShowManager('menu')} style={{ flex: 1, padding: '8px 4px', borderRadius: 7, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', background: showManager === 'menu' ? '#1a73e8' : 'transparent', color: showManager === 'menu' ? '#fff' : '#666', transition: 'all 0.2s', minWidth: 100 }}>
            🔗 Menu
          </button>
          <button onClick={() => setShowManager('ads')} style={{ flex: 1, padding: '8px 4px', borderRadius: 7, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', background: showManager === 'ads' ? '#1a73e8' : 'transparent', color: showManager === 'ads' ? '#fff' : '#666', transition: 'all 0.2s', minWidth: 100 }}>
            📢 Ads
          </button>
        </div>
        
        {showManager === 'matches' && (
          <>
            {/* Visitor Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📈</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#1a73e8" }}>{visits.total}</div>
                    <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Total Visits</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📅</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a" }}>{visits.today}</div>
                    <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Today's Visits</div>
                </div>
            </div>
            {/* Match Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
              {stats.map(s=>(
                <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"16px", boxShadow:"0 1px 6px rgba(0,0,0,0.06)", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:12, color:"#888", fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            {showForm ? (
              <div style={{ background:"#fff", borderRadius:14, padding:"22px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)", marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:800, color:"#222", marginBottom:14 }}>
                  {editing ? "✏️ Edit Match" : "➕ Add New Match"}
                </h2>
                <MatchForm
                  initial={editing ? {
                    ...editing,
                    homeScore: editing.homeScore ?? "",
                    awayScore: editing.awayScore ?? "",
                    streams: editing.streams?.length ? editing.streams : [{ label:"Main Stream", url: editing.streamLink||"", type:"auto" }],
                  } : emptyMatch}
                  onSave={save}
                  onCancel={()=>{ setShowForm(false); setEditing(null); }}
                  saving={saving}
                />
              </div>
            ) : (
              <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                <button onClick={()=>{ setShowForm(true); setEditing(null); }} style={{
                  padding:"11px 20px", background:"#1a73e8", color:"#fff",
                  border:"none", borderRadius:10, fontWeight:700, fontSize:14,
                  cursor:"pointer", boxShadow:"0 2px 8px rgba(26,115,232,0.3)", whiteSpace:"nowrap"
                }}>➕ Add Match</button>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search team or league..."
                  style={{ ...S.input, flex:1 }} />
              </div>
            )}

            {/* Match List */}
            {filtered.map(m => {
              const so = statusOptions.find(s=>s.value===m.status)||statusOptions[0];
              const streamCount = m.streams?.filter(s=>s.url)?.length || (m.streamLink ? 1 : 0);
              return (
                <div key={m.id} style={{
                  background:"#fff", borderRadius:12, padding:"13px 16px",
                  marginBottom:10, boxShadow:"0 1px 6px rgba(0,0,0,0.06)",
                  display:"flex", alignItems:"center", gap:12, flexWrap:"wrap"
                }}>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#111" }}>
                      {m.homeTeam} <span style={{ color:"#bbb", fontWeight:400 }}>vs</span> {m.awayTeam}
                    </div>
                    <div style={{ fontSize:12, color:"#888", marginTop:3 }}>
                      {m.sport} | {m.league}
                      {m.matchDate && <span> · {new Date(m.matchDate).toLocaleString("en-GB",{ day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</span>}
                    </div>
                    {streamCount > 0 && (
                      <div style={{ fontSize:11, color:"#1a73e8", marginTop:3, fontWeight:600 }}>
                        📡 {streamCount} stream{streamCount>1?"s":""} configured
                      </div>
                    )}
                    {m.status==="live" && m.homeScore!=null && (
                      <div style={{ fontWeight:800, color:"#ef4444", fontSize:15, marginTop:3 }}>
                        {m.homeScore} – {m.awayScore}
                      </div>
                    )}
                  </div>

                  <span style={{ background:so.color+"18", color:so.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
                    {so.label}
                  </span>

                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{ setEditing(m); setShowForm(true); window.scrollTo(0,0); }} style={{
                      padding:"7px 16px", background:"#f0f6ff", color:"#1a73e8",
                      border:"1px solid #c7deff", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer"
                    }}>Edit</button>
                    <button onClick={()=>del(m.id)} disabled={deleting===m.id} style={{
                      padding:"7px 14px", background:"#fff0f0", color:"#dc2626",
                      border:"1px solid #fecaca", borderRadius:8, fontWeight:700, fontSize:13,
                      cursor:"pointer", opacity:deleting===m.id?0.6:1
                    }}>{deleting===m.id?"...":"Delete"}</button>
                  </div>
                </div>
              );
            })}

            {filtered.length===0 && !showForm && (
              <div style={{ textAlign:"center", padding:40, background:"#fff", borderRadius:12, color:"#aaa" }}>
                <div style={{ fontSize:40 }}>🏟️</div>
                <div style={{ marginTop:8, fontWeight:600 }}>No matches yet. Add your first one!</div>
              </div>
            )}
          </>
        )}

        {showManager === 'pages' && (
          <div>
            {editingPage ? (
              <PageEditor
                page={editingPage}
                onSave={savePage}
                onCancel={() => setEditingPage(null)}
                saving={savingPage}
              />
            ) : (
              <>
                <button onClick={() => setEditingPage({ title: '', content: '' })} style={{
                  padding:"11px 20px", background:"#1a73e8", color:"#fff",
                  border:"none", borderRadius:10, fontWeight:700, fontSize:14,
                  cursor:"pointer", marginBottom:16, boxShadow:"0 2px 8px rgba(26,115,232,0.3)"
                }}>➕ Add New Page</button>

                {pages.map(p => (
                  <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: "13px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>/{p.id}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                       <button onClick={() => setEditingPage(p)} style={{ padding: "7px 16px", background: "#f0f6ff", color: "#1a73e8", border: "1px solid #c7deff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Edit</button>
                       <button onClick={() => deletePage(p.id)} disabled={deletingPage === p.id} style={{ padding: "7px 14px", background: "#fff0f0", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: deletingPage === p.id ? 0.6 : 1 }}>{deletingPage === p.id ? "..." : "Delete"}</button>
                    </div>
                  </div>
                ))}
                 {pages.length===0 && (
                  <div style={{ textAlign:"center", padding:40, background:"#fff", borderRadius:12, color:"#aaa" }}>
                    <div style={{ fontSize:40 }}>📄</div>
                    <div style={{ marginTop:8, fontWeight:600 }}>No pages yet. Add your first one!</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {showManager === 'menu' && <MenuManager />}
        {showManager === 'ads' && <AdManager />}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    return onAuthStateChanged(auth, u=>{ setUser(u); setLoading(false); });
  },[]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#aaa", fontFamily:"sans-serif" }}>
      Loading...
    </div>
  );

  return user ? <AdminPanel /> : <LoginPage />;
}
