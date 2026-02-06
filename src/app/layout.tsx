import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Path Alias (@/) ব্যবহার করে আপডেট করা ইম্পোর্টস
import Notifications from "@/components/Notifications";
import AdScriptManager from "@/components/AdScriptManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthContext";
import AnalyticsManager from "@/components/AnalyticsManager";
import { LanguageProvider } from "@/components/LanguageContext";

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
    <html lang="en" suppressHydrationWarning> 
      <head>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <script src="https://richinfo.co/richpartners/in-page/js/richads-ob.js?pubid=1000941&siteid=386686" async></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Notifications />
              <AdScriptManager />
              <AnalyticsManager />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}