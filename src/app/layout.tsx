import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Notifications from "./components/Notifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToffeePro - Live Sports & TV Streaming",
  description:
    "Watch Live Cricket, Football, News and Entertainment channels for free on ToffeePro.",
  openGraph: {
    title: "ToffeePro Live TV",
    description: "Watch unlimited live TV channels for free.",
    images: ["https://your-domain.com/logo.png"], 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Mixed Content Error (6006) ফিক্স করার জন্য এই লাইনটি যুক্ত করা হয়েছে */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <script src="https://richinfo.co/richpartners/in-page/js/richads-ob.js?pubid=1000941&siteid=386686" async></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Notifications />
      </body>
    </html>
  );
}
