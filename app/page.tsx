'use client';

import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// 🔧 YOUR FIREBASE CONFIG
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

interface PageData {
    title: string;
    content: string;
}

interface PageProps {
    pageSlug: string;
    onBack: () => void;
}

export default function Page({ pageSlug, onBack }: PageProps) {
    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pageSlug) return;
        const fetchPage = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "pages", pageSlug);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPage(docSnap.data() as PageData);
                } else {
                    console.log("No such document!");
                    setPage(null);
                }
            } catch (error) {
                console.error("Error fetching page: ", error);
                setPage(null);
            }
            setLoading(false);
        };

        fetchPage();
    }, [pageSlug]);

    return (
        <div style={{ animation:"slideUp 0.25s ease", background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <button onClick={onBack} style={{
                display:"flex", alignItems:"center", gap:6,
                background:"none", border:"none", color:"#1a73e8",
                fontWeight:700, fontSize:14, cursor:"pointer",
                padding:"10px 0", marginBottom:10, fontFamily:"inherit"
            }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            {loading && <div>Loading page...</div>}

            {!loading && page && (
                <article>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{page.title}</h1>
                    {/* A simple way to render HTML content without dangerouslySetInnerHTML for basic cases */}
                    <div style={{ lineHeight: 1.6, color: '#333' }} dangerouslySetInnerHTML={{ __html: page.content }}></div>
                </article>
            )}

            {!loading && !page && <div>Page not found.</div>}
        </div>
    );
}
