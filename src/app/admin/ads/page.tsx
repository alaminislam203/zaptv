"use client";
import React, { useState, useEffect } from "react";
import { db } from ".../firebase";
import { 
  collection, doc, onSnapshot, updateDoc, 
  runTransaction, setDoc, query, where, orderBy 
} from "firebase/firestore";

// --- ICONS (SVG) ---
const Icons = {
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Money: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Ads: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Success: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Error: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
};

// --- TOAST COMPONENT (Updated with SVG) ---
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
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Data States
  const [deposits, setDeposits] = useState<any[]>([]);
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [config, setConfig] = useState({
    min_deposit: 100,
    rates: { min_cpc: 2.0, min_cpv: 0.20 },
    fraud_protection: { click_cooldown: 10, block_vpn: true },
    payment_info: { bkash: "", nagad: "" }
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- FETCH DATA ---
  useEffect(() => {
    // 1. Fetch Config
    const unsubConfig = onSnapshot(doc(db, "ad_config", "global_settings"), (doc) => {
      if (doc.exists()) setConfig(doc.data() as any);
    });

    // 2. Fetch Pending Deposits
    const qDep = query(collection(db, "deposits"), where("status", "==", "pending"), orderBy("timestamp", "desc"));
    const unsubDep = onSnapshot(qDep, (snap) => setDeposits(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    // 3. Fetch Pending Campaigns
    const qCam = query(collection(db, "campaigns"), where("status", "==", "pending"), orderBy("created_at", "desc"));
    const unsubCam = onSnapshot(qCam, (snap) => setPendingCampaigns(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubConfig(); unsubDep(); unsubCam(); };
  }, []);

  // --- ACTIONS ---

  // 1. Save Settings
  const saveConfig = async () => {
    setLoading(true);
    try {
        await setDoc(doc(db, "ad_config", "global_settings"), config);
        showToast("Global settings updated successfully!", "success");
    } catch (error) {
        showToast("Failed to save settings.", "error");
    }
    setLoading(false);
  };

  // 2. Approve Deposit (Critical: Transaction)
  const processDeposit = async (deposit: any, action: 'approved' | 'rejected') => {
    if(!confirm(`Are you sure you want to ${action} this transaction?`)) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        // Update Deposit Status
        const depositRef = doc(db, "deposits", deposit.id);
        transaction.update(depositRef, { status: action });

        // If Approved, Add Balance to User
        if (action === 'approved') {
          const userRef = doc(db, "users", deposit.user_id);
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists()) {
             // Create User Doc if not exists
             transaction.set(userRef, { 
                uid: deposit.user_id,
                wallet: { current_balance: Number(deposit.amount), total_deposited: Number(deposit.amount), total_spent: 0 }
             });
          } else {
             const userData = userDoc.data();
             const newBalance = (userData.wallet?.current_balance || 0) + Number(deposit.amount);
             const newTotal = (userData.wallet?.total_deposited || 0) + Number(deposit.amount);
             
             transaction.update(userRef, { 
                "wallet.current_balance": newBalance,
                "wallet.total_deposited": newTotal
             });
          }
        }
      });
      showToast(`Deposit ${action} successfully!`, "success");
    } catch (e) {
      console.error(e);
      showToast("Error processing transaction", "error");
    }
  };

  // 3. Approve/Reject Campaign
  const processCampaign = async (id: string, status: 'active' | 'rejected') => {
    try {
        await updateDoc(doc(db, "campaigns", id), { status });
        showToast(`Campaign marked as ${status}`, "success");
    } catch (error) {
        showToast("Failed to update campaign.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans p-6 md:p-10">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      
      <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-800 pb-4">Ads <span className="text-indigo-500">Manager</span></h1>

      {/* TABS */}
      <div className="flex gap-4 mb-8">
        {[
          {id: 'settings', label: 'Settings', icon: <Icons.Settings/>},
          {id: 'deposits', label: `Deposits (${deposits.length})`, icon: <Icons.Money/>},
          {id: 'campaigns', label: `Ad Requests (${pendingCampaigns.length})`, icon: <Icons.Ads/>}
        ].map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition ${activeTab===tab.id ? "bg-indigo-600 text-white shadow-lg" : "bg-[#18181b] text-gray-400 hover:text-white"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-[#18181b] p-8 rounded-2xl border border-gray-800 animate-fadeIn">
          <h2 className="text-xl font-bold text-indigo-400 mb-6 flex items-center gap-2"><Icons.Settings /> Global Ad Configuration</h2>
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
            
            <div>
                <label className="text-xs text-gray-500 font-bold uppercase">Click Cooldown (Seconds)</label>
                <input type="number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-indigo-500 transition" value={config.fraud_protection.click_cooldown} onChange={e=>setConfig({...config, fraud_protection: {...config.fraud_protection, click_cooldown: Number(e.target.value)}})}/>
                <p className="text-[10px] text-gray-500 mt-1">Prevents duplicate clicks from same user within X seconds.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Bkash Number</label>
                    <input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-indigo-500 transition" value={config.payment_info.bkash} onChange={e=>setConfig({...config, payment_info: {...config.payment_info, bkash: e.target.value}})}/>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Nagad Number</label>
                    <input className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white mt-1 outline-none focus:border-indigo-500 transition" value={config.payment_info.nagad} onChange={e=>setConfig({...config, payment_info: {...config.payment_info, nagad: e.target.value}})}/>
                </div>
            </div>

            <button onClick={saveConfig} disabled={loading} className="w-full bg-indigo-600 py-4 rounded-xl font-bold text-white hover:bg-indigo-500 transition shadow-lg flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.Save />} 
                {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* --- DEPOSITS TAB --- */}
      {activeTab === 'deposits' && (
        <div className="space-y-4 animate-fadeIn">
            {deposits.length === 0 ? <div className="text-gray-500 text-center py-10 border border-dashed border-gray-800 rounded-xl">No pending deposits.</div> : deposits.map(dep => (
                <div key={dep.id} className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 flex justify-between items-center group hover:border-indigo-500/30 transition">
                    <div>
                        <h3 className="text-2xl font-bold text-green-400">৳ {dep.amount}</h3>
                        <p className="text-gray-300 font-bold mt-1 text-sm">{dep.method} <span className="text-gray-600">|</span> TrxID: <span className="text-white font-mono bg-gray-800 px-2 rounded">{dep.trx_id || dep.trnxId}</span></p>
                        <p className="text-xs text-gray-500 mt-2">User ID: <span className="font-mono text-indigo-400">{dep.user_id || dep.uid}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={()=>processDeposit(dep, 'approved')} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-green-900/20"><Icons.Check/> Approve</button>
                        <button onClick={()=>processDeposit(dep, 'rejected')} className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition border border-red-500/20 hover:border-red-600"><Icons.Cross/> Reject</button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* --- CAMPAIGNS TAB --- */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4 animate-fadeIn">
            {pendingCampaigns.length === 0 ? <div className="text-gray-500 text-center py-10 border border-dashed border-gray-800 rounded-xl">No pending ad requests.</div> : pendingCampaigns.map(cam => (
                <div key={cam.id} className="bg-[#18181b] p-6 rounded-2xl border border-gray-800 flex gap-6 group hover:border-indigo-500/30 transition">
                    <img src={cam.banner_url || cam.imageUrl} className="w-32 h-20 bg-black object-cover rounded-lg border border-gray-700"/>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-white">{cam.title}</h3>
                                <a href={cam.target_url || cam.link} target="_blank" className="text-xs text-blue-400 hover:underline">{cam.target_url || cam.link}</a>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/30">{cam.ad_model || cam.type}</span>
                                <span className="text-xs text-gray-500 mt-1 block">Rate: {cam.bid_rate || cam.rate} TK</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400 bg-black/30 p-3 rounded-lg border border-gray-800">
                            <span className="flex items-center gap-1"><span className="text-indigo-400">🌍 Target:</span> {cam.targeting?.countries?.join(", ") || "All"}</span>
                            <span className="flex items-center gap-1"><span className="text-indigo-400">📱 Device:</span> {cam.targeting?.devices?.join(", ") || "All"}</span>
                            <span className="flex items-center gap-1"><span className="text-indigo-400">💰 Budget:</span> {cam.total_budget || cam.budget} TK</span>
                        </div>

                        <div className="mt-4 flex gap-3 justify-end">
                            <button onClick={()=>processCampaign(cam.id, 'active')} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-900/20 transition"><Icons.Check /> Approve Ad</button>
                            <button onClick={()=>processCampaign(cam.id, 'rejected')} className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-5 py-2 rounded-lg font-bold text-sm transition border border-red-500/20 hover:border-red-600 flex items-center gap-2"><Icons.Cross /> Reject</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

    </div>
  );
}
