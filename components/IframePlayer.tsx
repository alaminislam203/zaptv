"use client";
import React from "react";

interface IframePlayerProps {
  src: string;
}

const IframePlayer = ({ src }: IframePlayerProps) => {
  return (
    <div className="relative w-full pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={src}
        title="Live TV"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default IframePlayer;
