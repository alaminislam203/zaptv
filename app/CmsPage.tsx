'use client';

import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, DocumentData } from 'firebase/firestore';
import { getApps, getApp, initializeApp } from 'firebase/app';

// NOTE: This Firebase config is duplicated from index.tsx. It would be best to move this to a shared file.
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

// This is a simple and safe renderer. It does not parse Markdown or complex HTML.
function renderContentAsHtml(content: string): string {
  if (!content) return '';
  // Escape basic HTML tags to prevent XSS and render basic formatting.
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');
}

interface CmsPageProps {
    pageSlug: string;
    onBack: () => void;
}

export default function CmsPage({ pageSlug, onBack }: CmsPageProps) {
    const [pageData, setPageData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPageData = async () => {
            if (!pageSlug) return;
            setLoading(true);
            try {
                const pageDocRef = doc(db, 'pages', pageSlug);
                const docSnap = await getDoc(pageDocRef);
                if (docSnap.exists()) {
                    setPageData(docSnap.data());
                } else {
                    setPageData(null); // Page not found
                }
            } catch (err) {
                console.error("Failed to fetch page", err);
                setPageData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchPageData();
    }, [pageSlug]);

    return (
        <div style={{ animation: "slideUp 0.25s ease" }}>
            <button onClick={onBack} style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                color: "#1a73e8", fontWeight: 700, fontSize: 14, cursor: "pointer",
                padding: "10px 0", marginBottom: 10, fontFamily: "inherit"
            }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                {loading ? (
                    <p>Loading...</p>
                ) : pageData ? (
                    <>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{pageData.title}</h1>
                        <div
                            style={{ lineHeight: 1.7, color: '#333' }}
                            dangerouslySetInnerHTML={{ __html: pageData.content ? renderContentAsHtml(pageData.content) : '' }}
                        />
                    </>
                ) : (
                    <p>Page not found.</p>
                )}
            </div>
        </div>
    );
}
