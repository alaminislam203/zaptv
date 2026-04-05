import React from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { Zap, Clock, User, ArrowLeft, Calendar, Share2, BookOpen } from 'lucide-react';
import Link from 'next/link';

// Component for the blog content (Client Component for sharing etc.)
import BlogClientWrapper from '@/app/blog/[slug]/BlogClientWrapper';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string) {
  const q = query(
    collection(db, 'blogs'),
    where('slug', '==', slug),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as any;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogPost(slug);
  
  if (!blog) return { title: 'Post Not Found | PrimeCast TV' };
  
  return {
    title: `${blog.title} | PrimeCast TV Blog`,
    description: blog.excerpt,
    keywords: blog.keywords?.join(', '),
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : [],
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const blog = await getBlogPost(slug);
  
  if (!blog) notFound();

  const formattedDate = blog.createdAt 
    ? new Date(blog.createdAt.seconds * 1000).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '---';

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
          <div className="hidden md:flex items-center gap-6">
            <Link href="/blog" className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
               <ArrowLeft size={14} /> All Articles
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="pt-40 pb-20 px-6 bg-white border-b border-black/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
           <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg"><Calendar size={12} className="text-primary"/> {formattedDate}</span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg"><User size={12} className="text-primary"/> Staff Author</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black mb-8 italic uppercase tracking-tighter leading-tight text-slate-900">
             {blog.title}
           </h1>
           <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto leading-relaxed border-l-4 border-primary pl-6 text-left">
             {blog.excerpt}
           </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto py-20 px-6">
         {/* Featured Image */}
         {blog.coverImage && (
           <div className="mb-20 rounded-[3rem] overflow-hidden shadow-2xl border border-black/5 aspect-video">
              <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
           </div>
         )}

         {/* Article Body */}
         <div className="grid lg:grid-cols-4 gap-16">
            <div className="lg:col-span-3">
               <div 
                 className="prose prose-slate prose-lg max-w-none 
                 prose-h2:text-3xl prose-h2:font-black prose-h2:uppercase prose-h2:tracking-tighter prose-h2:italic
                 prose-p:text-slate-600 prose-p:font-medium prose-p:leading-loose
                 prose-strong:font-black prose-strong:text-slate-900
                 prose-img:rounded-3xl prose-img:shadow-xl
                 font-sans"
                 dangerouslySetInnerHTML={{ __html: blog.content }}
               />
               
               {/* Keywords / Tags */}
               <div className="mt-20 pt-10 border-t border-black/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6">Subject_Relays</h4>
                  <div className="flex flex-wrap gap-2">
                     {blog.keywords?.map((k: string, i: number) => (
                       <span key={i} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-primary hover:text-primary transition-all cursor-default">
                         #{k}
                       </span>
                     ))}
                  </div>
               </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-12">
               <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Share2 size={14} className="text-primary" /> Transmit</h4>
                  <p className="text-[10px] font-bold text-slate-500 mb-6">Spread the PrimeCast protocol to your network.</p>
                  <BlogClientWrapper url={`/blog/${blog.slug}`} title={blog.title} />
               </div>

               <div className="bg-slate-900 p-8 rounded-3xl shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <h4 className="text-white font-black text-lg uppercase italic mb-4 relative z-10">Start Streaming</h4>
                  <p className="text-slate-400 font-bold text-[10px] mb-8 relative z-10">Unlock 1000+ premium channels with zero latency.</p>
                  <Link href="/" className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[8px] italic flex items-center justify-center gap-2 relative z-10 hover:bg-white hover:text-slate-900 transition-all">
                    Initialize Setup <Zap size={12} />
                  </Link>
               </div>
            </aside>
         </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Zap size={24} className="text-primary" />
            </div>
            <span className="text-3xl font-black italic uppercase tracking-tighter">PrimeCast TV</span>
          </Link>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <Link href="/blog" className="hover:text-white transition-colors">Archive</Link>
             <Link href="/" className="hover:text-white transition-colors">Portal Home</Link>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">© 2026 PRIME CAST CORE</p>
        </div>
      </footer>
    </div>
  );
}
