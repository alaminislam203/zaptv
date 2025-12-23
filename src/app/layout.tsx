import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    images: ["https://your-domain.com/logo.png"], // এখানে real domain দেবে
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
