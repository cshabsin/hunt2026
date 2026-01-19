import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skilldrasil",
  description: "PoE Skill Tree Renderer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
