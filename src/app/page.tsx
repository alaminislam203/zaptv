'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, auth } from '@/lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  orderBy, doc, setDoc 
} from 'firebase/firestore';
import { 
  MonitorOff, Package as PackageIcon, ShieldCheck, Clock, CreditCard, 
  CheckCircle, Key, ChevronRight, ChevronLeft, Zap, Monitor, Globe, Headphones, 
  Play, Download, Check, Copy, LogOut, ImageIcon, LayoutGrid, Tv, Shield, Radio, Trophy, Heart,
  Star, Facebook, Send, ChevronDown, ChevronUp, MessageCircle, X as CloseIcon, Send as SendIcon
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut as firebaseSignOut } from 'firebase/auth';

// Icon mapping helper
const IconMap: any = {
  Zap: <Zap className="text-amber-500" />,
  Monitor: <Monitor className="text-primary" />,
  Globe: <Globe className="text-emerald-500" />,
  Headphones: <Headphones className="text-accent" />,
  ShieldCheck: <ShieldCheck className="text-blue-500" />,
  Clock: <Clock className="text-slate-400" />,
  Play: <Play className="text-primary" />,
};

export default function Dashboard() {
  const { user, userData, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy');
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [downloadLink, setDownloadLink] = useState('https://primecast.tv/download');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [txId, setTxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMsg, setNewChatMsg] = useState('');
  const [guestId, setGuestId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Guest ID Check
    if (typeof window !== "undefined") {
      let gid = localStorage.getItem('primecast_guest_id');
      if (!gid) {
        gid = 'guest_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('primecast_guest_id', gid);
      }
      setGuestId(gid);
    }
    
    // 1. Fetch Plans
    const qPlans = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      if (!snapshot.empty) {
        setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setPlans([
          { id: 'p7', name: '7 Days Access', price: 0.29, duration: 7, color: '#00d2ff', note: 'Quick trial, low commitment' },
          { id: 'p15', name: '15 Days Access', price: 0.49, duration: 15, color: '#9d50bb', note: 'Best balance (Most Popular)' },
          { id: 'p30', name: '30 Days Access', price: 0.99, duration: 30, color: '#6e48aa', note: 'Best value, save more' },
        ]);
      }
    });

    // 2. Fetch Features
    const qFeatures = collection(db, 'features');
    const unsubFeatures = onSnapshot(qFeatures, (snapshot) => {
      if (!snapshot.empty) {
        setFeatures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setFeatures([
          { title: 'Instant Activation', desc: 'Secure your key immediately.', icon: 'Zap' },
          { title: 'Crystal Clear HD', desc: 'Stream in Ultra HD quality.', icon: 'Monitor' },
          { title: '24/7 Support', desc: ' Expert help when you need it.', icon: 'Headphones' },
        ]);
      }
    });

    // 3. Fetch Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setDownloadLink(docSnap.data().downloadLink);
      }
    });

    // 4. Fetch Banners
    const qBanners = collection(db, 'banners');
    const unsubBanners = onSnapshot(qBanners, (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPlans(); unsubFeatures(); unsubSettings(); unsubBanners();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const qPayments = query(collection(db, 'payments'), where('userId', '==', user.uid));
      const unsubPayments = onSnapshot(qPayments, (snapshot) => {
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      });

      const qKeys = query(collection(db, 'keys'), where('userId', '==', user.uid));
      const unsubKeys = onSnapshot(qKeys, (snapshot) => {
        const sortedKeys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setKeys(sortedKeys);
      });

      return () => {
        unsubPayments(); unsubKeys();
      };
    }
  }, [user]);

  // Support Chat Real-time Listener
  useEffect(() => {
    const currentId = user?.uid || guestId;
    if (currentId) {
      const qChat = query(
        collection(db, `support_chats/${currentId}/messages`),
        orderBy('timestamp', 'asc')
      );
      const unsubChat = onSnapshot(qChat, (snapshot) => {
        setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubChat();
    }
  }, [user, guestId]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPackage || !txId) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        userId: user.uid,
        userName: user.displayName || userData?.name || 'User',
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        txId: txId,
        status: 'PENDING',
        createdAt: serverTimestamp(),
      });
      setMessage({ type: 'success', text: 'অভিনন্দন! পেমেন্ট সফলভাবে সাবমিট হয়েছে। এডমিন ভেরিফাই করার পর আপনার একাউন্ট অথবা ইমেইলে কি (Access Key) পাঠিয়ে দেওয়া হবে।' });
      setTxId('');
      setTimeout(() => setSelectedPackage(null), 5000); // Increased duration to read the message
    } catch (err) {
      setMessage({ type: 'error', text: 'Error submitting payment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentId = user?.uid || guestId;
    if (!currentId || !newChatMsg.trim()) return;
    
    const msg = newChatMsg.trim();
    setNewChatMsg('');
    const userName = user?.displayName || userData?.name || 'Guest User';
    
    try {
      await addDoc(collection(db, `support_chats/${currentId}/messages`), {
        text: msg,
        senderId: currentId,
        senderName: userName,
        isAdmin: false,
        timestamp: serverTimestamp()
      });
      
      // Update chat meta
      await setDoc(doc(db, 'support_chats', currentId), {
        lastMessage: msg,
        lastTimestamp: serverTimestamp(),
        userName: userName,
        userId: currentId,
        unreadCountAdmin: 1
      }, { merge: true });
      
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  if (!mounted) return null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="bg-white text-slate-900 min-h-screen overflow-x-hidden selection:bg-primary/20 font-sans">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="p-2.5 bg-slate-900 rounded-xl group-hover:rotate-12 transition-transform duration-500">
                <Zap className="text-primary" size={24} />
              </div>
              <span className="text-2xl font-black italic uppercase tracking-tighter group-hover:tracking-normal transition-all duration-500">PrimeCast TV</span>
            </div>
            <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <a href="#features" className="hover:text-primary transition-colors">Features</a>
                <a href="#guide" className="hover:text-primary transition-colors">Activation Guide</a>
                <a href="#pricing" className="hover:text-primary transition-colors">Service Plans</a>
                <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            </div>
            <div className="flex items-center gap-3 font-bold">
              <Link href="/auth/login" className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
              <Link href="/auth/signup" className="px-6 py-2.5 rounded-xl text-white bg-slate-900 shadow-xl shadow-slate-900/10 hover:bg-primary transition-all text-sm uppercase tracking-widest font-black italic">Initialize</Link>
            </div>
          </div>
        </nav>

        {/* Server Status Widget */}
        <section className="bg-white border-b border-black/5 py-4 px-6 overflow-hidden">
           <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-3 whitespace-nowrap">
                 <div className="relative">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">All Systems Operational</span>
                 <span className="text-[10px] font-bold text-slate-300">|</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uptime: 99.99%</span>
              </div>
              <div className="flex items-center gap-6 whitespace-nowrap">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active nodes:</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase">128 Secure Relays</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Load:</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Normal</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-slate-50">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
             <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-8">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Version 4.2 Stable Release
                </div>
                <h1 className="text-6xl md:text-8xl font-black mb-8 italic uppercase leading-[0.85] tracking-tighter text-slate-900">
                  Ultimate <br/> <span className="text-primary outline-text">Streaming</span> <br/> Engine.
                </h1>
                <p className="text-slate-500 font-bold mb-12 max-w-xl text-lg leading-relaxed">
                  PrimeCast is the industry-standard Live TV software. Access 1000+ global channels with military-grade encryption and zero-latency relay technology. 
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/auth/signup" className="px-10 py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest italic shadow-2xl hover:bg-primary transition-all active:scale-95 flex items-center gap-3">
                    Establish Connection <ChevronRight size={18} />
                  </Link>
                  <a href={downloadLink} className="px-10 py-5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-widest italic shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95">
                    <Download size={20} className="text-primary" /> Download Windows
                  </a>
                </div>
             </motion.div>
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative">
                <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full opacity-30 animate-pulse"></div>
                <img src="/primecast_software_hero_1775284383214.png" alt="PrimeCast Software" className="relative transition-transform duration-700 hover:scale-[1.02]" />
             </motion.div>
          </div>
        </section>

        {/* Dynamic Banners Section */}
        {banners.length > 0 && (
          <section className="py-10 px-6 bg-slate-50">
            <div className="max-w-7xl mx-auto">
               <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentBannerIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative rounded-[3rem] overflow-hidden bg-slate-900 aspect-[25/9] flex items-center group shadow-2xl border border-black/5"
                  >
                    {banners[currentBannerIndex].image && (
                      <img src={banners[currentBannerIndex].image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 group-hover:scale-100 transition-transform duration-1000" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent"></div>
                    <div className="relative z-10 p-12 md:p-16 max-w-xl">
                      <h3 className="text-white font-black text-4xl md:text-5xl uppercase italic italic leading-none mb-4">{banners[currentBannerIndex].title}</h3>
                      <p className="text-slate-300 font-bold mb-8 line-clamp-2 md:text-base text-sm">{banners[currentBannerIndex].subtitle}</p>
                      <Link href={banners[currentBannerIndex].link} className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-900 transition-all italic">Start Streaming <ChevronRight size={14}/></Link>
                    </div>
                  </motion.div>
               </AnimatePresence>
            </div>
          </section>
        )}

        {/* Experience Section */}
        <section id="features" className="py-40 px-6 bg-white overflow-hidden relative border-b border-black/5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
             <div className="order-2 lg:order-1 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                <img src="/primecast_tv_mockup_1775284359300.png" alt="Interface mock" className="relative rounded-[2rem] shadow-2xl skew-y-[-2deg] hover:skew-y-0 transition-transform duration-700" />
             </div>
             <div className="order-1 lg:order-2">
                <h2 className="text-5xl font-black mb-8 uppercase italic tracking-tighter text-slate-900">Total Entertainment <br/> <span className="text-primary italic">Architecture.</span></h2>
                <div className="grid sm:grid-cols-2 gap-6 items-start">
                   {[
                     { icon: <Tv size={24} />, title: "Live TV Channels", desc: "Stream 1000+ global channels in crystal clear HD quality." },
                     { icon: <Radio size={24} />, title: "Live Radio Stations", desc: "Enjoy premium FM and online radio from around the world." },
                     { icon: <Trophy size={24} />, title: "Live Match Updates", desc: "Real-time scores and updates for all your favorite sports." },
                     { icon: <Zap size={24} />, title: "Dedicated Sports", desc: "Specialized sports channels for non-stop action." },
                     { icon: <Heart size={24} />, title: "Add to Favorites", desc: "Save your top channels for quick and easy access." },
                     { icon: <LayoutGrid size={24} />, title: "Smart EPG Guide", desc: "Complete electronic program guide for all schedules." }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-4 items-start group p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-black/5">
                        <div className="p-3 bg-white rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-black/5">
                           {item.icon}
                        </div>
                        <div>
                           <h4 className="text-base font-black mb-1 uppercase italic tracking-tight">{item.title}</h4>
                           <p className="text-slate-500 font-bold text-[10px] leading-relaxed line-clamp-2">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-40 px-6 bg-slate-50 border-b border-black/5">
           <div className="max-w-7xl mx-auto">
              <div className="text-center mb-24">
                 <h2 className="text-5xl font-black mb-4 uppercase italic tracking-tighter">User Experience</h2>
                 <p className="text-slate-500 font-bold max-w-xl mx-auto text-xs uppercase tracking-widest">What our global community has to say</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { name: "Rafsan Ahmed", role: "Sports Enthusiast", text: "The dedicated sports channels are a game changer. Super fast match updates and no buffering during live games. Best IPTV I've used.", stars: 5 },
                   { name: "Sajid Hasan", role: "Premium Operator", text: "Crystal clear HD quality for Live TV. The Favorites feature makes it so easy to access my top news channels. Highly recommended!", stars: 5 },
                   { name: "Taskin Rahim", role: "Multi-Device User", text: "Setting it up was so simple. The 3-step guide is spot on. The support team on Telegram is also very helpful. Exceptional service.", stars: 5 }
                 ].map((rev, i) => (
                   <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex gap-1 mb-8">
                         {[...Array(rev.stars)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                      </div>
                      <p className="text-slate-600 font-bold text-sm leading-relaxed mb-10 italic">"{rev.text}"</p>
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-primary font-black italic">{rev.name[0]}</div>
                         <div>
                            <h4 className="text-sm font-black uppercase italic text-slate-900">{rev.name}</h4>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{rev.role}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Community Bridge Section */}
        <section className="py-20 px-6 bg-white">
           <div className="max-w-7xl mx-auto">
              <div className="p-16 rounded-[3rem] bg-slate-900 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                 <div className="relative z-10 max-w-xl text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase italic tracking-tighter leading-none">Join the Global <span className="text-primary italic">Community.</span></h2>
                    <p className="text-slate-400 font-bold text-sm leading-relaxed">Stay updated with channel releases, server maintenance notifications, and premium support 24/7.</p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto">
                    <a href="https://www.facebook.com/infoxbangla" target="_blank" rel="noopener noreferrer" className="px-10 py-5 rounded-2xl bg-[#1877F2] text-white font-black uppercase tracking-widest text-[10px] italic shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                       <Facebook size={20} /> Facebook Page
                    </a>
                    <a href="https://t.me/toffeepro" target="_blank" rel="noopener noreferrer" className="px-10 py-5 rounded-2xl bg-[#2ea6da] text-white font-black uppercase tracking-widest text-[10px] italic shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                       <Send size={20} /> Telegram Group
                    </a>
                 </div>
              </div>
           </div>
        </section>

        {/* Guide Section */}
        <section id="guide" className="py-40 px-6 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-24 max-w-2xl mx-auto">
                <h2 className="text-5xl font-black mb-6 uppercase italic tracking-tighter">Activation Protocol</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Start your premium experience in minutes</p>
             </div>
             <div className="grid md:grid-cols-3 gap-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block"></div>
                {[
                  { step: "01", title: "Get the App", desc: "Download the PrimeCast Windows software from our secure servers.", icon: <Download /> },
                  { step: "02", title: "Select a Plan", desc: "Initialize an account and select your preferred access duration from our portal.", icon: <Zap /> },
                  { step: "03", title: "Activate Now", desc: "Enter your secure license key into the software and start watching immediately.", icon: <Key /> }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-xl relative z-10 text-center group hover:-translate-y-2 transition-all">
                     <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-primary mb-8 mx-auto -mt-16 border-4 border-slate-50 shadow-2xl group-hover:bg-primary group-hover:text-white transition-all">
                        {s.icon}
                     </div>
                     <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] mb-4 block">Step {s.step}</span>
                     <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tight">{s.title}</h3>
                     <p className="text-slate-500 font-bold text-sm leading-relaxed">{s.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-40 px-6 bg-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-24">
                <h2 className="text-5xl font-black mb-4 uppercase italic tracking-tighter">Premium Access</h2>
                <p className="text-slate-500 font-bold max-w-xl mx-auto mb-16 text-sm">Select your license level to unlock the full potential of PrimeCast Core.</p>
             </div>
             <div className="grid md:grid-cols-3 gap-8">
                {plans.map((pkg) => {
                  const isPopular = pkg.duration === 15;
                  const isBestValue = pkg.duration === 30;
                  return (
                    <div key={pkg.id} className={`p-10 rounded-[2.5rem] bg-white border transition-all hover:shadow-2xl relative group flex flex-col items-center text-center ${isPopular ? 'border-primary shadow-xl scale-105 z-10' : 'border-black/5'}`}>
                      {isPopular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Most Popular</div>}
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 bg-slate-50 border border-black/5 group-hover:bg-white group-hover:scale-110 transition-all">
                        <PackageIcon size={40} style={{ color: pkg.color }} />
                      </div>
                      <h3 className="text-3xl font-black mb-2 italic uppercase text-slate-900">{pkg.name}</h3>
                      <div className="flex items-baseline gap-2 mb-4 text-slate-900">
                         <span className="text-6xl font-black tracking-tighter">${pkg.price}</span>
                         <span className="text-[10px] font-black uppercase opacity-40">USD</span>
                      </div>
                      <p className="text-slate-500 font-bold text-xs mb-6">{pkg.note}</p>
                      {isBestValue && <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-6">👉 Save 30% compared to weekly</p>}
                      <ul className="space-y-4 mb-10 text-left w-full">
                        <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400"><Check size={14} className="text-primary" /> Full Matrix Access</li>
                        <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400"><Check size={14} className="text-primary" /> Encrypted Protocol</li>
                        <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400"><Check size={14} className="text-primary" /> 4K Node Uplink</li>
                      </ul>
                      <Link href="/auth/signup" className="w-full mt-auto py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] italic shadow-xl hover:bg-primary transition-all active:scale-95">
                        Get Your License
                      </Link>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-40 px-6 bg-slate-50 border-t border-black/5">
           <div className="max-w-4xl mx-auto">
              <div className="text-center mb-24">
                 <h2 className="text-5xl font-black mb-4 uppercase italic tracking-tighter text-slate-900">General Information</h2>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-16">Frequently Asked Questions</p>
              </div>
              <div className="space-y-4">
                 {[
                   { q: "How many devices can I use at once?", a: "Each PrimeCast license key supports one active session at a time. To watch on multiple devices simultaneously, you will need a separate license for each device." },
                   { q: "What internet speed is required for HD?", a: "We recommend at least 5-10 Mbps for stable HD streaming and 25 Mbps+ for Ultra HD (4K) content to ensure a buffer-free experience." },
                   { q: "Do you support bKash or Nagad payments?", a: "Yes! While our portal uses USD for standardized pricing, you can pay via bKash or Nagad by contacting our support team directly on Telegram or Facebook." },
                   { q: "Is the software compatible with all Windows versions?", a: "PrimeCast is optimized for Windows 10 and Windows 11. Make sure your system is up to date for the best performance and security." }
                 ].map((faq, i) => (
                   <div key={i} className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                        className="w-full p-8 flex items-center justify-between transition-colors hover:bg-slate-50"
                      >
                         <h4 className="text-lg font-black uppercase italic text-slate-900 text-left">{faq.q}</h4>
                         <div className={`p-2 rounded-xl bg-slate-100 text-slate-900 transition-transform duration-500 ${activeFaq === i ? 'rotate-180 bg-primary text-white' : ''}`}>
                            <ChevronDown size={20} />
                         </div>
                      </button>
                      <AnimatePresence>
                         {activeFaq === i && (
                           <motion.div 
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: "auto", opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             transition={{ duration: 0.4, ease: "circOut" }}
                           >
                             <div className="p-8 pt-0 text-slate-500 font-bold text-sm leading-relaxed border-t border-black/5">
                                {faq.a}
                             </div>
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Support Section */}
        <section className="py-32 px-6 bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.05),transparent)] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
             <h2 className="text-3xl md:text-5xl font-black mb-8 uppercase italic tracking-tighter text-white">Need Support?</h2>
             <p className="text-slate-400 font-bold mb-12 max-w-xl mx-auto text-sm leading-relaxed">Our technical support team is available 24/7 to ensure your streaming experience is perfect.</p>
             <div className="flex justify-center gap-6">
                <a href="https://t.me/primecast_support" className="px-8 py-4 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] italic shadow-2xl hover:bg-white hover:text-slate-900 transition-all flex items-center gap-3">
                   <Headphones size={18} /> Contact Support
                </a>
             </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white text-slate-900 py-24 px-6 border-t border-black/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <Zap size={24} className="text-primary" />
              </div>
              <span className="text-3xl font-black italic uppercase tracking-tighter">PrimeCast TV</span>
            </div>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-slate-900 transition-colors">Terms of Use</a>
               <Link href="/blog" className="hover:text-slate-900 transition-colors">Latest Blog</Link>
               <a href="#" className="hover:text-slate-900 transition-colors">Server Status</a>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">© 2026 PRIME CAST CORE</p>
          </div>
        </footer>

        {/* Support Chat Widget */}
        {mounted && (
          <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            <AnimatePresence>
              {isChatOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="mb-4 w-80 md:w-96 bg-white rounded-[2.5rem] shadow-2xl border border-black/5 flex flex-col overflow-hidden"
                >
                  {/* Chat Header */}
                  <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                           <Headphones size={20} />
                        </div>
                        <div>
                           <h4 className="text-sm font-black uppercase italic tracking-tight">Direct Support</h4>
                           <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                              Admin Online
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <CloseIcon size={20} />
                     </button>
                  </div>

                  {/* Chat Messages */}
                  <div className="h-80 overflow-y-auto p-6 space-y-4 bg-slate-50/50 flex flex-col no-scrollbar">
                     {chatMessages.length === 0 && (
                       <div className="flex-grow flex flex-col items-center justify-center text-center p-8 opacity-30 italic">
                          <MessageCircle size={32} className="mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">No messages yet. Send a request to connect with an operator.</p>
                       </div>
                     )}
                     {chatMessages.map((msg, i) => (
                       <div key={i} className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold ${msg.isAdmin ? 'bg-white border border-black/5 text-slate-800 rounded-tl-none' : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'}`}>
                             {msg.text}
                          </div>
                          <span className="text-[8px] font-black uppercase text-slate-400 mt-1 opacity-50 px-1">
                            {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          </span>
                       </div>
                     ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={sendChatMessage} className="p-4 bg-white border-t border-black/5 flex gap-2">
                     <input 
                        type="text" 
                        value={newChatMsg}
                        onChange={(e) => setNewChatMsg(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                     />
                     <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-primary transition-all shadow-lg active:scale-90">
                        <SendIcon size={18} />
                     </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group ${isChatOpen ? 'bg-white text-slate-900 border border-black/5' : 'bg-slate-900 text-white'}`}
            >
              {isChatOpen ? <CloseIcon size={28} /> : <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />}
              {!isChatOpen && (
                <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-lg animate-bounce"></div>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  const activePlanName = keys.find(k => !k.isUsed)?.packageName;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 selection:bg-primary/20">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-lg">
                <Zap size={20} className="text-primary" />
             </div>
             <h1 className="text-2xl font-black italic uppercase tracking-tighter">Terminal</h1>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
             <Link href="/blog" className="hover:text-primary transition-colors">Media Lab</Link>
          </div>
          <div className="flex items-center gap-4">
            {userData?.role === 'ADMIN' && (
              <Link href="/admin" className="px-5 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">ADMIN_PANEL</Link>
            )}
            <button onClick={() => firebaseSignOut(auth)} className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <header className="mb-16">
           <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4 text-slate-900">Uplink Control</h2>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
             Operator Status: <span className="text-slate-900">{user.displayName || userData?.name}</span>
           </p>
        </header>

        <div className="flex gap-2 mb-16 p-1.5 bg-slate-900/5 rounded-3xl w-fit border border-black/5">
          <button onClick={() => setActiveTab('buy')} className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'buy' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Provision_Key</button>
          <button onClick={() => setActiveTab('history')} className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Active_Matrix</button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'buy' ? (
            <motion.div key="buy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {!selectedPackage ? (
                <div className="grid md:grid-cols-3 gap-8">
                  {plans.map((pkg) => {
                     const isActive = activePlanName === pkg.name;
                     const isPopular = pkg.duration === 15;
                     const isBestValue = pkg.duration === 30;
                     return (
                        <div key={pkg.id} className={`p-10 rounded-[2.5rem] border transition-all group relative overflow-hidden flex flex-col ${isActive ? 'bg-slate-900 border-transparent shadow-2xl' : isPopular ? 'bg-white border-primary shadow-xl scale-105 z-10' : 'bg-white border-black/5 hover:shadow-2xl'}`}>
                          {isActive && <div className="absolute top-6 right-6 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Active</div>}
                          {isPopular && !isActive && <div className="absolute top-6 right-6 bg-primary text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Most Popular</div>}
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-colors ${isActive ? 'bg-white/10 border-white/10' : 'bg-slate-50 border-black/5 group-hover:bg-primary/10'}`}>
                            <PackageIcon size={32} style={{ color: pkg.color }} />
                          </div>
                          <h3 className={`text-3xl font-black mb-2 italic uppercase ${isActive ? 'text-white' : 'text-slate-900'}`}>{pkg.name}</h3>
                          <div className={`flex items-baseline gap-2 mb-4 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                             <span className="text-6xl font-black tracking-tighter">${pkg.price}</span>
                             <span className="text-[10px] font-black uppercase opacity-40">USD</span>
                          </div>
                          <p className={`text-xs font-bold mb-4 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{pkg.note}</p>
                          {isBestValue && <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-6">👉 Save 30% compared to weekly</p>}
                          <ul className={`space-y-4 mb-12 flex-grow ${isActive ? 'text-white/50' : 'text-slate-400'}`}>
                            <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"><Check size={14} className="text-primary" /> Full Matrix Access</li>
                            <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"><Check size={14} className="text-primary" /> Encrypted Protocol</li>
                            <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest"><Check size={14} className="text-primary" /> 4K Node Uplink</li>
                          </ul>
                          <button 
                            onClick={() => !isActive && setSelectedPackage(pkg)} 
                            disabled={isActive}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${isActive ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-primary active:scale-95'}`}
                          >
                            {isActive ? 'Current_Plan' : 'Provision_Access'}
                          </button>
                        </div>
                     );
                  })}
                </div>
              ) : (
                <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-black/5 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]"></div>
                   <button onClick={() => {setSelectedPackage(null); setMessage({type:'', text:''})}} className="text-primary text-[10px] font-black uppercase mb-12 flex items-center gap-2 hover:translate-x-[-4px] transition-all group">
                     <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20">←</div> Return_to_Matrix
                   </button>
                   <h2 className="text-4xl font-black mb-2 uppercase italic tracking-tighter text-slate-900">Uplink Encryption</h2>
                   <p className="text-slate-400 text-xs font-bold uppercase mb-16">Provisioning Level: <span className="text-primary">{selectedPackage.name}</span></p>
                   
                   <div className="bg-slate-50 p-12 rounded-[2.5rem] mb-12 text-center border border-black/5 relative group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.4em]">Binance_Pay_Recipient</p>
                      <p className="text-5xl font-black tracking-[0.2em] text-slate-900 select-all cursor-copy">487638075</p>
                   </div>

                   <form onSubmit={handlePurchase} className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">TXID_Transfer_Hash</label>
                        <input className="w-full bg-white border border-slate-200 shadow-inner rounded-2xl px-6 py-5 text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono text-center text-lg placeholder:opacity-30" placeholder="PASTE_HASH_HERE" value={txId} onChange={(e) => setTxId(e.target.value)} required />
                      </div>
                      <button type="submit" className="w-full py-6 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.4em] text-xs italic hover:bg-emerald-500 transition-all shadow-2xl flex items-center justify-center gap-4 group" disabled={submitting}>
                        {submitting ? 'VALIDATING...' : <><Zap size={20} className="group-hover:animate-pulse" /> Establish_Uplink</>}
                      </button>
                      {message.text && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                           {message.type === 'success' ? <CheckCircle size={20} /> : <MonitorOff size={20} />}
                           {message.text}
                        </motion.div>
                      )}
                   </form>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                {keys.map((k) => (
                  <div key={k.id} className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm relative group overflow-hidden hover:shadow-2xl transition-all">
                    <div className="absolute top-0 left-0 w-1 bg-primary h-full opacity-50 group-hover:opacity-100"></div>
                    <div className="flex justify-between items-center mb-10 relative z-10">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-black/5 text-primary shadow-inner"><Key size={24} /></div>
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black tracking-widest ${k.isUsed ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>{k.isUsed ? 'EXPIRED_KEY' : 'OPERATIONAL'}</span>
                    </div>
                    <div className="mb-10 relative z-10">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Access_Hash</p>
                      <div className="text-3xl font-black font-mono tracking-tighter text-slate-900 flex items-center justify-between">
                        {k.key}
                        <button onClick={() => handleCopyKey(k.key)} className="p-2.5 bg-slate-50 hover:bg-primary hover:text-white rounded-xl transition-all text-slate-300">
                          {copiedKey === k.key ? <Check size={20} /> : <Copy size={24} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-300 relative z-10">
                       <span>{k.packageName}</span>
                       <span>Sync: {new Date(k.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {keys.length === 0 && (
                   <div className="col-span-full py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                      <p className="text-slate-300 font-black uppercase tracking-[0.5em] italic">No Matrix Keys Found</p>
                   </div>
                )}
              </div>

              <div className="bg-white rounded-[3rem] border border-black/5 overflow-hidden shadow-xl">
                 <div className="p-10 border-b border-black/5 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Transaction_Log</h3>
                    <div className="px-5 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">{payments.length} Records</div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Protocol</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Hash_ID</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cycle</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {payments.map((p) => (
                           <tr key={p.id} className="hover:bg-slate-50 transition-colors font-bold group">
                             <td className="px-10 py-8">
                               <div className="font-black text-sm uppercase text-slate-800">{p.packageName}</div>
                               <div className="text-[10px] text-primary font-black uppercase tracking-widest">${p.price} USDT</div>
                             </td>
                             <td className="px-10 py-8 font-mono text-xs text-slate-400 group-hover:text-slate-900 transition-colors">{p.txId}</td>
                             <td className="px-10 py-8 text-[10px] font-black uppercase text-slate-400">{new Date(p.createdAt?.seconds * 1000).toLocaleString()}</td>
                             <td className="px-10 py-8 text-right">
                               <div className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest inline-block ${
                                 p.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
                                 p.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 
                                 'bg-amber-50 text-amber-600'
                               }`}>
                                 {p.status}
                               </div>
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Support Chat Widget */}
      {mounted && (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="mb-4 w-80 md:w-96 bg-white rounded-[2.5rem] shadow-2xl border border-black/5 flex flex-col overflow-hidden"
              >
                {/* Chat Header */}
                <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                         <Headphones size={20} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black uppercase italic tracking-tight">Direct Support</h4>
                         <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                            Admin Online
                         </p>
                      </div>
                   </div>
                   <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <CloseIcon size={20} />
                   </button>
                </div>

                {/* Chat Messages */}
                <div className="h-80 overflow-y-auto p-6 space-y-4 bg-slate-50/50 flex flex-col no-scrollbar">
                   {chatMessages.length === 0 && (
                     <div className="flex-grow flex flex-col items-center justify-center text-center p-8 opacity-30 italic">
                        <MessageCircle size={32} className="mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">No messages yet. Send a request to connect with an operator.</p>
                     </div>
                   )}
                   {chatMessages.map((msg, i) => (
                     <div key={i} className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold ${msg.isAdmin ? 'bg-white border border-black/5 text-slate-800 rounded-tl-none' : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'}`}>
                           {msg.text}
                        </div>
                        <span className="text-[8px] font-black uppercase text-slate-400 mt-1 opacity-50 px-1">
                          {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                     </div>
                   ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={sendChatMessage} className="p-4 bg-white border-t border-black/5 flex gap-2">
                   <input 
                      type="text" 
                      value={newChatMsg}
                      onChange={(e) => setNewChatMsg(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                   />
                   <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-primary transition-all shadow-lg active:scale-90">
                      <SendIcon size={18} />
                   </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group ${isChatOpen ? 'bg-white text-slate-900 border border-black/5' : 'bg-slate-900 text-white'}`}
          >
            {isChatOpen ? <CloseIcon size={28} /> : <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />}
            {!isChatOpen && (
              <div className="absolute top-0 right-0 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-lg animate-bounce"></div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
