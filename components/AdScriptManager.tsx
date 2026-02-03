"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../src/app/firebase";

export default function AdScriptManager() {
  const [popunderScript, setPopunderScript] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data();
        setIsEnabled(config.adConfig?.showPopAds || false);
        setPopunderScript(config.adConfig?.popunderScript || "");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isEnabled && popunderScript) {
      // Extract script content or inject as HTML
      // The script usually contains (function(s){...})(...)
      // We can inject it by creating a script element

      const scriptMatch = popunderScript.match(/<script>(.*?)<\/script>/s);
      const scriptContent = scriptMatch ? scriptMatch[1] : popunderScript;

      try {
        const script = document.createElement("script");
        script.innerHTML = scriptContent;
        script.id = "popunder-ad-script";

        // Remove existing if any
        const existing = document.getElementById("popunder-ad-script");
        if (existing) existing.remove();

        document.body.appendChild(script);
      } catch (err) {
        console.error("Failed to inject ad script:", err);
      }
    }
  }, [isEnabled, popunderScript]);

  return null;
}
