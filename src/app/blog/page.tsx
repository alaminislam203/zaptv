'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Zap, BookOpen, ChevronRight, Clock, User, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlogListing() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubBlogs = onSnapshot(qBlogs, (snapshot) => {
      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubBlogs();
  }, []);

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.keywords?.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!mounted) return null;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 selection:bg-primary/20 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-slate-900 rounded-xl group-hover:rotate-12 transition-transform duration-500">
              <Zap className="text-primary" size={24} />
            </div>
            <span className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">PrimeCast TV</span>
          </Link>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <Link href="/" className="hover:text-primary transition-colors">Home</Link>
             <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
             <Link href="/#guide" className="hover:text-primary transition-colors">Guide</Link>
             <Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3 font-bold">
            <Link href="/auth/login" className="px-6 py-2.5 rounded-xl text-white bg-slate-900 shadow-xl shadow-slate-900/10 hover:bg-primary transition-all text-sm uppercase tracking-widest font-black italic">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-40 pb-20 px-6 bg-white overflow-hidden relative border-b border-black/5">
        <div className="max-w-7xl mx-auto relative z-10">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center max-w-3xl mx-auto"
           >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-8">
                <BookOpen size={14} /> Official PrimeCast Insight
              </div>
              <h1 className="text-6xl md:text-8xl font-black mb-8 italic uppercase leading-[0.85] tracking-tighter text-slate-900">
                PrimeCast <br/> <span className="text-primary italic">Media</span> Lab.
              </h1>
              <p className="text-slate-500 font-bold mb-12 text-lg leading-relaxed uppercase tracking-wide">
                টফি প্রো, টফি পিসি এবং আপনার প্রিয় সব চ্যানেলের টিপস, ট্রিক্স এবং লেটেস্ট আপডেট।
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto group">
                 <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                 <div className="relative flex items-center bg-white border border-slate-200 rounded-3xl p-2 shadow-xl">
                    <div className="pl-6 text-slate-400">
                       <Search size={22} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search articles (e.g. Toffee, PC TV)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-4 bg-transparent text-slate-900 font-bold outline-none placeholder:text-slate-300"
                    />
                    <button className="px-8 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] italic shadow-lg hover:bg-primary transition-all">Search</button>
                 </div>
              </div>
           </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
      </header>

      {/* Blog Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="bg-white rounded-[2.5rem] h-[450px] border border-black/5 animate-pulse"></div>
             ))}
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredBlogs.map((blog, i) => (
                <motion.article 
                  key={blog.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-sm hover:shadow-2xl transition-all group cursor-pointer"
                >
                  <Link href={`/blog/${blog.slug}`}>
                    <div className="h-60 overflow-hidden relative">
                       {blog.coverImage ? (
                         <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                       ) : (
                         <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                           <BookOpen size={48} />
                         </div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute bottom-6 left-8 flex gap-2">
                          {blog.keywords?.slice(0, 2).map((k: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-[8px] font-black uppercase tracking-widest">{k}</span>
                          ))}
                       </div>
                    </div>
                    <div className="p-10">
                       <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">
                          <span className="flex items-center gap-1"><Clock size={12} className="text-primary"/> {blog.createdAt ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString() : '---'}</span>
                          <span className="flex items-center gap-1"><User size={12} className="text-primary"/> Admin</span>
                       </div>
                       <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title}
                       </h2>
                       <p className="text-slate-500 font-bold text-sm mb-8 line-clamp-3 leading-relaxed">
                          {blog.excerpt}
                       </p>
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover:translate-x-2 transition-transform duration-500">
                          Read Strategy <ChevronRight size={14} className="text-primary" />
                       </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-40 text-center opacity-30 italic">
             <Search size={64} className="mx-auto mb-8" />
             <h3 className="text-2xl font-black uppercase tracking-tighter">Archive Mismatch</h3>
             <p className="text-xs font-bold uppercase tracking-widest mt-2">No articles match your search protocol.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-24 px-6 overflow-hidden relative">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Zap size={24} className="text-primary" />
            </div>
            <span className="text-3xl font-black italic uppercase tracking-tighter">PrimeCast TV</span>
          </Link>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <Link href="/" className="hover:text-white transition-colors">Home</Link>
             <Link href="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
             <a href="#" className="hover:text-white transition-colors">Server Status</a>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">© 2026 PRIME CAST CORE</p>
        </div>
      </footer>
    </div>
  );
}
