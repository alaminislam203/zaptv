import type { Metadata } from "next";

export const metadata: Metadata = {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
