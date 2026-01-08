"use client";
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; 
import { 
  collection, addDoc, query, where, onSnapshot, orderBy, 
  doc, setDoc, getDoc 
} from "firebase/firestore";
import { 
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged 
} from "firebase/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// --- ICONS (SVG) ---
const Icons = {
  Google: () => <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2 6.5 2 12s4.42 10 10 10c5.05 0 9.14-3.47 9.14-9.14 0-.46-.05-.81-.05-.81z"/></svg>,
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Time: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Crypto: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
};

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

export default function AdvertiserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>({ wallet: { current_balance: 0 } });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Data
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [adminConfig, setAdminConfig] = useState<any>({});

  // Forms
  const [depositForm, setDepositForm] = useState({ amount: "", method: "bkash", trnxId: "" });
  const [adForm, setAdForm] = useState({ 
    title: "", imageUrl: "", link: "", type: "CPC", rate: "2.0", budget: "500",
    countries: [] as string[], devices: [] as string[]
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  };

  // --- AUTH & DATA SYNC ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user doc exists
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, { 
                uid: currentUser.uid, 
                email: currentUser.email, 
                wallet: { current_balance: 0, total_deposited: 0 } 
            });
        }
        
        // Listeners
        onSnapshot(userRef, (doc) => setUserData(doc.data()));
        
        const qCam = query(collection(db, "campaigns"), where("uid", "==", currentUser.uid), orderBy("created_at", "desc"));
        onSnapshot(qCam, (snap) => setCampaigns(snap.docs.map(d => ({id: d.id, ...d.data()}))));

        const qDep = query(collection(db, "deposits"), where("user_id", "==", currentUser.uid), orderBy("timestamp", "desc"));
        onSnapshot(qDep, (snap) => setDeposits(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });

    // Get Admin Config
    onSnapshot(doc(db, "ad_config", "global_settings"), (doc) => {
        if(doc.exists()) setAdminConfig(doc.data());
    });

    return () => unsubAuth();
  }, []);

  // --- HANDLERS ---
  const handleLogin = async () => {
    try {
        await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) { showToast(error.message, "error"); }
  };

  const handleDeposit = async () => {
    if(!depositForm.amount || !depositForm.trnxId) return showToast("Fill all fields", "error");
    if(Number(depositForm.amount) < (adminConfig.min_deposit || 50)) return showToast(`Minimum deposit ${adminConfig.min_deposit} TK`, "error");
    
    setLoading(true);
    try {
        await addDoc(collection(db, "deposits"), {
            user_id: user.uid,
            email: user.email,
            amount: Number(depositForm.amount),
            method: depositForm.method,
            trx_id: depositForm.trnxId,
            status: "pending",
            timestamp: new Date()
        });
        showToast("Deposit submitted! Wait for approval.", "success");
        setDepositForm({ ...depositForm, amount: "", trnxId: "" });
        setActiveTab("transactions");
    } catch (e) { showToast("Error submitting deposit", "error"); }
    setLoading(false);
  };

  const handleCreateAd = async () => {
    if(!adForm.title || !adForm.imageUrl || !adForm.link) return showToast("Fill required fields", "error");
    if(userData.wallet.current_balance < Number(adForm.budget)) return showToast("Insufficient Balance!", "error");

    setLoading(true);
    try {
        await addDoc(collection(db, "campaigns"), {
            uid: user.uid,
            title: adForm.title,
            banner_url: adForm.imageUrl,
            target_url: adForm.link,
            ad_model: adForm.type,
            bid_rate: Number(adForm.rate),
            total_budget: Number(adForm.budget),
            spent_amount: 0,
            status: "pending",
            targeting: {
                countries: adForm.countries.length > 0 ? adForm.countries : ["All"],
                devices: adForm.devices.length > 0 ? adForm.devices : ["All"],
            },
            analytics: { views: 0, clicks: 0, ctr: "0%" },
            created_at: new Date()
        });
        showToast("Campaign Created!", "success");
        setActiveTab("campaigns");
    } catch (e) { showToast("Error creating campaign", "error"); }
    setLoading(false);
  };

  // --- LOGIN PAGE ---
  if (!user) return (
    <div className="min-h-screen bg-[#050b14] flex items-center justify-center p-4">
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
        <div className="bg-[#111827] p-8 rounded-2xl border border-gray-800 text-center max-w-sm w-full">
            <h1 className="text-2xl font-bold text-white mb-2">Advertiser Login</h1>
            <p className="text-gray-500 text-sm mb-6">Promote your brand on ToffeePro Network</p>
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition">
                <Icons.Google /> Sign in with Google
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans p-4 md:p-8 pb-24">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8 bg-[#18181b] p-4 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
                {user.email[0].toUpperCase()}
            </div>
            <div>
                <h1 className="text-lg font-bold text-white">Dashboard</h1>
                <p className="text-xs text-gray-500">{user.email}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block bg-black/40 px-4 py-2 rounded-lg border border-gray-700">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Wallet</p>
                <p className="text-lg font-black text-green-400">৳ {userData?.wallet?.current_balance.toFixed(2)}</p>
            </div>
            <button onClick={()=>signOut(auth)} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"><Icons.Logout/></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Navigation */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {[
                {id: "dashboard", label: "Overview", icon: <Icons.Chart/>},
                {id: "campaigns", label: "My Campaigns", icon: <Icons.Chart/>}, // Reused icon or add new
                {id: "new_ad", label: "Create Ad", icon: <Icons.Plus/>},
                {id: "deposit", label: "Add Funds", icon: <Icons.Wallet/>},
                {id: "transactions", label: "Transactions", icon: <Icons.Time/>}
            ].map(tab => (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold whitespace-nowrap transition ${activeTab===tab.id ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20" : "bg-[#18181b] text-gray-400 hover:text-white hover:bg-[#202024]"}`}>
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
            
            {/* --- DASHBOARD & ANALYTICS --- */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                            <h3 className="text-xs text-gray-500 uppercase font-bold">Total Spent</h3>
                            <p className="text-3xl font-black text-red-400 mt-2">৳ {campaigns.reduce((a,b)=>a+(b.spent_amount||0),0)}</p>
                        </div>
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                            <h3 className="text-xs text-gray-500 uppercase font-bold">Total Impressions</h3>
                            <p className="text-3xl font-black text-blue-400 mt-2">{campaigns.reduce((a,b)=>a+(b.analytics?.views||0),0)}</p>
                        </div>
                        <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                            <h3 className="text-xs text-gray-500 uppercase font-bold">Active Ads</h3>
                            <p className="text-3xl font-black text-green-400 mt-2">{campaigns.filter(c=>c.status==='active').length}</p>
                        </div>
                    </div>

                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 h-80">
                        <h3 className="text-sm font-bold text-white mb-4">Performance Overview</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={campaigns.map(c => ({name: c.title.substring(0,10), Views: c.analytics?.views || 0, Clicks: c.analytics?.clicks || 0}))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                                <YAxis stroke="#71717a" fontSize={12} />
                                <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px'}} />
                                <Bar dataKey="Views" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Clicks" fill="#a855f7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* --- CAMPAIGNS LIST --- */}
            {activeTab === 'campaigns' && (
                <div className="space-y-4 animate-fadeIn">
                    <h2 className="text-xl font-bold text-white mb-4">My Campaigns</h2>
                    {campaigns.length === 0 ? <div className="text-gray-500 text-center py-10 bg-[#18181b] rounded-2xl border border-dashed border-gray-800">No campaigns found.</div> : campaigns.map(cam => (
                        <div key={cam.id} className="bg-[#18181b] p-5 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-5 items-start md:items-center">
                            <img src={cam.banner_url} className="w-full md:w-32 h-20 bg-black object-cover rounded-lg border border-gray-700"/>
                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{cam.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${cam.status==='active'?'bg-green-500/20 text-green-400':cam.status==='pending'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'}`}>{cam.status}</span>
                                            <span className="text-xs text-gray-500 font-mono">{cam.ad_model} • Rate: {cam.bid_rate}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-cyan-400">{cam.analytics?.views || 0} <span className="text-gray-500 text-xs font-normal">Views</span></p>
                                        <p className="text-sm font-bold text-purple-400">{cam.analytics?.clicks || 0} <span className="text-gray-500 text-xs font-normal">Clicks</span></p>
                                    </div>
                                </div>
                                <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-cyan-500 h-full rounded-full" style={{width: `${Math.min((cam.spent_amount / cam.total_budget) * 100, 100)}%`}}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                    <span>Spent: {cam.spent_amount} TK</span>
                                    <span>Budget: {cam.total_budget} TK</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- CREATE NEW AD --- */}
            {activeTab === 'new_ad' && (
                <div className="bg-[#18181b] p-6 md:p-8 rounded-2xl border border-gray-800 animate-fadeIn">
                    <h2 className="text-xl font-bold text-cyan-400 mb-6">Create New Campaign</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-500 uppercase font-bold">Title</label><input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-cyan-500 transition" placeholder="e.g. Best Betting Site" onChange={e=>setAdForm({...adForm, title: e.target.value})}/></div>
                            <div><label className="text-xs text-gray-500 uppercase font-bold">Banner URL</label><input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-cyan-500 transition" placeholder="https://..." onChange={e=>setAdForm({...adForm, imageUrl: e.target.value})}/></div>
                            <div><label className="text-xs text-gray-500 uppercase font-bold">Target Link</label><input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-cyan-500 transition" placeholder="https://..." onChange={e=>setAdForm({...adForm, link: e.target.value})}/></div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs text-gray-500 uppercase font-bold">Ad Model</label><select className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-cyan-500 transition" onChange={e=>setAdForm({...adForm, type: e.target.value})}><option value="CPC">CPC (Click)</option><option value="PPV">PPV (View)</option></select></div>
                                <div><label className="text-xs text-gray-500 uppercase font-bold">Bid Rate (TK)</label><input type="number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-cyan-500 transition" value={adForm.rate} onChange={e=>setAdForm({...adForm, rate: e.target.value})}/></div>
                            </div>
                            <div><label className="text-xs text-gray-500 uppercase font-bold">Total Budget (TK)</label><input type="number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-cyan-500 transition" value={adForm.budget} onChange={e=>setAdForm({...adForm, budget: e.target.value})}/></div>
                            
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Target Country</label>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {['All', 'BD', 'IN', 'US', 'UK'].map(c => (
                                        <button key={c} onClick={()=>setAdForm({...adForm, countries: [c]})} className={`px-3 py-1 rounded text-xs border ${adForm.countries.includes(c) ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}>{c}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleCreateAd} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl mt-8 transition shadow-lg">{loading ? "Creating..." : "Submit Campaign"}</button>
                </div>
            )}

            {/* --- DEPOSIT --- */}
            {activeTab === 'deposit' && (
                <div className="bg-[#18181b] p-6 md:p-8 rounded-2xl border border-gray-800 animate-fadeIn">
                    <h2 className="text-xl font-bold text-green-400 mb-6">Add Funds to Wallet</h2>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {['bkash', 'nagad', 'binance'].map(method => (
                            <div key={method} onClick={()=>setDepositForm({...depositForm, method})} className={`p-4 rounded-xl border cursor-pointer transition ${depositForm.method === method ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-black hover:bg-gray-900'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="uppercase font-bold text-sm text-gray-300">{method}</h3>
                                    {depositForm.method === method && <Icons.Check/>}
                                </div>
                                <div className="flex items-center gap-2 bg-gray-900 p-2 rounded border border-gray-800">
                                    <p className="text-xs text-gray-400 break-all font-mono">{adminConfig?.payment_info?.[method] || "Not Set"}</p>
                                    <button onClick={(e)=>{e.stopPropagation(); copyToClipboard(adminConfig?.payment_info?.[method])}} className="text-gray-500 hover:text-white"><Icons.Copy/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 max-w-lg mx-auto">
                        <input type="number" className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white text-center text-xl font-bold outline-none focus:border-green-500 transition" placeholder="Amount (e.g. 500)" onChange={e=>setDepositForm({...depositForm, amount: e.target.value})}/>
                        <input className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white text-center outline-none focus:border-green-500 transition" placeholder="Transaction ID (TrxID) / Wallet Address" onChange={e=>setDepositForm({...depositForm, trnxId: e.target.value})}/>
                        <button onClick={handleDeposit} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition shadow-lg">{loading ? "Processing..." : "Verify Payment"}</button>
                    </div>
                </div>
            )}

            {/* --- TRANSACTIONS --- */}
            {activeTab === 'transactions' && (
                <div className="space-y-3 animate-fadeIn">
                    <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>
                    {deposits.length === 0 ? <div className="text-gray-500">No transactions found.</div> : deposits.map(dep => (
                        <div key={dep.id} className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                            <div>
                                <span className="block font-bold text-white text-lg">৳ {dep.amount}</span>
                                <span className="text-xs text-gray-500 uppercase font-mono">{dep.method} • {dep.trx_id}</span>
                            </div>
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${dep.status==='approved'?'bg-green-500/10 text-green-400':dep.status==='rejected'?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{dep.status}</span>
                        </div>
                    ))}
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
