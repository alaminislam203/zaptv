import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrimeCast TV | Premium Subscription & Activation Portal",
  description: "Official portal for PrimeCast Live TV activation keys. Get 7, 15, or 30-day access to thousands of channels including Toffee Pro content. Secure, fast, and high-quality streaming on PC, Web, and Mobile.",
  keywords: [
    "PrimeCast TV", "IPTV", "Live TV", "IPTV Subscription", "Binance Pay IPTV", 
    "Activation Key", "7 Days TV", "30 Days TV", 
    "টফি প্রো", "টফি ওয়েব", "টফি পিসি", "পিসি টিভি", 
    "Toffee Pro", "Toffee Web", "Toffee PC", "PC TV Bangladesh"
  ],
  authors: [{ name: "PRIMEKAST_CORE" }],
  metadataBase: new URL("https://primecasttv.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PrimeCast TV | Premium Subscription Portal",
    description: "Get your activation keys for PrimeCast TV instantly. Stream Toffee Pro, Live Sports, and more on your PC or Web.",
    url: "/",
    siteName: "PrimeCast TV",
    images: [
      {
        url: "/images/showcase.png",
        width: 1200,
        height: 630,
        alt: "PrimeCast TV Interface Showcase",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrimeCast TV | Premium Subscription Portal",
    description: "Get your activation keys for PrimeCast TV instantly. High-quality PC TV streaming.",
    images: ["/images/showcase.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <div className="main-wrapper" suppressHydrationWarning>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
