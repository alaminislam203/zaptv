'use client';

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Create user doc in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role: 'USER',
        createdAt: new Date().toISOString(),
      });

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 bg-background relative overflow-hidden">
      {/* Decorative Blur Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-accent/20 blur-[100px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-12 rounded-[2.5rem] border border-black/5 shadow-2xl w-full max-w-[460px] z-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary"></div>
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
            <UserPlus className="text-primary" size={28} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Initialize_Core</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Create_Operator_Identity</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2 font-bold">
            <label className="text-slate-500 text-sm flex items-center gap-2">
              <User size={14} /> Full Name
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:text-slate-300" 
              placeholder="Operator Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 font-bold">
            <label className="text-slate-500 text-sm flex items-center gap-2">
              <Mail size={14} /> Email Address
            </label>
            <input 
              type="email" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:text-slate-300" 
              placeholder="operator@primecast.tv" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 font-bold">
            <label className="text-slate-500 text-sm flex items-center gap-2">
              <Lock size={14} /> Password
            </label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:text-slate-300" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full py-4 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs italic hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group" disabled={loading}>
            {loading ? 'Processing...' : <><UserPlus size={18} className="group-hover:translate-x-1 transition-transform" /> Register_Operator</>}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Already have an account? <Link href="/auth/login" className="text-primary hover:underline font-semibold ml-1">Log In</Link>
        </div>
      </motion.div>
    </div>
  );
}
