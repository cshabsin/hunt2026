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
  title: "Balancing Act",
  description: "Puzzle UI Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="/hunt2026/"
          style={{
            position: "fixed",
            top: "10px",
            left: "10px",
            zIndex: 9999,
            textDecoration: "none",
            fontSize: "24px",
            color: "#333",
          }}
          title="Back to Hunt 2026"
        >
          ←
        </a>
        {children}
      </body>
    </html>
  );
}
