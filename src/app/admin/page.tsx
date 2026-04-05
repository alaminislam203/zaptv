'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, query, onSnapshot, doc, updateDoc, addDoc, 
  deleteDoc, setDoc, serverTimestamp, orderBy, QuerySnapshot, 
  DocumentData, getDoc 
} from 'firebase/firestore';
import { 
  ShieldCheck, Check, X, Key, User, Package, FileText, 
  Download, List, Plus, Trash2, Edit2, Save, Globe, Zap, 
  MonitorOff, Monitor, Headphones, Settings, Image as ImageIcon, BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `PRIME-${part1}-${part2}`;
};

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  timestamp: any;
}

interface ChatThread {
  id: string;
  userName: string;
  userId: string;
  lastMessage: string;
  lastTimestamp: any;
  unreadCountAdmin?: number;
}

export default function AdminPanel() {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'payments' | 'plans' | 'features' | 'banners' | 'keys' | 'settings' | 'support' | 'blogs'>('payments');
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ downloadLink: '' });
  
  // Chat States
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [adminReply, setAdminReply] = useState('');
  
  const [mounted, setMounted] = useState(false);
  
  // States for Editing/Adding
  const [newPlan, setNewPlan] = useState({ name: '', price: '', duration: '', color: '#00d2ff', bg: 'bg-primary/10' });
  const [newFeature, setNewFeature] = useState({ title: '', desc: '', icon: 'Zap' });
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', image: '', link: '' });
  const [newBlog, setNewBlog] = useState({ title: '', slug: '', excerpt: '', content: '', coverImage: '', keywords: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'ADMIN')) {
      router.push('/');
      return;
    }

    // Subscribe to Payments
    const qPayments = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Subscribe to Plans
    const qPlans = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Subscribe to Features
    const qFeatures = collection(db, 'features');
    const unsubFeatures = onSnapshot(qFeatures, (snapshot) => {
      setFeatures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Subscribe to All Keys
    const qKeys = query(collection(db, 'keys'), orderBy('createdAt', 'desc'));
    const unsubKeys = onSnapshot(qKeys, (snapshot) => {
      setKeys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Subscribe to Banners
    const qBanners = collection(db, 'banners');
    const unsubBanners = onSnapshot(qBanners, (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Subscribe to Blogs
    const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubBlogs = onSnapshot(qBlogs, (snapshot) => {
      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Subscribe to Chat Threads
    const qChats = query(collection(db, 'support_chats'), orderBy('lastTimestamp', 'desc'));
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      setChatThreads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatThread)));
    });

    // Fetch Settings
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    };
    fetchSettings();

    return () => {
      unsubPayments();
      unsubPlans();
      unsubFeatures();
      unsubKeys();
      unsubBanners();
      unsubBlogs();
      unsubChats();
    };
  }, [user, userData, loading, router]);

  // Subscribe to specific chat messages
  useEffect(() => {
    if (activeChatId) {
      const qMsgs = query(
        collection(db, `support_chats/${activeChatId}/messages`),
        orderBy('timestamp', 'asc')
      );
      const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
        setActiveChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
      });
      
      // Reset unread count
      updateDoc(doc(db, 'support_chats', activeChatId), { unreadCountAdmin: 0 });
      
      return () => unsubMsgs();
    }
  }, [activeChatId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApprove = async (payment: any) => {
    if (!confirm(`Approve payment and generate key for ${payment.userName}?`)) return;
    try {
      const key = generateKey();
      await addDoc(collection(db, 'keys'), {
        userId: payment.userId,
        paymentId: payment.id,
        key: key,
        isUsed: false,
        packageName: payment.packageName,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'payments', payment.id), {
        status: 'APPROVED',
        updatedAt: serverTimestamp(),
      });
    } catch (err) { alert('Error during approval'); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this payment?')) return;
    try {
      await updateDoc(doc(db, 'payments', id), { status: 'REJECTED', updatedAt: serverTimestamp() });
    } catch (err) { alert('Error during rejection'); }
  };

  // Content Management Logic
  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      alert('Settings saved!');
    } catch (err) { alert('Error saving settings'); }
  };

  const addPlan = async () => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'plans', editingId), newPlan);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'plans'), newPlan);
      }
      setNewPlan({ name: '', price: '', duration: '', color: '#00d2ff', bg: 'bg-primary/10' });
    } catch (err) { alert('Error saving plan'); }
  };

  const deletePlan = async (id: string) => {
    if (confirm('Delete this plan?')) await deleteDoc(doc(db, 'plans', id));
  };

  const startEditPlan = (plan: any) => {
    setEditingId(plan.id);
    setNewPlan({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      color: plan.color,
      bg: plan.bg
    });
  };

  const addFeature = async () => {
    try {
      await addDoc(collection(db, 'features'), newFeature);
      setNewFeature({ title: '', desc: '', icon: 'Zap' });
    } catch (err) { alert('Error adding feature'); }
  };

  const deleteFeature = async (id: string) => {
    if (confirm('Delete this feature?')) await deleteDoc(doc(db, 'features', id));
  };

  const addBanner = async () => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'banners', editingId), newBanner);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'banners'), newBanner);
      }
      setNewBanner({ title: '', subtitle: '', image: '', link: '' });
    } catch (err) { alert('Error saving banner'); }
  };

  const deleteBanner = async (id: string) => {
    if (confirm('Delete this banner?')) await deleteDoc(doc(db, 'banners', id));
  };

  const startEditBanner = (banner: any) => {
    setEditingId(banner.id);
    setNewBanner({ title: banner.title, subtitle: banner.subtitle, image: banner.image, link: banner.link });
    setActiveTab('banners');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadBannerTemplate = () => {
    const template = [
      {
        "title": "খেলা দেখুন সরাসরি",
        "subtitle": "সব প্রধান স্পোর্টস ইভেন্ট এখন আপনার হাতের মুঠোয়",
        "image": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070",
        "link": "sports" 
      },
      {
        "title": "প্রিমিয়াম মেম্বারশিপ",
        "subtitle": "অ্যাড-ফ্রি অভিজ্ঞতার জন্য আজই জয়েন করুন",
        "image": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=2070",
        "link": "/buy"
      }
    ];
    template.forEach(async (b) => {
      await addDoc(collection(db, 'banners'), b);
    });
    alert('Templates added to queue!');
  };

  const addBlog = async () => {
    try {
      const blogData = {
        ...newBlog,
        keywords: newBlog.keywords.split(',').map(k => k.trim()),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'blogs', editingId), blogData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'blogs'), {
          ...blogData,
          createdAt: serverTimestamp()
        });
      }
      setNewBlog({ title: '', slug: '', excerpt: '', content: '', coverImage: '', keywords: '' });
      alert('Blog saved successfully!');
    } catch (err) { alert('Error saving blog'); }
  };

  const deleteBlog = async (id: string) => {
    if (confirm('Delete this blog post?')) await deleteDoc(doc(db, 'blogs', id));
  };

  const startEditBlog = (blog: any) => {
    setEditingId(blog.id);
    setNewBlog({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage,
      keywords: blog.keywords.join(', ')
    });
    setActiveTab('blogs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !adminReply.trim() || !user) return;
    
    const replyText = adminReply.trim();
    setAdminReply('');
    
    try {
      await addDoc(collection(db, `support_chats/${activeChatId}/messages`), {
        text: replyText,
        senderId: user.uid,
        senderName: 'PrimeCast Support',
        isAdmin: true,
        timestamp: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'support_chats', activeChatId), {
        lastMessage: replyText,
        lastTimestamp: serverTimestamp()
      });
    } catch (err) { console.error("Reply error:", err); }
  };

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 bg-background min-h-screen text-slate-900 selection:bg-primary/30" suppressHydrationWarning>
      <header className="flex flex-wrap items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <ShieldCheck size={32} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Control Center</h1>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">PrimeCast TV Dashboard</p>
          </div>
        </div>
        <Link href="/" className="px-6 py-2.5 rounded-xl border border-slate-900/10 backdrop-blur-md bg-white/10 hover:bg-black/5 text-slate-800 transition-all font-bold text-sm shadow-sm">
          ← Exit to User View
        </Link>
      </header>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/5 rounded-2xl w-fit mb-12 border border-slate-900/5 backdrop-blur-sm">
        {[
          { id: 'payments', label: 'Verifications', icon: <FileText size={18} /> },
          { id: 'keys', label: 'Licenses', icon: <Key size={18} /> },
          { id: 'plans', label: 'Plans', icon: <Package size={18} /> },
          { id: 'features', label: 'Features', icon: <List size={18} /> },
          { id: 'banners', label: 'Banners', icon: <ImageIcon size={18} /> },
          { id: 'blogs', label: 'Blog', icon: <BookOpen size={18} /> },
          { id: 'support', label: 'Support Chat', icon: <Headphones size={18} /> },
          { id: 'settings', label: 'Setup', icon: <Settings size={18} /> }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeTab === tab.id ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-900/5'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'payments' && (
          <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-10 rounded-3xl border border-black/5 shadow-sm border-l-4 border-amber-500 font-bold">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2">Pending Requests</p>
                <div className="text-5xl font-black text-slate-900">{payments.filter(p => p.status === 'PENDING').length}</div>
              </div>
              <div className="bg-white p-10 rounded-3xl border border-black/5 shadow-sm border-l-4 border-emerald-500 font-bold">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Total Verified</p>
                <div className="text-5xl font-black text-slate-900">{payments.filter(p => p.status === 'APPROVED').length}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black/5">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Investor</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Info</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Binance TXID</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-black border border-amber-500/20">
                              {p.userName?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">{p.userName}</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'PENDING' ? 'text-amber-500' : p.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'}`}>{p.status}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-900">{p.packageName}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{mounted ? new Date(p.createdAt?.seconds * 1000).toLocaleString() : '---'}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="font-mono bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs tracking-widest text-primary shadow-inner select-all font-bold">{p.txId}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {p.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => handleApprove(p)} className="p-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all rounded-xl border border-emerald-500/20"><Check size={20} /></button>
                              <button onClick={() => handleReject(p.id)} className="p-3 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all rounded-xl border border-red-500/20"><X size={20} /></button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Archived</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'keys' && (
          <motion.div key="keys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-black/5">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">License Key</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ID / Package</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {keys.map((k) => (
                      <tr key={k.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-8 py-6">
                          <span className="font-mono text-amber-500 font-bold select-all">{k.key}</span>
                        </td>
                        <td className="px-8 py-6">
                            <div className="text-sm font-bold">{k.packageName}</div>
                            <div className="text-[10px] text-white/30">{k.userId}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${k.isUsed ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {k.isUsed ? 'REDEEMED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right text-[10px] text-slate-400 font-bold">
                          {mounted ? new Date(k.createdAt?.seconds * 1000).toLocaleString() : '---'}
                        </td>
                      </tr>
                    ))}
                    {keys.length === 0 && <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic tracking-widest font-bold">NO_KEYS_GENERATED</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="max-w-2xl bg-white p-12 rounded-3xl border border-black/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Download className="text-amber-500" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Software Distribution</h2>
              </div>
              <div className="space-y-6 font-bold">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Download URL</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 shadow-inner rounded-xl px-5 py-4 text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono text-sm" 
                    placeholder="https://example.com/primecast.exe" 
                    value={settings.downloadLink} 
                    onChange={(e) => setSettings({...settings, downloadLink: e.target.value})}
                  />
                </div>
                <button onClick={saveSettings} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2">
                  <Save size={18} /> COMMIT CHANGES
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div key="plans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-10 rounded-3xl border border-black/5 shadow-sm font-bold">
                <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-2 text-slate-900">
                  {editingId ? <Edit2 size={20} className="text-amber-500" /> : <Plus size={20} className="text-amber-500" />}
                  {editingId ? 'Modify Plan' : 'Create Plan'}
                </h3>
                <div className="space-y-6 font-bold">
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" placeholder="Plan Name (e.g. 7 Days Access)" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" placeholder="Price (Numeric)" type="number" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} />
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" placeholder="Duration Days" type="number" value={newPlan.duration} onChange={e => setNewPlan({...newPlan, duration: e.target.value})} />
                  <div className="flex gap-4">
                      <div className="flex-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Accent Color</label>
                          <input type="color" className="w-full h-10 rounded-lg bg-white border border-slate-200 cursor-pointer" value={newPlan.color} onChange={e => setNewPlan({...newPlan, color: e.target.value})} />
                      </div>
                      <div className="flex-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-2">BG Utility</label>
                          <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-2 text-[10px] text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" placeholder="bg-primary/20" value={newPlan.bg} onChange={e => setNewPlan({...newPlan, bg: e.target.value})} />
                      </div>
                  </div>
                  <button onClick={addPlan} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xl">
                    {editingId ? 'Update System Values' : 'Initialize Plan'}
                  </button>
                  {editingId && (
                    <button onClick={() => {setEditingId(null); setNewPlan({ name: '', price: '', duration: '', color: '#00d2ff', bg: 'bg-primary/10' })}} className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest mt-2">
                      Cancel Edition
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6 text-slate-400">
                <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-slate-800"><Package size={20} className="text-amber-500" /> Current Offerings</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                    {plans.map(p => (
                        <div key={p.id} className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm border-l-4 font-bold hover:shadow-xl transition-all" style={{ borderColor: p.color }}>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-black text-xl text-slate-900">{p.name}</h4>
                                <div className="flex gap-1">
                                  <button onClick={() => startEditPlan(p)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all rounded-lg border border-amber-500/10 text-[10px] font-black uppercase">
                                    <Edit2 size={12} /> Edit
                                  </button>
                                  <button onClick={() => deletePlan(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all rounded-lg border border-red-500/10 text-[10px] font-black uppercase">
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                            </div>
                            <div className="text-3xl font-black mb-4 text-slate-900">${p.price} <span className="text-xs text-slate-400 font-bold uppercase">USDT</span></div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Duration: {p.duration} Days</div>
                        </div>
                    ))}
                    {plans.length === 0 && <div className="col-span-2 bg-white p-12 rounded-3xl border-2 border-dashed border-slate-100 text-center text-slate-300 font-black italic tracking-widest uppercase">DATABASE_EMPTY: No plans configured</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'features' && (
          <motion.div key="features" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-3xl border border-black/5 shadow-sm">
                <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-2 text-slate-900"><Plus size={20} className="text-amber-500" /> Catalog New Feature</h3>
                 <div className="space-y-6">
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" placeholder="Feature Title" value={newFeature.title} onChange={e => setNewFeature({...newFeature, title: e.target.value})} />
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold min-h-[120px] resize-none" placeholder="Feature Description" value={newFeature.desc} onChange={e => setNewFeature({...newFeature, desc: e.target.value})} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Icon Name (Lucide)</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none" value={newFeature.icon} onChange={e => setNewFeature({...newFeature, icon: e.target.value})}>
                        {['Zap', 'Monitor', 'Globe', 'LayoutGrid', 'Headphones', 'ShieldCheck', 'Clock', 'Play'].map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={addFeature} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xl">DECODE & DEPLOY</button>
                  </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2"><List size={20} className="text-amber-500" /> Feature Matrix</h3>
                <div className="space-y-4">
                    {features.map(f => (
                        <div key={f.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex justify-between items-center font-bold hover:shadow-lg transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-black/5 text-amber-600">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{f.title}</h4>
                                    <p className="text-xs text-slate-400 font-medium">{f.desc}</p>
                                </div>
                            </div>
                            <button onClick={() => deleteFeature(f.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    {features.length === 0 && <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-100 text-center text-slate-300 font-bold italic tracking-widest uppercase">System Data Missing</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'banners' && (
          <motion.div key="banners" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
             <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm font-bold">
                   <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-2 text-slate-900">
                      {editingId ? <Edit2 size={20} className="text-amber-500" /> : <Plus size={20} className="text-amber-500" />}
                      {editingId ? 'Edit Banner' : 'New Banner'}
                   </h3>
                   <div className="space-y-6">
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Banner Title" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} />
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Subtitle / Description" value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} />
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" placeholder="Image URL" value={newBanner.image} onChange={e => setNewBanner({...newBanner, image: e.target.value})} />
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" placeholder="Target Link" value={newBanner.link} onChange={e => setNewBanner({...newBanner, link: e.target.value})} />
                      <button onClick={addBanner} className="w-full py-4 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary transition-all">
                        {editingId ? 'Commit Update' : 'Establish Banner'}
                      </button>
                      <button onClick={loadBannerTemplate} className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                        Inject Template Data
                      </button>
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 flex items-center gap-2"><ImageIcon size={20} className="text-amber-500" /> Managed Banners</h3>
                   <div className="grid sm:grid-cols-2 gap-6">
                      {banners.map(b => (
                         <div key={b.id} className="bg-white rounded-[2rem] border border-black/5 overflow-hidden shadow-sm group hover:shadow-xl transition-all relative">
                            <div className="h-40 bg-slate-100 overflow-hidden relative font-bold text-slate-300 flex items-center justify-center">
                               {b.image && (
                                  <img src={b.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                               )}
                               {!b.image && <ImageIcon size={32} />}
                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                               <div className="absolute bottom-4 left-6">
                                  <h4 className="text-white font-black text-lg uppercase italic leading-tight">{b.title}</h4>
                               </div>
                            </div>
                            <div className="p-6">
                               <p className="text-[10px] text-slate-400 font-bold mb-4 line-clamp-1">{b.subtitle}</p>
                               <div className="flex gap-2">
                                  <button onClick={() => startEditBanner(b)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2">
                                     <Edit2 size={12} /> Edit
                                  </button>
                                  <button onClick={() => deleteBanner(b.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                     <Trash2 size={14} />
                                  </button>
                               </div>
                            </div>
                         </div>
                      ))}
                      {banners.length === 0 && <div className="col-span-2 py-20 bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300 font-black uppercase italic tracking-widest">No Banners Active</div>}
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'support' && (
          <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[700px] flex gap-6 bg-white rounded-3xl overflow-hidden border border-black/5 shadow-2xl">
            <div className="w-80 border-r border-black/5 flex flex-col bg-slate-50">
               <div className="p-6 border-b border-black/5 flex items-center justify-between">
                  <h3 className="font-black uppercase italic text-xs tracking-widest text-slate-400">Incoming Requests</h3>
                  <div className="px-2 py-1 bg-amber-500 rounded-lg text-[8px] font-black text-white">{chatThreads.length}</div>
               </div>
               <div className="flex-grow overflow-y-auto no-scrollbar">
                  {chatThreads.map(thread => (
                    <button 
                      key={thread.id} 
                      onClick={() => setActiveChatId(thread.id)}
                      className={`w-full p-6 text-left border-b border-black/5 transition-all flex items-center gap-4 group ${activeChatId === thread.id ? 'bg-white shadow-xl scale-105 z-10' : 'hover:bg-slate-100/50'}`}
                    >
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black italic shadow-inner ${activeChatId === thread.id ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                          {thread.userName?.charAt(0) || 'U'}
                       </div>
                       <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-center mb-1">
                             <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 truncate">{thread.userName}</h4>
                             {thread.unreadCountAdmin && thread.unreadCountAdmin > 0 && (
                               <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                             )}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{thread.lastMessage}</p>
                       </div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex-grow flex flex-col bg-white">
               {activeChatId ? (
                 <>
                   <div className="p-6 border-b border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                         <h4 className="font-black uppercase italic text-sm tracking-tight text-slate-900">Live with {chatThreads.find(t => t.id === activeChatId)?.userName}</h4>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator Identity: {user?.displayName || 'Admin'}</div>
                   </div>

                   <div className="flex-grow p-8 overflow-y-auto space-y-6 no-scrollbar bg-slate-50/30">
                      {activeChatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] p-5 rounded-2.5xl text-xs font-bold shadow-sm ${msg.isAdmin ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-black/5 text-slate-800 rounded-tl-none'}`}>
                              {msg.text}
                              <div className={`text-[8px] mt-2 font-black uppercase opacity-40 ${msg.isAdmin ? 'text-white' : 'text-slate-400'}`}>
                                 {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : '...'}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   <form onSubmit={handleAdminReply} className="p-6 border-t border-black/5 flex gap-4">
                      <input 
                        className="flex-grow bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                        placeholder="Establish response protocol..."
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                      />
                      <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] italic shadow-xl hover:bg-amber-500 transition-all active:scale-95">Send Reply</button>
                   </form>
                 </>
               ) : (
                 <div className="flex-grow flex flex-col items-center justify-center p-20 text-center opacity-20 italic">
                    <Headphones size={64} className="mb-6" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Support Uplink Offline</h3>
                    <p className="text-xs font-bold uppercase tracking-widest mt-2">Select a communication thread to begin transmission.</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'blogs' && (
          <motion.div key="blogs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm font-bold">
                   <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-2 text-slate-900">
                      {editingId ? <Edit2 size={20} className="text-amber-500" /> : <Plus size={20} className="text-amber-500" />}
                      {editingId ? 'Modify Strategy' : 'New Article'}
                   </h3>
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Article Title</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g. How to use Toffee on PC" value={newBlog.title} onChange={e => setNewBlog({...newBlog, title: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL Slug</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" placeholder="how-to-use-toffee-pc" value={newBlog.slug} onChange={e => setNewBlog({...newBlog, slug: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cover Image URL</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="https://..." value={newBlog.coverImage} onChange={e => setNewBlog({...newBlog, coverImage: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta Keywords (Comma separated)</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="টফি প্রো, টফি পিসি" value={newBlog.keywords} onChange={e => setNewBlog({...newBlog, keywords: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Excerpt</label>
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]" placeholder="Brief summary..." value={newBlog.excerpt} onChange={e => setNewBlog({...newBlog, excerpt: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Content (HTML Supported)</label>
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[300px]" placeholder="Write your content here..." value={newBlog.content} onChange={e => setNewBlog({...newBlog, content: e.target.value})} />
                      </div>
                      <button onClick={addBlog} className="w-full py-4 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-amber-500 transition-all">
                        {editingId ? 'Update Information' : 'Deploy Article'}
                      </button>
                      {editingId && (
                         <button onClick={() => {setEditingId(null); setNewBlog({ title: '', slug: '', excerpt: '', content: '', coverImage: '', keywords: '' })}} className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
                            Abandon Edition
                         </button>
                      )}
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 flex items-center gap-2"><BookOpen size={20} className="text-amber-500" /> Published Content</h3>
                   <div className="grid sm:grid-cols-2 gap-6">
                      {blogs.map(blog => (
                         <div key={blog.id} className="bg-white rounded-[2rem] border border-black/5 overflow-hidden shadow-sm group hover:shadow-xl transition-all">
                            <div className="h-40 bg-slate-100 overflow-hidden relative font-bold text-slate-300 flex items-center justify-center">
                               {blog.coverImage && (
                                  <img src={blog.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                               )}
                               {!blog.coverImage && <BookOpen size={32} />}
                            </div>
                            <div className="p-6">
                               <h4 className="font-black text-sm uppercase italic text-slate-900 mb-2 line-clamp-1">{blog.title}</h4>
                               <p className="text-[10px] text-slate-400 font-bold mb-4 line-clamp-2">{blog.excerpt}</p>
                               <div className="flex gap-2">
                                  <button onClick={() => startEditBlog(blog)} className="flex-1 py-2 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Edit</button>
                                  <button onClick={() => deleteBlog(blog.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                               </div>
                            </div>
                         </div>
                      ))}
                      {blogs.length === 0 && <div className="col-span-2 py-20 bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300 font-black uppercase italic tracking-widest">Archive Empty</div>}
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
