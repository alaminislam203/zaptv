"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, doc, onSnapshot, updateDoc, deleteDoc,
  runTransaction, setDoc, query, orderBy, where
} from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

// --- PRO ICONS (SVG) ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Money: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Ads: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Logout: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Pause: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Play: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
};

// --- TOAST COMPONENT ---
const Toast = ({ msg, type, onClose }: { msg: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-slideIn z-[200] ${type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' : 'bg-red-900/90 border-red-500/50 text-red-100'}`}>
    <span>{type === 'success' ? '✅' : '⚠️'}</span>
    <div>
        <h4 className="font-bold text-sm uppercase tracking-widest">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-xs opacity-90">{msg}</p>
    </div>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100">✕</button>
  </div>
);

export default function AdAdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Data
  const [deposits, setDeposits] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [config, setConfig] = useState({
    min_deposit: 100,
    rates: { min_cpc: 2.0, min_cpv: 0.20 },
    payment_info: { bkash: "", nagad: "", binance: "" }
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- AUTH ---
  useEffect(() => {
    const session = localStorage.getItem("toffee_admin_session");
    if(session === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if(username === "admin" && password === "sajid@1234") {
        localStorage.setItem("toffee_admin_session", "true");
        setIsAuthenticated(true);
        showToast("Welcome Admin!", "success");
    } else {
        showToast("Invalid Credentials", "error");
    }
  };

  const handleLogout = () => {
      localStorage.removeItem("toffee_admin_session");
      setIsAuthenticated(false);
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    if(!isAuthenticated) return;

    onSnapshot(doc(db, "ad_config", "global_settings"), (doc) => {
      if (doc.exists()) setConfig(doc.data() as any);
    });

    onSnapshot(collection(db, "deposits"), (snap) => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setDeposits(data.sort((a:any, b:any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });

    onSnapshot(collection(db, "campaigns"), (snap) => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setCampaigns(data.sort((a:any, b:any) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)));
    });

    onSnapshot(collection(db, "users"), (snap) => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setUsers(data);
    });

  }, [isAuthenticated]);

  const getUserRealBalance = (user: any) => {
      const userCampaigns = campaigns.filter(c => c.uid === user.uid);
      const totalSpent = userCampaigns.reduce((acc, c) => acc + Number(c.spent_amount || 0), 0);
      const totalDeposited = Number(user.wallet?.total_deposited || 0);
      return (totalDeposited - totalSpent).toFixed(2);
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
        await setDoc(doc(db, "ad_config", "global_settings"), config, { merge: true });
        showToast("Settings Saved Successfully!", "success");
    } catch (error) { 
        console.error(error);
        showToast("Save Failed!", "error"); 
    }
    setLoading(false);
  };

  const processDeposit = async (deposit: any, action: 'approved' | 'rejected') => {
    if(!confirm(`Confirm ${action} for ${deposit.amount} TK?`)) return;
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, "deposits", deposit.id);
        const depositDoc = await transaction.get(depositRef);
        if (!depositDoc.exists()) throw new Error("Deposit missing!");
        if (depositDoc.data().status !== 'pending' && action === 'approved') throw new Error("Already processed!");

        if (action === 'approved') {
          const userId = deposit.user_id || deposit.uid;
          const userRef = doc(db, "users", userId);
          const userDoc = await transaction.get(userRef);
          const amount = Number(deposit.amount);

          if (!userDoc.exists()) {
             transaction.set(userRef, { 
                uid: userId, email: deposit.email,
                wallet: { current_balance: amount, total_deposited: amount }
             });
          } else {
             const userData = userDoc.data();
             const newTotal = (Number(userData.wallet?.total_deposited) || 0) + amount;
             transaction.update(userRef, { 
                "wallet.total_deposited": newTotal,
                "wallet.current_balance": newTotal 
             });
          }
        }
        transaction.update(depositRef, { status: action });
      });
      showToast(`Deposit ${action}!`, "success");
    } catch (e: any) { showToast(e.message || "Error", "error"); }
    setLoading(false);
  };

  const updateCampaignStatus = async (id: string, status: string) => {
    try {
        await updateDoc(doc(db, "campaigns", id), { status });
        showToast(`Campaign marked as ${status}`, "success");
    } catch(e) { showToast("Update Failed", "error"); }
  };

  const deleteCampaign = async (id: string) => {
    if(confirm("Delete this campaign permanently?")) {
        await deleteDoc(doc(db, "campaigns", id));
        showToast("Campaign Deleted", "success");
    }
  };

  if(!isAuthenticated) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
        <div className="glass p-12 rounded-[3.5rem] border-white/5 w-full max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            <h1 className="text-3xl font-black text-white italic mb-10 tracking-tighter">Ads <span className="text-emerald-500">Portal</span></h1>
            <div className="space-y-4">
              <input className="w-full bg-slate-900 border border-white/5 p-5 rounded-[2rem] text-white outline-none font-bold text-sm text-center" placeholder="Username" onChange={e=>setUsername(e.target.value)}/>
              <input className="w-full bg-slate-900 border border-white/5 p-5 rounded-[2rem] text-white outline-none font-bold text-sm text-center" type="password" placeholder="Secret PIN" onChange={e=>setPassword(e.target.value)}/>
              <button onClick={handleLogin} className="w-full bg-emerald-500 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-emerald-400 transition-all uppercase tracking-widest text-xs mt-4">Access Panel</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row overflow-hidden">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-[#0a0a0c] border-r border-white/5 flex flex-col md:h-screen sticky top-0 z-50">
         <div className="p-8 border-b border-white/5">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
                Ads<span className="text-emerald-500">MANAGER</span>
            </h2>
         </div>
         <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
             {[ 
               {id: "dashboard", label: "Overview", icon: <Icons.Dashboard/>},
               {id: "deposits", label: "Deposits", icon: <Icons.Money/>},
               {id: "campaigns", label: "All Campaigns", icon: <Icons.Ads/>},
               {id: "users", label: "Users", icon: <Icons.Users/>}, 
               {id: "settings", label: "Settings", icon: <Icons.Settings/>}
             ].map(item => (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-white"}`}>
                    {item.icon} {item.label}
                    {item.id==='deposits' && deposits.filter(d=>d.status==='pending').length>0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 rounded-full font-black animate-pulse">{deposits.filter(d=>d.status==='pending').length}</span>}
                 </button>
             ))}
         </nav>
         <div className="p-4 border-t border-white/5">
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-4 text-red-400 hover:bg-red-500/10 p-4 rounded-2xl transition-all text-sm font-black uppercase tracking-widest"><Icons.Logout /> Logout</button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
        
        <header className="flex justify-between items-center mb-12">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                {activeTab} <span className="text-emerald-500">Center</span>
            </h1>
            {activeTab === 'settings' && (
                <button onClick={saveConfig} disabled={loading} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                    {loading ? "Saving..." : "Save Config"}
                </button>
            )}
        </header>

        {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Total Revenue" value={`৳ ${deposits.filter(d=>d.status==='approved').reduce((a,b)=>a+Number(b.amount),0)}`} color="emerald" />
                    <StatCard title="Active Ads" value={campaigns.filter(c=>c.status==='active').length} color="teal" />
                    <StatCard title="Total Users" value={users.length} color="blue" />
                    <StatCard title="Pending Ads" value={campaigns.filter(c=>c.status==='pending').length} color="amber" />
                </div>

                <div className="glass p-10 rounded-[3rem] border-white/5 h-[400px]">
                    <h3 className="text-white font-black uppercase italic text-sm tracking-widest mb-8">Deposit Growth</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={deposits.filter(d=>d.status==='approved').map((d,i)=>({name:i, amount:d.amount}))}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis stroke="#475569" fontSize={10} fontStyle="bold" />
                            <Tooltip contentStyle={{backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '1rem', fontSize: '12px'}} />
                            <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fill="url(#colorAmount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="space-y-6">
                <div className="grid gap-4">
                    {users.map(u => (
                        <div key={u.id} className="glass p-6 rounded-[2.5rem] border-white/5 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black">
                                    {u.displayName?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <p className="font-black text-white uppercase italic flex items-center gap-3">
                                        {u.displayName || "Anonymous User"}
                                        <span className="text-[10px] bg-slate-900 border border-white/5 px-3 py-1 rounded-lg font-bold text-slate-500 tracking-widest">{u.phoneNumber || "NO PHONE"}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{u.email}</p>
                                    <p className="text-[8px] text-slate-600 font-mono mt-1">UID: {u.uid}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-400 font-black text-2xl italic">৳ {getUserRealBalance(u)}</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Available Balance</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'campaigns' && (
            <div className="grid grid-cols-1 gap-4">
                {campaigns.map(cam => (
                    <div key={cam.id} className="glass p-6 rounded-[2.5rem] border-white/5 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                        <div className="flex gap-6 items-center">
                            <div className="w-24 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-white/5 shadow-xl">
                                <img src={cam.banner_url} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                                <h3 className="font-black text-white uppercase italic flex items-center gap-3">
                                    {cam.title}
                                    <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded-lg text-[8px] text-slate-500 tracking-widest">{cam.category || "GENERAL"}</span>
                                </h3>
                                <div className="flex gap-3 mt-2">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${cam.status==='active'?'bg-emerald-500/10 text-emerald-500':cam.status==='pending'?'bg-amber-500/10 text-amber-500':'bg-red-500/10 text-red-500'}`}>{cam.status}</span>
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">BID: <span className="text-slate-400">{cam.bid_rate} TK</span></span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                            {cam.status === 'pending' && (
                                <button onClick={()=>updateCampaignStatus(cam.id, 'active')} className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"><Icons.Check/></button>
                            )}
                            {cam.status === 'active' && (
                                <button onClick={()=>updateCampaignStatus(cam.id, 'paused')} className="bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"><Icons.Pause/></button>
                            )}
                            {cam.status === 'paused' && (
                                <button onClick={()=>updateCampaignStatus(cam.id, 'active')} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"><Icons.Play/></button>
                            )}
                            <button onClick={()=>deleteCampaign(cam.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl transition-all"><Icons.Trash/></button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'deposits' && (
            <div className="grid grid-cols-1 gap-4">
                {deposits.map(dep => (
                    <div key={dep.id} className="glass p-6 rounded-[2.5rem] border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Icons.Money />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white italic tracking-tighter">৳ {dep.amount}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{dep.method} • {dep.trx_id}</p>
                            </div>
                        </div>
                        {dep.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button onClick={()=>processDeposit(dep, 'approved')} className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">Approve</button>
                                <button onClick={()=>processDeposit(dep, 'rejected')} className="bg-red-500/10 text-red-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Reject</button>
                            </div>
                        ) : (
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${dep.status==='approved'?'bg-emerald-500/10 text-emerald-500':'bg-red-500/10 text-red-500'}`}>{dep.status}</span>
                        )}
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="max-w-2xl glass p-10 rounded-[3rem] border-white/5">
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <AdminInput label="Min CPC (৳)" value={config.rates.min_cpc.toString()} onChange={e=>setConfig({...config, rates:{...config.rates, min_cpc:Number(e.target.value)}})}/>
                        <AdminInput label="Min CPV (৳)" value={config.rates.min_cpv.toString()} onChange={e=>setConfig({...config, rates:{...config.rates, min_cpv:Number(e.target.value)}})}/>
                    </div>
                    <AdminInput label="Bkash Wallet Number" value={config.payment_info.bkash} onChange={e=>setConfig({...config, payment_info:{...config.payment_info, bkash:e.target.value}})}/>
                    <AdminInput label="Nagad Wallet Number" value={config.payment_info.nagad} onChange={e=>setConfig({...config, payment_info:{...config.payment_info, nagad:e.target.value}})}/>
                    <AdminInput label="Binance ID / USDT Wallet" value={config.payment_info.binance} onChange={e=>setConfig({...config, payment_info:{...config.payment_info, binance:e.target.value}})}/>
                    <div className="pt-4">
                        <button onClick={saveConfig} disabled={loading} className="w-full bg-emerald-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-white hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20">{loading?"Saving Changes...":"Save Settings"}</button>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

const StatCard = ({ title, value, color }: any) => (
    <div className="glass p-8 rounded-[2.5rem] border-white/5">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{title}</p>
        <p className={`text-3xl font-black italic ${color === 'emerald' ? 'text-emerald-500' : color === 'teal' ? 'text-teal-400' : color === 'blue' ? 'text-blue-400' : 'text-amber-500'}`}>{value}</p>
    </div>
);

const AdminInput = ({ label, value, onChange }: { label: string, value: string, onChange: (e: any) => void }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">{label}</label>
    <input
      className="w-full bg-slate-900 border border-white/5 p-5 rounded-[2rem] text-white font-bold text-sm outline-none focus:border-emerald-500/50 transition-all shadow-inner"
      value={value}
      onChange={onChange}
    />
  </div>
);
