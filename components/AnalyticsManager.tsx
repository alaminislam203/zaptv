"use client";
import { useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../src/app/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AnalyticsManager() {
  const { user } = useAuth();

  useEffect(() => {
    // Log page view
    const logPageView = async () => {
      try {
        await addDoc(collection(db, "analytics_page_views"), {
          page: window.location.pathname,
          userId: user?.uid || "anonymous",
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
        });
      } catch (err) {
        console.error("Failed to log page view:", err);
      }
    };

    logPageView();
  }, [user]);

  return null;
}

export const logWatchEvent = async (userId: string | undefined, channelName: string, duration: number) => {
    try {
        await addDoc(collection(db, "analytics_watch_events"), {
            userId: userId || "anonymous",
            channel: channelName,
            duration: duration, // in seconds
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.error("Failed to log watch event:", err);
    }
};
