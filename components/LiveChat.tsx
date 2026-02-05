"use client";
import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, serverTimestamp, query, limitToLast } from "firebase/database";
import { rtdb } from "../src/app/firebase";
import { MessageSquare, Send, User } from "lucide-react";

interface LiveChatProps {
  channelId: string;
}

export default function LiveChat({ channelId }: LiveChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRef = query(ref(rtdb, `chats/${channelId}`), limitToLast(50));
    const unsub = onValue(chatRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setMessages(Object.values(data));
      }
    });
    return () => unsub();
  }, [channelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    push(ref(rtdb, `chats/${channelId}`), {
      text: input,
      sender: "Anonymous", // Will integrate auth later
      timestamp: serverTimestamp(),
    });
    setInput("");
  };

  return (
    <div className="glass rounded-[2.5rem] border-white/5 h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          Live Chat
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <MessageSquare className="w-12 h-12 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Start the conversation</p>
            </div>
        ) : (
            messages.map((msg, idx) => (
                <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">{msg.sender}</p>
                        <div className="bg-slate-900 border border-white/5 p-3 rounded-2xl rounded-tl-none">
                            <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      <form onSubmit={sendMessage} className="p-6 bg-slate-950/50 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
        <button type="submit" className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
