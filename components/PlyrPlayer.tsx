"use client";
import React, { useEffect } from "react";

interface PlayerJSProps {
  src: string;
  poster?: string;
}

const PlayerJSPlayer: React.FC<PlayerJSProps> = ({ src, poster }) => {
  const containerId = "playerjs_container"; 

  useEffect(() => {
    // 1. প্লেয়ার তৈরি করার ফাংশন
    const createPlayer = () => {
      if ((window as any).Playerjs) {
        try {
          // আগের প্লেয়ার থাকলে সেটা সরিয়ে ফেলা (ক্লিনআপ)
          const existingContainer = document.getElementById(containerId);
          if (existingContainer) {
             existingContainer.innerHTML = ""; // আগের প্লেয়ার কন্টেন্ট মুছে ফেলা
          }

          // নতুন প্লেয়ার তৈরি
          new (window as any).Playerjs({
            id: containerId,
            file: src,
            poster: poster || "",
            autoplay: 1,
            // ডিফল্ট থিম বা কালার কনফিগ (প্রয়োজন হলে আনকমেন্ট করুন)
            // default_quality: "HD",
          });
        } catch (e) {
          console.error("PlayerJS Init Error:", e);
        }
      }
    };

    // 2. স্ক্রিপ্ট লোড এবং ম্যানেজমেন্ট
    const scriptId = "playerjs-script";
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement("script");
      // ফাইলের নাম সহজ করে 'playerjs.js' রাখা ভালো
      script.src = "/playerjs.js"; 
      script.id = scriptId;
      script.async = true;
      script.onload = createPlayer;
      document.body.appendChild(script);
    } else {
      // স্ক্রিপ্ট অলরেডি লোড থাকলে সরাসরি প্লেয়ার বানাও
      createPlayer();
    }

    // 3. ক্লিনআপ ( কম্পোনেন্ট আনমাউন্ট হলে )
    return () => {
       const container = document.getElementById(containerId);
       if(container) container.innerHTML = "";
    };

  }, [src, poster]); // সোর্স পাল্টালে আবার রান হবে

  return (
    <div 
      id={containerId} 
      className="w-full h-full bg-black rounded-lg overflow-hidden"
      style={{ minHeight: "100%", width: "100%" }}
    ></div>
  );
};

export default PlayerJSPlayer;