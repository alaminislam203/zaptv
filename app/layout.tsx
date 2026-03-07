'use client';

import type { Metadata } from "next";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Head from 'next/head';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') {
      const checkAdBlocker = () => {
        if (window.canRunAds === undefined) {
          // Ad blocker is active
          const warningDiv = document.createElement('div');
          warningDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 9999; display: flex; justify-content: center; align-items: center; text-align: center; color: white; font-family: sans-serif;">
              <div>
                <h1 style="font-size: 24px; margin-bottom: 20px;">Ad Blocker Detected!</h1>
                <p style="font-size: 16px; margin-bottom: 20px;">To continue using our site, please disable your ad blocker and refresh the page.</p>
                <button onClick="window.location.reload()" style="background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">I have disabled it</button>
              </div>
            </div>
          `;
          document.body.appendChild(warningDiv);
        }
      };

      // Run the check after a short delay
      setTimeout(checkAdBlocker, 1000);
    }
  }, [pathname]);

  const metadata: Metadata = {
    title: "ZapTV - Live TV Streaming",
    description: "Watch your favorite TV channels live on ZapTV. High-quality streaming for sports, news, and entertainment.",
    openGraph: {
      title: "ZapTV - Live TV Streaming",
      description: "Watch your favorite TV channels live on ZapTV. High-quality streaming for sports, news, and entertainment.",
      url: "https://zaptv.vercel.app",
      siteName: "ZapTV",
      images: [
        {
          url: "https://zaptv.vercel.app/og-image.png",
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "ZapTV - Live TV Streaming",
      description: "Watch your favorite TV channels live on ZapTV. High-quality streaming for sports, news, and entertainment.",
      images: ["https://zaptv.vercel.app/og-image.png"],
    },
  };

  return (
    <html lang="en">
      <Head>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
        <script src="/adblock.js"></script>
      </Head>
      <body>{children}</body>
    </html>
  );
}
