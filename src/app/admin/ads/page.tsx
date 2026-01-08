"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, doc, onSnapshot, updateDoc, 
  runTransaction, setDoc, query, where, orderBy 
} from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';

// --- ICONS (SVG) ---
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Money: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Ads: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Crypto: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Success: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Error: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
};

// --- TOAST COMPONENT ---
const Toast = ({ msg, type, onClose }: { msg: string, type: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-slideIn z-[200] ${type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-100' : 'bg-red-900/90 border-red-500/50 text-red-100'}`}>
    <div className={`p-1 rounded-full ${type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {type === 'success' ? <Icons.Success /> : <Icons.Error />}
    </div>
    <div>
        <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-xs opacity-90">{msg}</p>
    </div>
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 p-1 hover:bg-white/10 rounded">
        <Icons.Close />
    </button>
  </div>
);

export default function AdAdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [deposits, setDeposits] = useState<any[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [config, setConfig] = useState({
    min_deposit: 100,
    rates: { min_cpc: 2.0, min_cpv: 0.20 },
    fraud_protection: { click_cooldown: 10, block_vpn: true },
    payment_info: { bkash: "", nagad: "", binance: "" }
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if(session === "valid_token_secure_v1") {
        setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if(username === "admin" && password === "sajid@1234") {
        localStorage.setItem("admin_session", "valid_token_secure_v1");
        setIsAuthenticated(true);
        showToast("Welcome back, Admin!", "success");
    } else {
        showToast("Invalid Credentials", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if(!isAuthenticated) return;

    const unsubConfig = onSnapshot(doc(db, "ad_config", "global_settings"), (doc) => {
      if (doc.exists()) setConfig(doc.data() as any);
    });

    const qDep = query(collection(db, "deposits"), orderBy("timestamp", "desc"));
    const unsubDep = onSnapshot(qDep, (snap) => setDeposits(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    const qCam = query(collection(db, "campaigns"), orderBy("created_at", "desc"));
    const unsubCam = onSnapshot(qCam, (snap) => setPendingCampaigns(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubConfig(); unsubDep(); unsubCam(); };
  }, [isAuthenticated]);

  const saveConfig = async () => {
    setLoading(true);
    try {
        await setDoc(doc(db, "ad_config", "global_settings"), config);
        showToast("Settings saved successfully!", "success");
    } catch (error) {
        showToast("Failed to save settings.", "error");
    }
    setLoading(false);
  };

  // --- FIXED PROCESS DEPOSIT FUNCTION ---
  const processDeposit = async (deposit: any, action: 'approved' | 'rejected') => {
    if(!confirm(`Confirm ${action} for ${deposit.amount} TK?`)) return;
    
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, "deposits", deposit.id);
        const depositDoc = await transaction.get(depositRef);

        if (!depositDoc.exists()) throw "Deposit document missing!";
        if (depositDoc.data().status !== 'pending' && action === 'approved') throw "Already processed!";

        if (action === 'approved') {
          const userId = deposit.user_id || deposit.uid;
          if (!userId) throw "User ID missing!";

          const userRef = doc(db, "users", userId);
          const userDoc = await transaction.get(userRef);
          const amount = Number(deposit.amount);

          if (!userDoc.exists()) {
             transaction.set(userRef, { 
                uid: userId,
                email: deposit.email || "unknown",
                wallet: { current_balance: amount, total_deposited: amount, total_spent: 0 }
             });
          } else {
             const userData = userDoc.data();
             const newBalance = (userData.wallet?.current_balance || 0) + amount;
             const newTotal = (userData.wallet?.total_deposited || 0) + amount;
             transaction.update(userRef, { 
                "wallet.current_balance": newBalance,
                "wallet.total_deposited": newTotal
             });
          }
        }
        transaction.update(depositRef, { status: action });
      });
      showToast(`Deposit ${action} successfully!`, "success");
    } catch (e: any) {
      console.error(e);
      showToast(`Error: ${e.message || e}`, "error");
    }
    setLoading(false);
  };

  const processCampaign = async (id: string, status: 'active' | 'rejected') => {
    try {
        await updateDoc(doc(db, "campaigns", id), { status });
        showToast(`Campaign ${status}!`, "success");
    } catch (error) {
        showToast("Update failed.", "error");
    }
  };

  if(!isAuthenticated) {
    return (
        <div className="min-h-screen bg-[#050b14] flex items-center justify-center p-4">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
            <div className="bg-[#111827] p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-800">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white">Ads<span className="text-indigo-500">Manager</span></h1>
                    <p className="text-xs text-gray-500 mt-2">Secure Admin Access Portal</p>
                </div>
                <div className="space-y-4">
                    <input className="w-full bg-[#1f2937] border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition" placeholder="Admin Username" value={username} onChange={e=>setUsername(e.target.value)}/>
                    <input className="w-full bg-[#1f2937] border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-indigo-500 transition" type="password" placeholder="Secure Password" value={password} onChange={e=>setPassword(e.target.value)}/>
                    <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-900/20">Secure Login</button>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans flex flex-col md:flex-row">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      
      <aside className="w-full md:w-64 bg-[#121215] border-r border-gray-800 flex flex-col md:h-screen sticky top-0 z-50">
         <div className="p-6 border-b border-gray-800"><h2 className="text-2xl font-black text-white">Ads<span className="text-indigo-500">Panel</span></h2></div>
         <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
             {[ 
               {id: "dashboard", label: "Overview", icon: <Icons.Dashboard/>},
               {id: "deposits", label: "Deposits", icon: <Icons.Money/>},
               {id: "campaigns", label: "Campaigns", icon: <Icons.Ads/>},
               {id: "settings", label: "Configuration", icon: <Icons.Settings/>}
             ].map(item => (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                    {item.icon} {item.label}
                    {item.id === 'deposits' && deposits.filter(d=>d.status==='pending').length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{deposits.filter(d=>d.status==='pending').length}</span>}
                 </button>
             ))}
         </nav>
         <div className="p-4 border-t border-gray-800"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-900/30 p-3 rounded-xl transition text-sm font-bold"><Icons.Logout /> Logout</button></div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-white mb-4">Network Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-xs font-bold text-gray-500 uppercase">Total Deposits</h3>
                        <p className="text-3xl font-black text-green-400 mt-2">৳ {deposits.filter(d=>d.status==='approved').reduce((a,b)=>a+Number(b.amount),0)}</p>
                    </div>
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-xs font-bold text-gray-500 uppercase">Pending Deposits</h3>
                        <p className="text-3xl font-black text-orange-400 mt-2">{deposits.filter(d=>d.status==='pending').length}</p>
                    </div>
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-xs font-bold text-gray-500 uppercase">Active Ads</h3>
                        <p className="text-3xl font-black text-indigo-400 mt-2">{pendingCampaigns.filter(c=>c.status==='active').length}</p>
                    </div>
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-xs font-bold text-gray-500 uppercase">Pending Ads</h3>
                        <p className="text-3xl font-black text-red-400 mt-2">{pendingCampaigns.filter(c=>c.status==='pending').length}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 h-80">
                    <div className="bg-[#18181b] p-6 rounded-2xl border border-gray-800">
                        <h3 className="text-zinc-400 font-bold mb-4">Content Distribution</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[ {name:'Active Ads', v:pendingCampaigns.filter(c=>c.status==='active').length}, {name:'Pending', v:pendingCampaigns.filter(c=>c.status==='pending').length} ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="name" stroke="#71717a" />
                                <YAxis stroke="#71717a" />
                                <Tooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px'}} />
                                <Bar dataKey="v" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-[#18181b] rounded-2xl border border-gray-800 p-6 overflow-y-auto">
                        <h3 className="text-sm font-bold text-white mb-4">Recent Activities</h3>
                        <div className="space-y-3">
                            {deposits.slice(0, 5).map(dep => (
                                <div key={dep.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                                    <span className="text-gray-400">New deposit request of <strong>{dep.amount} TK</strong> via {dep.method}</span>
                                    <span className={`text-[10px] px-2 py-1 rounded ${dep.status==='pending'?'bg-orange-500/20 text-orange-400':'bg-green-500/20 text-green-400'}`}>{dep.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="max-w-2xl bg-[#18181b] p-8 rounded-2xl border border-gray-800 animate-fadeIn">
            <h2 className="text-xl font-bold text-indigo-400 mb-6 flex items-center gap-2"><Icons.Settings /> Configuration</h2>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase">Min CPC Rate (TK)</label>
                        <input type="number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-indigo-500 transition" value={config.rates.min_cpc} onChange={e=>setConfig({...config, rates: {...config.rates, min_cpc: Number(e.target.value)}})}/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase">Min CPV Rate (TK)</label>
                        <input type="number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-indigo-500 transition" value={config.rates.min_cpv} onChange={e=>setConfig({...config, rates: {...config.rates, min_cpv: Number(e.target.value)}})}/>
                    </div>
                </div>
                
                <h3 className="text-sm font-bold text-white pt-4 border-t border-gray-800">Payment Gateways</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-20 text-xs text-pink-500 font-bold">Bkash</span>
                        <input className="flex-1 bg-black border border-gray-700 p-3 rounded-lg text-white text-sm outline-none" value={config.payment_info.bkash} onChange={e=>setConfig({...config, payment_info: {...config.payment_info, bkash: e.target.value}})}/>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-20 text-xs text-orange-500 font-bold">Nagad</span>
                        <input className="flex-1 bg-black border border-gray-700 p-3 rounded-lg text-white text-sm outline-none" value={config.payment_info.nagad} onChange={e=>setConfig({...config, payment_info: {...config.payment_info, nagad: e.target.value}})}/>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-20 text-xs text-yellow-500 font-bold flex gap-1"><Icons.Crypto/> Binance</span>
                        <input className="flex-1 bg-black border border-gray-700 p-3 rounded-lg text-white text-sm outline-none" placeholder="Binance Pay ID / Wallet Address" value={config.payment_info.binance} onChange={e=>setConfig({...config, payment_info: {...config.payment_info, binance: e.target.value}})}/>
                    </div>
                </div>

                <button onClick={saveConfig} disabled={loading} className="w-full bg-indigo-600 py-4 rounded-xl font-bold text-white hover:bg-indigo-500 transition shadow-lg flex items-center justify-center gap-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.Save />} 
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
            </div>
        )}

        {activeTab === 'deposits' && (
            <div className="space-y-4 animate-fadeIn">
                <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>
                {deposits.length === 0 ? <div className="text-gray-500">No records found.</div> : deposits.map(dep => (
                    <div key={dep.id} className={`bg-[#18181b] p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${dep.status === 'pending' ? 'border-orange-500/30 bg-orange-900/5' : 'border-gray-800'}`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-bold text-white">৳ {dep.amount}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${dep.status === 'approved' ? 'bg-green-500/20 text-green-400' : dep.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>{dep.status}</span>
                            </div>
                            <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                                <span className="text-indigo-400 font-bold">{dep.method}</span> • 
                                <span className="font-mono bg-black px-2 rounded text-gray-300">{dep.trx_id || dep.trnxId}</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1">User: {dep.user_id || dep.uid}</p>
                        </div>
                        {dep.status === 'pending' && (
                            <div className="flex gap-3 w-full md:w-auto">
                                <button onClick={()=>processDeposit(dep, 'approved')} className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm"><Icons.Check/> Approve</button>
                                <button onClick={()=>processDeposit(dep, 'rejected')} className="flex-1 md:flex-none bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-5 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition border border-red-500/20 hover:border-red-600"><Icons.Cross/> Reject</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'campaigns' && (
            <div className="space-y-4 animate-fadeIn">
                <h2 className="text-xl font-bold text-white mb-4">Ad Campaign Requests</h2>
                {pendingCampaigns.length === 0 ? <div className="text-gray-500">No pending requests.</div> : pendingCampaigns.map(cam => (
                    <div key={cam.id} className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row gap-6">
                        <img src={cam.banner_url || cam.imageUrl} className="w-full md:w-48 h-28 bg-black object-cover rounded-lg border border-gray-700"/>
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {cam.title}
                                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${cam.status === 'active' ? 'bg-green-500/20 text-green-400' : cam.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>{cam.status}</span>
                                    </h3>
                                    <a href={cam.target_url || cam.link} target="_blank" className="text-xs text-blue-400 hover:underline break-all">{cam.target_url || cam.link}</a>
                                </div>
                                <div className="text-right hidden md:block">
                                    <span className="block text-sm font-bold text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/30">{cam.ad_model || cam.type}</span>
                                    <span className="text-xs text-gray-500 mt-1 block">Rate: {cam.bid_rate || cam.rate} TK</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2 md:gap-4 text-xs text-gray-400 bg-black/30 p-3 rounded-lg border border-gray-800">
                                <span>🌍 {cam.targeting?.countries?.join(", ") || "All Countries"}</span>
                                <span>📱 {cam.targeting?.devices?.join(", ") || "All Devices"}</span>
                                <span>💰 Budget: {cam.total_budget || cam.budget} TK</span>
                            </div>

                            {cam.status === 'pending' && (
                                <div className="mt-4 flex gap-3 justify-end">
                                    <button onClick={()=>processCampaign(cam.id, 'active')} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-900/20 transition"><Icons.Check /> Approve</button>
                                    <button onClick={()=>processCampaign(cam.id, 'rejected')} className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-5 py-2 rounded-lg font-bold text-sm transition border border-red-500/20 hover:border-red-600 flex items-center gap-2"><Icons.Cross /> Reject</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

      </main>
    </div>
  );
}
