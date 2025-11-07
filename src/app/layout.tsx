import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WebVitalsProvider } from "@/components/WebVitalsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Virtual Meeting Room",
  description: "AI-powered virtual meeting room with intelligent debate system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} antialiased`}>
        <WebVitalsProvider>
          {children}
        </WebVitalsProvider>
      </body>
    </html>
  );
}
