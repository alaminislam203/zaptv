import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZapTV",
  description: "Live TV Streaming",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
