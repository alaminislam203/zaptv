'use client';

import React from 'react';
import { Send, Facebook, Link as LinkIcon, Twitter } from 'lucide-react';

interface Props {
  url: string;
  title: string;
}

export default function BlogClientWrapper({ url, title }: Props) {
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : '';
  
  const handleShare = (platform: string) => {
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(fullUrl);
        alert('Uplink hash copied to clipboard!');
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex flex-col gap-3">
       <button onClick={() => handleShare('facebook')} className="flex items-center gap-3 w-full p-4 bg-[#1877F2]/10 text-[#1877F2] rounded-2xl hover:bg-[#1877F2] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-[#1877F2]/20">
          <Facebook size={16} /> Facebook Relay
       </button>
       <button onClick={() => handleShare('twitter')} className="flex items-center gap-3 w-full p-4 bg-slate-900/10 text-slate-900 rounded-2xl hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-slate-900/20">
          <Twitter size={16} /> Twitter Node
       </button>
       <button onClick={() => handleShare('telegram')} className="flex items-center gap-3 w-full p-4 bg-[#2ea6da]/10 text-[#2ea6da] rounded-2xl hover:bg-[#2ea6da] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-[#2ea6da]/20">
          <Send size={16} /> Telegram Proxy
       </button>
       <button onClick={() => handleShare('copy')} className="flex items-center gap-3 w-full p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200">
          <LinkIcon size={16} /> Copy URL Hash
       </button>
    </div>
  );
}
