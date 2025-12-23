"use client";
import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Player from "video.js/dist/types/player";

interface HLSPlayerProps {
  src: string;
}


const HLSPlayer = ({ src }: HLSPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // প্লেয়ার ইনিশিয়ালাইজ করা
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current?.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [
          {
            src: src,
            type: "application/x-mpegURL", // HLS এর জন্য টাইপ
          },
        ],
      }));
    } else {
      // যদি লিংক পরিবর্তন হয়, প্লেয়ার আপডেট করা
      const player = playerRef.current;
      player.src({ src: src, type: "application/x-mpegURL" });
    }
  }, [src]);

  // কম্পোনেন্ট আনমাউন্ট হলে প্লেয়ার ক্লিন করা
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
};

export default HLSPlayer;
