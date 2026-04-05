'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, UserPlus, Mail, Lock, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signInWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
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
        className="bg-white p-12 rounded-[2.5rem] border border-black/5 shadow-2xl w-full max-w-[440px] z-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary"></div>
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
            <LogIn className="text-primary" size={28} />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">PrimeCast_Core</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Access_Terminal_Initialized</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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

          <button type="submit" className="w-full py-4 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs italic hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group mb-4" disabled={loading}>
            {loading ? 'Processing...' : <><LogIn size={18} className="group-hover:translate-x-1 transition-transform" /> Establish_Connection</>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 rounded-xl border border-slate-200 text-slate-900 font-black uppercase tracking-widest text-[10px] italic hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 bg-white"
          disabled={loading}
        >
          <Chrome size={18} className="text-primary" /> Multi_Factor_Omni_Auth
        </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          Don't have an account? <Link href="/auth/signup" className="text-primary hover:underline font-semibold ml-1">Create One</Link>
        </div>
      </motion.div>
    </div>
  );
}
