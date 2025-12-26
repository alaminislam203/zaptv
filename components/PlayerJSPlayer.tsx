"use client";
import React, { useEffect, useRef } from "react";

interface PlayerJSProps {
  src: string;
  poster?: string;
}

const PlayerJSPlayer: React.FC<PlayerJSProps> = ({ src, poster }) => {
  // একটি ইউনিক আইডি তৈরি করা হচ্ছে যাতে প্লেয়ারটি সঠিকভাবে রেন্ডার হয়
  const containerId = "playerjs_container"; 

  useEffect(() => {
    let playerInstance: any = null;

    const initPlayer = () => {
      if ((window as any).Playerjs) {
        try {
          // প্লেয়ার ইনিশিয়াল করা
          playerInstance = new (window as any).Playerjs({
            id: containerId,
            file: src,
            poster: poster || "",
            autoplay: 1, // অটোমেটিক প্লে
            // কোনো কাস্টম কনফিগারেশন থাকলে এখানে দিতে পারেন
          });
        } catch (e) {
          console.error("PlayerJS Error:", e);
        }
      }
    };

    // স্ক্রিপ্ট লোড করা (যদি আগে লোড না হয়ে থাকে)
    const scriptId = "playerjs-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "/playerjs-21.1.2.js"; // public ফোল্ডারের ফাইল পাথ
      script.id = scriptId;
      script.async = true;
      script.onload = initPlayer;
      document.body.appendChild(script);
    } else {
      // স্ক্রিপ্ট থাকলে সরাসরি প্লেয়ার চালু করো
      // একটু সময় নিয়ে রান করা যাতে আগের প্লেয়ারটি ডেস্ট্রয় হতে পারে
      setTimeout(initPlayer, 100); 
    }

  }, [src, poster]); // সোর্স পাল্টালে প্লেয়ার রিলোড হবে

  return (
    <div 
      id={containerId} 
      className="w-full h-full bg-black rounded-lg overflow-hidden"
      style={{ minHeight: "100%" }}
    ></div>
  );
};

export default PlayerJSPlayer;