"use client";
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { 
  collection, addDoc, query, where, onSnapshot, orderBy, 
  doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged 
} from "firebase/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- PRO SVG ICONS ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Campaign: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  Wallet: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Add: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Google: () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2 6.5 2 12s4.42 10 10 10c5.05 0 9.14-3.47 9.14-9.14 0-.46-.05-.81-.05-.81z"/></svg>,
  Logout: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Pause: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Play: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

export default function AdvertiserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>({ wallet: { current_balance: 0 } });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [adminConfig, setAdminConfig] = useState<any>({});

  // Forms
  const [depositForm, setDepositForm] = useState({ amount: "", method: "bkash", trnxId: "" });
  const [adForm, setAdForm] = useState({ 
    title: "", imageUrl: "", link: "", type: "CPC", rate: "2.0", budget: "500",
    countries: [] as string[], devices: [] as string[]
  });

  // --- REALTIME DATA SYNC ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. User Wallet Sync
        const userRef = doc(db, "users", currentUser.uid);
        onSnapshot(userRef, (docSnap) => {
            if(docSnap.exists()) setUserData(docSnap.data());
            else setDoc(userRef, { uid: currentUser.uid, email: currentUser.email, wallet: { current_balance: 0 } });
        });

        // 2. Campaigns Sync (Without OrderBy first to fix index issue)
        const qCam = query(collection(db, "campaigns"), where("uid", "==", currentUser.uid));
        onSnapshot(qCam, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            // Sort manually in client side
            setCampaigns(data.sort((a: any, b: any) => b.created_at?.seconds - a.created_at?.seconds));
        });

        // 3. Deposits Sync
        const qDep = query(collection(db, "deposits"), where("user_id", "==", currentUser.uid));
        onSnapshot(qDep, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setDeposits(data.sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds));
        });
      }
    });

    // Admin Config
    onSnapshot(doc(db, "ad_config", "global_settings"), (doc) => {
        if(doc.exists()) setAdminConfig(doc.data());
    });

    return () => unsubAuth();
  }, []);

  // --- ACTIONS ---
  
  // 1. Campaign Control (Pause/Resume/Delete)
  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateDoc(doc(db, "campaigns", id), { status: newStatus });
  };

  const deleteCampaign = async (id: string) => {
    if(confirm("Are you sure you want to delete this campaign? This cannot be undone.")) {
        await deleteDoc(doc(db, "campaigns", id));
    }
  };

  // 2. Deposit
  const handleDeposit = async () => {
    if(!depositForm.amount || !depositForm.trnxId) return alert("Fill all fields");
    setLoading(true);
    try {
        await addDoc(collection(db, "deposits"), {
            user_id: user.uid,
            email: user.email,
            amount: Number(depositForm.amount),
            method: depositForm.method,
            trx_id: depositForm.trnxId,
            status: "pending",
            timestamp: serverTimestamp()
        });
        alert("Deposit Submitted!");
        setDepositForm({...depositForm, amount:"", trnxId:""});
        setActiveTab('transactions');
    } catch(e) { alert("Error submitting deposit"); }
    setLoading(false);
  };

  // 3. Create Ad
  const handleCreateAd = async () => {
    const currentBal = Number(userData?.wallet?.current_balance || 0);
    const budget = Number(adForm.budget);
    
    if(currentBal < budget) return alert("Insufficient Balance! Please deposit first.");
    
    setLoading(true);
    try {
        await addDoc(collection(db, "campaigns"), {
            uid: user.uid,
            title: adForm.title,
            banner_url: adForm.imageUrl,
            target_url: adForm.link,
            ad_model: adForm.type,
            bid_rate: Number(adForm.rate),
            total_budget: budget,
            spent_amount: 0,
            status: "pending",
            targeting: { countries: ["All"], devices: ["All"] },
            analytics: { views: 0, clicks: 0, ctr: "0%" },
            created_at: serverTimestamp()
        });
        alert("Campaign Created!");
        setActiveTab("campaigns");
    } catch(e) { alert("Creation Failed"); }
    setLoading(false);
  };

  if (!user) return (
    <div className="min-h-screen bg-[#050b14] flex items-center justify-center">
        <button onClick={()=>signInWithPopup(auth, new GoogleAuthProvider())} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2">
            <Icons.Google/> Login with Google
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#121215] border-r border-gray-800 flex flex-col md:h-screen sticky top-0 z-50">
         <div className="p-6 border-b border-gray-800">
             <h2 className="text-xl font-bold text-white">Advertiser<span className="text-cyan-500">Panel</span></h2>
             <p className="text-xs text-gray-500 mt-1">{user.email}</p>
         </div>
         <nav className="flex-1 p-4 space-y-2">
             {[ 
               {id: "dashboard", label: "Overview", icon: <Icons.Dashboard/>},
               {id: "campaigns", label: "My Campaigns", icon: <Icons.Campaign/>},
               {id: "new_ad", label: "Create Ad", icon: <Icons.Add/>},
               {id: "deposit", label: "Add Funds", icon: <Icons.Wallet/>},
               {id: "transactions", label: "History", icon: <Icons.History/>}
             ].map(item => (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === item.id ? "bg-cyan-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                    {item.icon} {item.label}
                 </button>
             ))}
         </nav>
         <div className="p-4 border-t border-gray-800">
             <div className="bg-gray-900 p-4 rounded-xl mb-4 border border-gray-800">
                 <p className="text-xs text-gray-400 uppercase">Balance</p>
                 <p className="text-xl font-bold text-green-400">৳ {Number(userData?.wallet?.current_balance || 0).toFixed(2)}</p>
             </div>
             <button onClick={()=>signOut(auth)} className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-900/30 p-3 rounded-xl transition text-sm font-bold"><Icons.Logout /> Logout</button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-gray-500 text-xs font-bold uppercase">Total Spent</h3>
                        <p className="text-3xl font-black text-white mt-2">৳ {campaigns.reduce((a,b)=>a+(b.spent_amount||0),0).toFixed(2)}</p>
                    </div>
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-gray-500 text-xs font-bold uppercase">Total Views</h3>
                        <p className="text-3xl font-black text-blue-400 mt-2">{campaigns.reduce((a,b)=>a+(b.analytics?.views||0),0)}</p>
                    </div>
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-gray-500 text-xs font-bold uppercase">Total Clicks</h3>
                        <p className="text-3xl font-black text-purple-400 mt-2">{campaigns.reduce((a,b)=>a+(b.analytics?.clicks||0),0)}</p>
                    </div>
                </div>
                {/* Chart */}
                <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 h-80">
                    <h3 className="text-white font-bold mb-4">Ad Performance</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaigns.map(c=>({name:c.title.substring(0,10), v: c.analytics?.views||0, c: c.analytics?.clicks||0}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                            <Bar dataKey="v" fill="#3b82f6" name="Views" />
                            <Bar dataKey="c" fill="#a855f7" name="Clicks" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* --- CAMPAIGNS LIST (ADVANCED) --- */}
        {activeTab === 'campaigns' && (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">Manage Campaigns</h2>
                {campaigns.length === 0 ? <p className="text-gray-500">No campaigns found.</p> : campaigns.map(cam => (
                    <div key={cam.id} className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 flex justify-between items-center group hover:border-gray-700 transition">
                        <div className="flex gap-4 items-center">
                            <img src={cam.banner_url} className="w-24 h-16 object-cover rounded bg-black border border-gray-700"/>
                            <div>
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    {cam.title}
                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${cam.status==='active'?'bg-green-900 text-green-400': cam.status==='paused'?'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}`}>
                                        {cam.status}
                                    </span>
                                </h3>
                                <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                    <span>Model: <strong className="text-gray-300">{cam.ad_model}</strong></span>
                                    <span>Rate: <strong className="text-gray-300">{cam.bid_rate} TK</strong></span>
                                    <span>Spent: <strong className="text-gray-300">{cam.spent_amount} / {cam.total_budget} TK</strong></span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Stats & Actions */}
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xl font-bold text-white">{cam.analytics?.views || 0}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Views</p>
                            </div>
                            <div className="text-right border-l border-gray-700 pl-6">
                                <p className="text-xl font-bold text-white">{cam.analytics?.clicks || 0}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Clicks</p>
                            </div>
                            
                            {/* ACTION BUTTONS */}
                            <div className="flex gap-2 ml-4">
                                {cam.status !== 'pending' && cam.status !== 'rejected' && (
                                    <button onClick={()=>toggleCampaignStatus(cam.id, cam.status)} className={`p-2 rounded-lg transition ${cam.status==='active'?'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20':'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>
                                        {cam.status === 'active' ? <Icons.Pause/> : <Icons.Play/>}
                                    </button>
                                )}
                                <button onClick={()=>deleteCampaign(cam.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition">
                                    <Icons.Trash/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- CREATE AD FORM --- */}
        {activeTab === 'new_ad' && (
            <div className="max-w-3xl bg-[#18181b] p-8 rounded-2xl border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6">Start New Campaign</h2>
                <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Campaign Title</label>
                            <input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1" onChange={e=>setAdForm({...adForm, title: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Target URL</label>
                            <input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1" placeholder="https://..." onChange={e=>setAdForm({...adForm, link: e.target.value})}/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Banner Image URL</label>
                        <input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1" placeholder="https://imgur.com/..." onChange={e=>setAdForm({...adForm, imageUrl: e.target.value})}/>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                            <select className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1" onChange={e=>setAdForm({...adForm, type: e.target.value})}>
                                <option value="CPC">CPC (Per Click)</option>
                                <option value="PPV">PPV (Per View)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Rate (TK)</label>
                            <input type="number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1" value={adForm.rate} onChange={e=>setAdForm({...adForm, rate: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Total Budget</label>
                            <input type="number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1" value={adForm.budget} onChange={e=>setAdForm({...adForm, budget: e.target.value})}/>
                        </div>
                    </div>
                    <button onClick={handleCreateAd} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-bold text-white transition">{loading?"Processing...":"Launch Campaign"}</button>
                </div>
            </div>
        )}

        {/* --- DEPOSIT & HISTORY --- */}
        {activeTab === 'deposit' && (
            <div className="max-w-2xl bg-[#18181b] p-8 rounded-2xl border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6">Add Funds</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {['bkash', 'nagad', 'binance'].map(m => (
                        <div key={m} onClick={()=>setDepositForm({...depositForm, method: m})} className={`p-4 border rounded-xl cursor-pointer text-center capitalize font-bold ${depositForm.method===m ? 'border-cyan-500 bg-cyan-900/20 text-cyan-400' : 'border-gray-700 text-gray-400'}`}>
                            {m}
                        </div>
                    ))}
                </div>
                <div className="bg-gray-900 p-4 rounded-lg mb-6 border border-gray-800 text-center">
                    <p className="text-xs text-gray-500 mb-1">Send Money To</p>
                    <p className="text-lg font-mono text-white select-all">{adminConfig?.payment_info?.[depositForm.method] || "Contact Admin"}</p>
                </div>
                <input className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white mb-4" placeholder="Amount (BDT)" type="number" onChange={e=>setDepositForm({...depositForm, amount: e.target.value})}/>
                <input className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white mb-6" placeholder="Transaction ID" onChange={e=>setDepositForm({...depositForm, trnxId: e.target.value})}/>
                <button onClick={handleDeposit} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-white">Confirm Deposit</button>
            </div>
        )}

        {activeTab === 'transactions' && (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
                {deposits.map(dep => (
                    <div key={dep.id} className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                        <div>
                            <p className="text-white font-bold text-lg">৳ {dep.amount}</p>
                            <p className="text-gray-500 text-xs uppercase">{dep.method} • {dep.trx_id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${dep.status==='approved'?'bg-green-900 text-green-400':dep.status==='pending'?'bg-yellow-900 text-yellow-400':'bg-red-900 text-red-400'}`}>{dep.status}</span>
                    </div>
                ))}
            </div>
        )}

      </main>
    </div>
  );
}
