"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; // পাথ ঠিক আছে কিনা চেক করুন
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
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
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
  <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-slideIn z-[200] ${type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-100' : 'bg-red-900/90 border-red-500/50 text-red-100'}`}>
    <span>{type === 'success' ? '✅' : '⚠️'}</span>
    <div>
        <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
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
    const session = localStorage.getItem("admin_session");
    if(session === "valid_token_v4") setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if(username === "admin" && password === "sajid@1234") {
        localStorage.setItem("admin_session", "valid_token_v4");
        setIsAuthenticated(true);
        showToast("Welcome Admin!", "success");
    } else {
        showToast("Invalid Credentials", "error");
    }
  };

  // --- DATA FETCHING (Indexed Fix) ---
  useEffect(() => {
    if(!isAuthenticated) return;

    // 1. Config Fetch
    onSnapshot(doc(db, "ad_config", "global_settings"), (doc) => {
      if (doc.exists()) setConfig(doc.data() as any);
    });

    // 2. Deposits (No OrderBy initially to prevent crash if index missing)
    onSnapshot(collection(db, "deposits"), (snap) => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        // Client-side sorting for safety
        setDeposits(data.sort((a:any, b:any) => b.timestamp?.seconds - a.timestamp?.seconds));
    });

    // 3. Campaigns
    onSnapshot(collection(db, "campaigns"), (snap) => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setCampaigns(data.sort((a:any, b:any) => b.created_at?.seconds - a.created_at?.seconds));
    });

    // 4. Users (With Profile Data)
    onSnapshot(collection(db, "users"), (snap) => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setUsers(data);
    });

  }, [isAuthenticated]);

  // --- HELPERS ---
  // 🔥 Real Balance Calculation for Admin View
  const getUserRealBalance = (user: any) => {
      // Find all campaigns by this user
      const userCampaigns = campaigns.filter(c => c.uid === user.uid);
      // Calculate total spent
      const totalSpent = userCampaigns.reduce((acc, c) => acc + Number(c.spent_amount || 0), 0);
      // Total Deposited (from User Wallet)
      const totalDeposited = Number(user.wallet?.total_deposited || 0);
      
      return (totalDeposited - totalSpent).toFixed(2);
  };

  // --- ACTIONS ---
  
  // 1. Save Settings (Fixed Logic)
  const saveConfig = async () => {
    setLoading(true);
    try {
        // Use setDoc with merge: true to prevent overwriting
        await setDoc(doc(db, "ad_config", "global_settings"), config, { merge: true });
        showToast("Settings Saved Successfully!", "success");
    } catch (error) { 
        console.error(error);
        showToast("Save Failed!", "error"); 
    }
    setLoading(false);
  };

  // 2. Process Deposit
  const processDeposit = async (deposit: any, action: 'approved' | 'rejected') => {
    if(!confirm(`Confirm ${action} for ${deposit.amount} TK?`)) return;
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, "deposits", deposit.id);
        const depositDoc = await transaction.get(depositRef);
        if (!depositDoc.exists()) throw "Deposit missing!";
        if (depositDoc.data().status !== 'pending' && action === 'approved') throw "Already processed!";

        if (action === 'approved') {
          const userId = deposit.user_id || deposit.uid;
          const userRef = doc(db, "users", userId);
          const userDoc = await transaction.get(userRef);
          const amount = Number(deposit.amount);

          if (!userDoc.exists()) {
             // Create User Doc if missing
             transaction.set(userRef, { 
                uid: userId, email: deposit.email,
                wallet: { current_balance: amount, total_deposited: amount }
             });
          } else {
             const userData = userDoc.data();
             // Note: current_balance in DB is technically 'Total Deposited' in our new logic
             // But we keep it updated for reference.
             const newTotal = (Number(userData.wallet?.total_deposited) || 0) + amount;
             
             transaction.update(userRef, { 
                "wallet.total_deposited": newTotal,
                // We update current_balance too, just as a backup
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

  // 3. Campaign Control
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

  // --- LOGIN UI ---
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-[#0a0a0c] border-r border-white/5 flex flex-col md:h-screen sticky top-0 z-50">
         <div className="p-8 border-b border-white/5">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
                Ads<span className="text-emerald-500">MANAGER</span>
            </h2>
         </div>
         <nav className="flex-1 p-4 space-y-2 mt-4">
             {[ 
               {id: "dashboard", label: "Overview", icon: <Icons.Dashboard/>},
               {id: "deposits", label: "Deposits", icon: <Icons.Money/>},
               {id: "campaigns", label: "All Campaigns", icon: <Icons.Ads/>},
               {id: "users", label: "Users", icon: <Icons.Users/>}, 
               {id: "settings", label: "Settings", icon: <Icons.Settings/>}
             ].map(item => (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-white"}`}>
                    {item.icon} {item.label}
                    {item.id==='deposits' && deposits.filter(d=>d.status==='pending').length>0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 rounded-full font-black">{deposits.filter(d=>d.status==='pending').length}</span>}
                 </button>
             ))}
         </nav>
         <div className="p-4 border-t border-gray-800">
             <button onClick={()=>setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-900/30 p-3 rounded-xl transition text-sm font-bold"><Icons.Logout /> Logout</button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass p-8 rounded-[2.5rem] border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Revenue</h3>
                        <p className="text-3xl font-black text-emerald-500 italic mt-2">৳ {deposits.filter(d=>d.status==='approved').reduce((a,b)=>a+Number(b.amount),0)}</p>
                    </div>
                    <div className="glass p-8 rounded-[2.5rem] border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Ads</h3>
                        <p className="text-3xl font-black text-teal-400 italic mt-2">{campaigns.filter(c=>c.status==='active').length}</p>
                    </div>
                    <div className="glass p-8 rounded-[2.5rem] border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Users</h3>
                        <p className="text-3xl font-black text-blue-400 italic mt-2">{users.length}</p>
                    </div>
                    <div className="glass p-8 rounded-[2.5rem] border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Ads</h3>
                        <p className="text-3xl font-black text-amber-500 italic mt-2">{campaigns.filter(c=>c.status==='pending').length}</p>
                    </div>
                </div>

                <div className="glass p-10 rounded-[3rem] border-white/5 h-96">
                    <h3 className="text-white font-bold mb-4">Deposit Growth</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={deposits.filter(d=>d.status==='approved').map((d,i)=>({name:i, amount:d.amount}))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" hide />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                            <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* --- USERS TAB (FIXED NAME & BALANCE) --- */}
        {activeTab === 'users' && (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">All Users</h2>
                <div className="grid gap-4">
                    {users.map(u => (
                        <div key={u.id} className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex justify-between items-center group hover:border-indigo-500/30">
                            <div>
                                <p className="font-bold text-white flex items-center gap-2">
                                    {u.displayName || "No Name"} 
                                    <span className="text-[10px] bg-gray-800 px-2 rounded font-normal text-gray-400">{u.phoneNumber || ""}</span>
                                </p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                                <p className="text-[10px] text-gray-600 font-mono mt-1">ID: {u.uid}</p>
                            </div>
                            <div className="text-right">
                                {/* 🔥 Real-time calculated balance */}
                                <p className="text-green-400 font-bold text-xl">৳ {getUserRealBalance(u)}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Available Balance</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- CAMPAIGNS TAB --- */}
        {activeTab === 'campaigns' && (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">All Campaigns</h2>
                {campaigns.map(cam => (
                    <div key={cam.id} className="bg-[#18181b] p-5 rounded-xl border border-gray-800 flex justify-between items-center group hover:border-indigo-500/30 transition">
                        <div className="flex gap-4 items-center">
                            <img src={cam.banner_url} className="w-20 h-12 object-cover rounded bg-black"/>
                            <div>
                                <h3 className="font-bold text-white text-sm flex gap-2">
                                    {cam.title}
                                    <span className="bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-400">{cam.category || "General"}</span>
                                </h3>
                                <div className="flex gap-2 text-xs mt-1">
                                    <span className={`px-2 py-0.5 rounded uppercase font-bold ${cam.status==='active'?'bg-green-900 text-green-300':cam.status==='pending'?'bg-orange-900 text-orange-300':'bg-red-900 text-red-300'}`}>{cam.status}</span>
                                    <span className="text-gray-500">Bid: {cam.bid_rate} TK</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {cam.status === 'pending' && (
                                <button onClick={()=>updateCampaignStatus(cam.id, 'active')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1"><Icons.Check/> Approve</button>
                            )}
                            {cam.status === 'active' && (
                                <button onClick={()=>updateCampaignStatus(cam.id, 'paused')} className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1"><Icons.Pause/> Pause</button>
                            )}
                            {cam.status === 'paused' && (
                                <button onClick={()=>updateCampaignStatus(cam.id, 'active')} className="bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1"><Icons.Play/> Resume</button>
                            )}
                            <button onClick={()=>deleteCampaign(cam.id)} className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded-lg transition"><Icons.Trash/></button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- DEPOSITS TAB --- */}
        {activeTab === 'deposits' && (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Deposits</h2>
                {deposits.map(dep => (
                    <div key={dep.id} className="bg-[#18181b] p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                        <div>
                            <p className="text-white font-bold">৳ {dep.amount}</p>
                            <p className="text-xs text-gray-500 uppercase">{dep.method} • {dep.trx_id}</p>
                        </div>
                        {dep.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button onClick={()=>processDeposit(dep, 'approved')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Approve</button>
                                <button onClick={()=>processDeposit(dep, 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Reject</button>
                            </div>
                        ) : (
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${dep.status==='approved'?'bg-green-900 text-green-300':'bg-red-900 text-red-300'}`}>{dep.status}</span>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* --- SETTINGS TAB (FIXED SAVE) --- */}
        {activeTab === 'settings' && (
            <div className="max-w-xl bg-[#18181b] p-8 rounded-2xl border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-6">Global Settings</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500 font-bold">Min CPC</label><input type="number" className="w-full bg-black border border-gray-700 p-2 rounded text-white" value={config.rates.min_cpc} onChange={e=>setConfig({...config, rates:{...config.rates, min_cpc:Number(e.target.value)}})}/></div>
                        <div><label className="text-xs text-gray-500 font-bold">Min CPV</label><input type="number" className="w-full bg-black border border-gray-700 p-2 rounded text-white" value={config.rates.min_cpv} onChange={e=>setConfig({...config, rates:{...config.rates, min_cpv:Number(e.target.value)}})}/></div>
                    </div>
                    <div><label className="text-xs text-gray-500 font-bold">Bkash Number</label><input className="w-full bg-black border border-gray-700 p-2 rounded text-white" value={config.payment_info.bkash} onChange={e=>setConfig({...config, payment_info:{...config.payment_info, bkash:e.target.value}})}/></div>
                    <div><label className="text-xs text-gray-500 font-bold">Nagad Number</label><input className="w-full bg-black border border-gray-700 p-2 rounded text-white" value={config.payment_info.nagad} onChange={e=>setConfig({...config, payment_info:{...config.payment_info, nagad:e.target.value}})}/></div>
                    <div><label className="text-xs text-gray-500 font-bold">Binance ID/Wallet</label><input className="w-full bg-black border border-gray-700 p-2 rounded text-white" value={config.payment_info.binance} onChange={e=>setConfig({...config, payment_info:{...config.payment_info, binance:e.target.value}})}/></div>
                    <button onClick={saveConfig} disabled={loading} className="w-full bg-indigo-600 py-3 rounded font-bold text-white hover:bg-indigo-500 transition">{loading?"Saving...":"Save Settings"}</button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}
