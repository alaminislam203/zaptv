'use client';

import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import VideoPlayer from "../components/VideoPlayer";

const firebaseConfig = {
  apiKey: "AIzaSyA3bna8DVXzCLUU3YQoXColTC0-8T4LoF0",
  authDomain: "arenax-live-tv.firebaseapp.com",
  projectId: "arenax-live-tv",
  storageBucket: "arenax-live-tv.appspot.com",
  messagingSenderId: "302900762554",
  appId: "1:302900762554:web:98e23ca37c50868e1a6f83"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default function Home() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "channels"), (snapshot) => {
      const channelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChannels(channelsData);
      if (channelsData.length > 0 && !selectedChannel) {
        setSelectedChannel(channelsData[0]);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div>
      {selectedChannel && <VideoPlayer src={selectedChannel.url} />}
      <div>
        <h2>Channels</h2>
        <ul>
          {channels.map(channel => (
            <li key={channel.id} onClick={() => setSelectedChannel(channel)}>
              {channel.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
